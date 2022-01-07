import { Service } from '../../services'
import { Storage } from '../../util/storage'
import Router from 'koa-router'

export const symbolInfo = (service: Service, storage: Storage): Router.IMiddleware => async (
  ctx
) => {
  if (!ctx?.params?.symbol) {
    ctx.response.body = 'params error, address required.'
    return
  }
  const r = await storage.querySymbolInfo(ctx?.params?.symbol)
  ctx.response.body = {
    code: 200,
    message: r,
  }
}


export const symbolDetail = (service: Service, storage: Storage): Router.IMiddleware => async (
  ctx
) => {
  if (!ctx?.params?.symbol) {
    ctx.response.body = 'params error, address required.'
    return
  }
  const r = await storage.querySymbolDetail(ctx?.params?.symbol)
  ctx.response.body = {
    code: 200,
    message: r,
  }
}
