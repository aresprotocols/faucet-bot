import { Service } from '../../services'
import Router from 'koa-router'

export const queryBalances = (service: Service): Router.IMiddleware => async (
  ctx
) => {
  ctx.response.body = await service.queryBalance();
};
