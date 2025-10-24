import { startURL, agentBuildByUserAgent, apiURL } from './helpers';
import dayjs from '../lib/dates';

import { Account, AccessToken, mongooseModel, Program } from '../models';
import { assertEmail } from '../services/validating';
import { authorizeToken, authorizeTokenController, CODE_ATTEMPTS, createAuthTokenId } from '../services/authorizing';

const BAD_ATTEMPTS_MINUTES = parseInt(process.env.BAD_ATTEMPTS_MINUTES || '3', 0);

export default async function (ctx) {

  const {
    mobileNumber,
    email,
    ID,
    smsCode,
    code,
    emailCode,
  } = ctx.request.body;

  const authCode = code || smsCode || emailCode;

  if (mobileNumber || email) {
    return login(ctx);
  }

  if (ID && authCode) {
    return token(ctx);
  }

  console.error('auth:invalid:credentials', JSON.stringify(ctx.request.body))

  ctx.throw(400, 'Either mobileNumber or ID required');

}

const AUTH_CODE_RE = /authcode=(\d+)/;

async function login(ctx) {

  const { mobileNumber, email } = ctx.request.body;
  const accountFilter = {};

  if (mobileNumber) {
    accountFilter.mobileNumber = mobileNumber;
  }

  if (email) {
    accountFilter.email = assertEmail(ctx, email);
  }

  const [account] = await Account.find(accountFilter);
  console.info('auth:login', JSON.stringify(ctx.request.body))
  ctx.assert(account, 404, `Unknown ${mobileNumber ? 'mobileNumber' : 'email'}`);

  if (await shouldSuspendAccount(account)) {
    ctx.throw(403, 'Account suspended');
  }

  const { id: accountId, info } = account;
  const [, fixedCode] = (info || '').match(AUTH_CODE_RE) || [];

  const tokenData = {
    mobileNumber,
    email,
    accountId,
  };

  ctx.body = { ID: await createAuthTokenId(accountId, tokenData, fixedCode) };

}

export async function token(ctx) {

  const accessToken = await authorizeTokenController(ctx);

  const { accountId } = accessToken;
  ctx.assert(accountId, 400, 'Account is not registered');

  const account = await Account.findOne({ id: accountId });
  ctx.assert(account, 400, 'Account is not registered');

  const { programCode } = ctx.request.body;
  const { num, org, programUrl, name, env } = account;

  // If account has env specified, programCode is required and must match
  if (env) {
    ctx.assert(programCode, 403, 'programCode is required for this account');
    const program = await Program.findOne({ code: programCode, env });
    ctx.assert(program, 403, 'Invalid programCode or environment mismatch');
  }

  const userAgent = ctx.get('user-agent');
  const version = agentBuildByUserAgent(userAgent);
  const program = () => {
    if (version > 200) return 'Entity';
    if (/^iSis/.test(userAgent)) return 'stc.entity';
    if (/^http/.test(programUrl)) return '';
    return programUrl;
  };

  await Account.merge([{
    id: accountId,
    lastAuth: new Date(),
  }]);

  const { token } = accessToken;

  ctx.body = {
    ID: num,
    accessToken: token,
    apiUrl: apiURL(org, userAgent),
    name,
    redirectUri: startURL(org, program(), token),
  };

  if (programCode) {
    const program = await Program.findOne({ code: programCode, env: account.env || 'prod' })
    if (program) {
      ctx.body.config = program.config || {};
    }
  }

}

async function shouldSuspendAccount(account) {
  const badTokens = await mongooseModel(AccessToken)
    .find({
      // attempts doesn't matter we don't want to send too many sms
      accountId: account.id,
      code: { $ne: null },
      cts: { $gt: dayjs().add(-BAD_ATTEMPTS_MINUTES, 'minutes').toISOString() },
    })
    .sort({ ts: -1 });
  return badTokens.length >= CODE_ATTEMPTS;
}
