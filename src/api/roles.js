import { AccessToken } from '../models';

export default async function (ctx) {

  const authorization = ctx.get('authorization');
  const { id } = ctx.params;
  const token = ctx.query.accessToken
    || ctx.query['access-token']
    || ctx.query['access_token']
    || id
    || authorization;

  ctx.assert(token, 401);

  const accessToken = await AccessToken.findOne({ token });

  ctx.assert(accessToken, 401);

  ctx.body = {
    account: {},
    roles: {},
    token: {},
  };

}
