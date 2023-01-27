import { createAccounts } from '../services/accounting';
import { authorizeTokenController, createAuthTokenId } from '../services/authorizing';
import { Account } from '../models';

export async function registerInit(ctx) {

  const { mobileNumber, email, name } = ctx.request.body;

  ctx.assert(mobileNumber || email, 400, 'Need mobileNumber or email');
  ctx.assert(!mobileNumber || !email, 400, 'Need mobileNumber or email, not both');
  ctx.assert(name, 400, 'Need name');

  const filter = { mobileNumber, email };
  if (!mobileNumber) {
    delete filter.mobileNumber;
  }
  if (!email) {
    delete filter.email;
  }
  const existing = await Account.findOne(filter);

  ctx.assert(!existing, 403, 'Account already exists');

  ctx.body = {
    ID: await createAuthTokenId(null, { mobileNumber, email, name }),
  };

}

export async function confirmRegister(ctx) {

  const accessToken = await authorizeTokenController(ctx);
  const { accountId, accountData } = accessToken;
  const { email, mobileNumber, name } = accountData;

  ctx.assert(!accountId, 400, 'Account already exists');
  ctx.assert(name, 400, 'Invalid account name');
  ctx.assert(email || mobileNumber, 500, 'Invalid account email or mobileNumber');

  const [created] = await createAccounts([{ ...accountData }]);

  ctx.body = {
    accessToken: accessToken.token,
    email,
    mobileNumber,
    name,
    accountId: created.id,
  };

}
