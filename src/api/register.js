import { v4 } from 'uuid';

import { createAccounts } from '../services/accounting';
import { authorizeTokenController, createAuthTokenId } from '../services/authorizing';
import { Account } from '../models';

export async function registerInit(ctx) {

  const { mobileNumber, email: requestedEmail, name } = ctx.request.body;

  ctx.assert(mobileNumber || requestedEmail, 400, 'Need mobileNumber or email');
  ctx.assert(name, 400, 'Need name');

  const email = requestedEmail && requestedEmail.toLowerCase();

  const $or = [];
  if (mobileNumber) {
    $or.push({ mobileNumber });
  }
  if (email) {
    $or.push({ email });
  }
  const existing = await Account.findOne({ $or });

  ctx.assert(!existing, 403, 'Account already exists');

  ctx.body = {
    ID: await createAuthTokenId(v4(), { mobileNumber, email, name }),
  };

}

export async function confirmRegister(ctx) {

  const accessToken = await authorizeTokenController(ctx);
  const { accountId, accountData, token } = accessToken;
  const { email, mobileNumber, name } = accountData;

  // ctx.assert(!accountId, 400, 'Account already exists');
  ctx.assert(name, 500, 'Invalid account name');
  ctx.assert(email || mobileNumber, 500, 'Invalid account email or mobileNumber');

  await createAccounts([{ id: accountId, ...accountData }]);

  ctx.body = {
    accessToken: token,
    email,
    mobileNumber,
    name,
    accountId,
  };

}
