import random from 'randomatic';
import { startURL, agentBuildByUserAgent, apiURL } from './helpers';
import dayjs from '../lib/dates';

import { Account, AccessToken } from '../models';

const { TOKEN_LIFETIME_DAYS = '365' } = process.env;

const TOKEN_LENGTH = 32;
const TOKEN_CHARS = 'abcdefgh';
const CODE_ATTEMPTS = 3;
const TOKEN_SUFFIX = '@pha';

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

  ctx.assert(attempts < CODE_ATTEMPTS, 401, 'SMS code expired');

  if (code !== smsCode) {
    await AccessToken.merge([{
      id,
      attempts: (attempts || 0) + 1,
    }]);
    ctx.throw(401, 'Wrong SMS code');
  }

  const token = `${random('0?', TOKEN_LENGTH, { chars: TOKEN_CHARS })}${TOKEN_SUFFIX}`;

  await AccessToken.merge([{
    id,
    code: null,
    token,
    expiresAt: dayjs().add(365, 'days'),
  }]);

  const account = await Account.findByID(accountId);
  const { num, org, programUrl, name } = account;
  const userAgent = ctx.get('user-agent');
  const version = agentBuildByUserAgent(userAgent);
  const program = () => {
    if (version > 200) return 'Entity';
    if (/^iSis/.test(userAgent)) return 'stc.entity';
    if (/^http/.test(programUrl)) return '';
    return programUrl;
  };

  ctx.body = {
    ID: num,
    accessToken: token,
    apiUrl: apiURL(org, userAgent),
    name,
    redirectUri: startURL(org, program(), token),
  };

}
