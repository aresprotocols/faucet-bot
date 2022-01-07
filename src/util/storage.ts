import redis, { RedisClient, ClientOpts } from "redis";
import dayjs, { OpUnitType } from "dayjs";
import { promisify } from "util";
import { Database, OPEN_READWRITE } from 'sqlite3'
import {User} from 'typegram'

interface SqliteOpts{
  path: string
}

interface StorageOptions {
  redis: ClientOpts;
  sqlite: SqliteOpts;
}

export class Storage {
  private client: RedisClient;
  private db: Database
  private get: (key: string) => Promise<string | null>;
  private incr: (key: string) => Promise<number>;
  private decr: (key: string) => Promise<number>;
  private expireat: (key: string, timestamp: number) => Promise<number>;

  constructor({ redis: redisConfig, sqlite: sqliteConfig }: StorageOptions) {
    this.client = redis.createClient(redisConfig);
    this.db = new Database(sqliteConfig.path, OPEN_READWRITE)
    this.get = promisify(this.client.get).bind(this.client);
    this.incr = promisify(this.client.incr).bind(this.client);
    this.decr = promisify(this.client.decr).bind(this.client);
    this.expireat = promisify(this.client.expireat).bind(this.client);
  }

  async incrKeyCount(
    key: string,
    frequency: [string, OpUnitType]
  ): Promise<number> {
    console.log('inc', key)
    const amount = await this.incr(key);

    const expireTime = dayjs()
      .add(Number(frequency[0]), frequency[1])
      .startOf(frequency[1])
      .unix();

    // preset expire time
    await this.expireat(key, expireTime);

    return amount;
  }

  async decrKeyCount(key: string): Promise<number> {
    console.log('desc', key)
    return this.decr(key);
  }

  async getKeyCount(key: string): Promise<number> {
    const result = await this.get(key);

    return Number(result) || 0;
  }

  async insertOrUpdateUser (user: User, address: string, token:string, amount: number) {
    const query = function (db: Database, sql: string, params: any) {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
      })
    }

    const run = function (db: Database, sql: string, params: any) {
      return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve(undefined)
          }
        })
      })
    }

    try{
      const row = await query(this.db,'select id from user where id = $id and address = $address and token = $token', {
        '$id': user.id.toString(),
        '$address': address,
        '$token': token,
      })
      if (row) {
        // update data
        await run(this.db, 'UPDATE user SET total_request = total_request + 1, amount = amount + $amount WHERE id = $id and address = $address and token = $token', {
          '$id': user.id.toString(),
          '$address': address,
          '$token': token,
          '$amount': amount
        })
      } else {
        // insert data
        const obj = {
          '$id': user.id.toString(),
          '$address': address,
          '$token': token,
          '$username': user.username,
          '$last_name': user.last_name,
          '$first_name': user.first_name,
          '$total_request': 1,
          '$amount': amount
        }
        await run(this.db, 'insert into user (id, address, token, username, last_name, first_name, total_request, amount) values ($id, $address, $token, $username, $last_name, $first_name, $total_request, $amount)', obj)
      }
    } catch (e) {
      console.log(`err:${e}`)
    }
  }
}
