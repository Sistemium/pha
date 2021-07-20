import lo from 'lodash';
import { Account, mongooseModel } from '../models';

export async function getAccounts(ctx) {
  const { query } = ctx;
  const fields = Object.keys(Account.schema);
  ctx.body = await Account.findNormalized(lo.pick(query, fields));
  if (!ctx.body.length) {
    ctx.status = 204;
  }
}

export async function getOne(ctx) {

  const { params } = ctx;

  [ctx.body] = await Account.findNormalized({ id: params.id });

}

export async function createAccount(ctx) {

  const { body } = ctx.request;
  const isArray =  Array.isArray(body);
  const data = isArray ? body : [body];

  const invalid = lo.find(data, account => {
    const { name } = account;
    return !name;
  });

  ctx.assert(!invalid, 400, 'Account must have name');

  const num = await nextNum();

  const ids = await Account.merge(data.map((item, idx) => ({
    num: num + idx,
    ...item,
  })));

  const result = await Account.findNormalized({ id: { $in: ids } });

  ctx.body = isArray ? result : result[0];

}

export async function updateOne(ctx) {

  const { body } = ctx.request;
  const { params: { id } } = ctx;

  ctx.assert(!Array.isArray(body), 400, 'Can not update array');

  const attrs = { ...Account.normalizeItem(body), id };
  ctx.assert(attrs.name, 400, 'Account must have name');

  await Account.merge([attrs]);

  [ctx.body] = await Account.findNormalized({ id });

}

export async function deleteOne(ctx) {

  const { params } = ctx;

  await Account.deleteOne({ id: params.id });

  ctx.status = 204;

}

const mongoAccount = mongooseModel(Account);

async function nextNum() {
  const [max] = await mongoAccount.find({})
    .sort({ num: -1 });
  return ((max && max.num) || 0) + 1;
}
