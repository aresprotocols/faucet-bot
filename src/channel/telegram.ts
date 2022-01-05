import { Config } from '../util/config'
import { Storage } from '../util/storage'
import { Service } from '../services'
import { ChannelBase } from './base'
import * as sdk from 'telegraf'
import { Message } from 'typegram'
import { Keyring } from '@polkadot/api'

interface TelegramChannelConfig {
  config: Config['channel']['telegram'];
  storage: Storage;
  service: Service;
}

export class TelegramChannel extends ChannelBase {
  private client: sdk.Telegraf
  private service: Service
  private config: Config['channel']['telegram']
  private keyring: Keyring

  constructor (config: TelegramChannelConfig, keyring: Keyring) {
    super('telegram', config.storage)

    this.config = config.config
    this.service = config.service
    this.keyring = keyring
    // create telegram client
    this.client = new sdk.Telegraf(this.config.token)
    this.sendSuccessMessage = this.sendSuccessMessage.bind(this)
  }

  async start () {
    this.service.registerMessageHandler(this.channelName, this.sendSuccessMessage)
    this.client.start((ctx) => ctx.reply('Welcome'))
    const usage = this.service.usage().replace(/!/g, '/')

    this.client.help((ctx) => ctx.reply(usage))

    this.client.command('/faucet', async (ctx) => {
      ctx.reply(usage)
    })

    this.client.command('/balance', async (ctx) => {
      const msg = ctx.message as Message.TextMessage
      if (!msg.text) return
      const balances = await this.service.queryBalance();
      ctx.reply(
        this.service.getMessage("balance", {
          account: "",
          balance: balances
            .map((item) => `${item.token}: ${item.balance}`)
            .join(", "),
        })
      );
    })

    this.client.command('/drip', async (ctx) => {
      const msg = ctx.message as Message.TextMessage
      const account = msg.from?.id;
      let name = account + ''

      if (msg.from && msg.from.username){
        name = `${account}_${ctx.from.username}`;
      }else if (msg.from && msg.from.last_name){
        name = `${account}_${msg.from.first_name} ${msg.from.last_name}`;
      }else if (msg.from){
        name = `${account}_${msg.from.first_name}`;
      }

      if (!msg.text) return
      const [_, address] = this.getCommand(msg.text)
      try {
        this.keyring.decodeAddress(address, false, this.service.getSS58())
      } catch (e) {
        ctx.reply(this.service.getErrorMessage('ADDRESS_ERROR', { address }))
        return
      }
      try {
        await this.service.faucet({
          strategy: "normal",
          address: address,
          channel: {
            chatId: msg.chat.id.toString(),
            name: this.channelName,
            account: `${account}`,
            accountName: name,
          },
        });
        ctx.reply(this.service.getMessage('tips'))
      } catch (e) {
        ctx.reply(
          e.message
            ? e.message
            : this.service.getErrorMessage("COMMON_ERROR", { account })
        );
      }
    })

    this.client.on('message', (ctx) => {
      this.messageHandler(ctx)
    })
    await this.client.launch()
  }

  sendSuccessMessage (
    channel: Record<string, string>,
    amount: string,
    tx: string
  ) {
    this.client.telegram.sendMessage(channel.chatId,
      this.service.getMessage("success", {
        amount,
        tx,
        account: channel.accountName,
      }))
  }

  async messageHandler (ctx: sdk.Context) {
    const msg = ctx.message as Message.TextMessage
    const chatId = msg.chat.id
    if (!msg.text) return
    const [command, param1] = this.getCommand(msg.text)
    console.log(`${command}, ${param1}`)
    //ctx.reply('Help message')
  }
}
