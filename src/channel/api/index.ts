import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { queryBalances } from "./balances";
import { loggerMiddware } from "./middlewares/logger";
import { Service } from "../../services";
import { sendAssets } from "./faucet";
import { Storage } from "../../util/storage";
import { Config } from "../../util/config";
import { symbolDetail, symbolInfo } from './info'

export interface ApiConfig {
  config: Config['channel']['api']
  service: Service;
  storage: Storage;
}

export default async function (config: ApiConfig) {
  const app = new Koa();
  const port = config.config.port;

  // middlewares
  app.use(bodyParser());
  app.use(loggerMiddware);

  // router
  const router = new Router();

  // ping-pong test
  router.get("/ping", async (ctx) => (ctx.body = "pong!"));

  // query assets balance
  router.get("/balances", queryBalances(config.service));

  // send tokens
  // disable this API
  // router.post("/faucet", sendAssets(config.service, config.storage, config.config));

  // query
  router.get("/symbols/:symbol", symbolInfo(config.service,config.storage))
  router.get("/symbols/:symbol/detail", symbolDetail(config.service,config.storage))

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(port);
}
