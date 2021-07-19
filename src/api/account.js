import lo from 'lodash';
import { Account } from '../models';

export async function getAccounts(ctx) {
  const { query } = ctx;
  const fields = Object.keys(Account.schema);
  ctx.body = await Account.findNormalized(lo.pick(query, fields));
}

export async function getOne(ctx) {

  const { params } = ctx;

  [ctx.body] = await Account.findNormalized({ id: params.id });

}

export async function createAccount(ctx) {

  const { body } = ctx.request;
  const data = Array.isArray(body) ? body : [body];

  const invalid = lo.find(data, account => {
    const { name } = account;
    return !name;
  });

  ctx.assert(!invalid, 400, 'Account must have name');

  const ids = await Account.merge(data);

  ctx.body = await Account.findNormalized({ id: { $in: ids } });

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
