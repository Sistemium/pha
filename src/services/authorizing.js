import sms from '../api/sms';
import sendmail from '../api/email';
import { AccessToken } from '../models';
import dayjs from '../lib/dates';
import randomString from '../lib/random';
import log from 'sistemium-debug';

const { error } = log('authorizing');
const {
  SMS_ORIGIN,
  TOKEN_SUFFIX = '@pha',
  TOKEN_CHARS = 'abcdefgh',
  FIXED_AUTH_CODE,
} = process.env;

const TOKEN_LIFETIME_DAYS = parseInt(process.env.TOKEN_LIFETIME_DAYS || '365', 10);
const TOKEN_LENGTH = parseInt(process.env.TOKEN_LENGTH || '32', 10);
export const CODE_ATTEMPTS = parseInt(process.env.CODE_ATTEMPTS || '3', 10);

export async function createAuthTokenId(accountId, accountData, fixedCode = FIXED_AUTH_CODE) {

  const { mobileNumber, email } = accountData;

  const code = fixedCode || randomString('0', 6);

  if (mobileNumber && SMS_ORIGIN && !fixedCode) {
    try {
      await sms(mobileNumber, code);
    } catch (e) {
      error('sms:', e.message);
      throw Error('Error sending SMS');
    }
  }

  if (email && !fixedCode) {
    await sendmail(email, code);
  }

  const { id } = await AccessToken.create({
    code,
    accountId,
    accountData,
    mobileNumber,
    email,
  });

  return id;

}


export async function authorizeToken(id, code) {

  const authToken = await AccessToken.findOne({ id });

  if (!authToken) {
    throw Error('Invalid auth token id');
  }

  const { attempts } = authToken;

  if (attempts >= CODE_ATTEMPTS) {
    throw Error('Auth code is expired');
  }

  if (authToken.code !== code) {
    await AccessToken.merge([{
      id,
      attempts: (attempts || 0) + 1,
    }]);
    throw Error('Invalid auth code');
  }

  const token = randomString('0?', TOKEN_LENGTH, { chars: TOKEN_CHARS, suffix: TOKEN_SUFFIX });

  await AccessToken.merge([{
    id,
    code: null,
    token,
    expiresAt: dayjs().add(TOKEN_LIFETIME_DAYS, 'days'),
  }]);

  return AccessToken.findOne({ id });

}


export async function authorizeTokenController(ctx) {

  const { ID, smsCode, emailCode, code } = ctx.request.body;
  const authCode = code || smsCode || emailCode;

  ctx.assert(ID, 400, 'Need ID');
  ctx.assert(authCode, 400, 'Need code or smsCode or emailCode');

  try {
    const res = await authorizeToken(ID, authCode);
    return res;
  } catch (e) {
    ctx.throw(400, e.message);
  }

}
