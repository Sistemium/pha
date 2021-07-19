import random from 'randomatic';

import { Account, AccessToken } from '../models';

export default async function (ctx) {

  const {
    mobileNumber,
    ID,
    smsCode,
  } = ctx.request.body;

  if (mobileNumber) {
    return login(ctx);
  }

  if (ID && smsCode) {
    return token(ctx);
  }

  ctx.throw(400);

}

export async function login(ctx) {

  const { mobileNumber } = ctx.request.body;

  const [account] = await Account.find({ mobileNumber });
  ctx.assert(account, 404, 'Unknown mobile number');

  const { id } = await AccessToken.create({
    accountId: account.id,
    code: random('0', 6),
  });

  ctx.body = { ID: id };

}

export async function token(ctx) {

  const { ID: id, smsCode } = ctx.request.body;
  const [accessToken] = await AccessToken.find({ id });

  ctx.assert(accessToken, 404);

  const { code, accountId, attempts } = accessToken;

  ctx.assert(attempts < 3, 401, 'SMS code expired');

  if (code !== smsCode) {
    await AccessToken.merge([{
      id,
      attempts: (attempts || 0) + 1,
    }]);
    ctx.throw(401, 'Wrong SMS code');
  }

  const token = `${random('0?', 32, { chars: 'abcdefgh' })}@pha`;

  await AccessToken.merge([{
    id,
    code: null,
    token,
    attempts: (attempts || 0) + 1,
  }]);

  const account = await Account.findByID(accountId);

  ctx.body = {
    ID: '24',
    accessToken: token,
    apiUrl: 'https://api.sistemium.com/api/v3/r50',
    name: account.name,
    // redirectUri: 'https://sistemium.com/r50/tp/?access-token=8d8903450f8093ac8fdb723330ad5c9c@pha'
  };

}
