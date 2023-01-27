import { Account, mongooseModel } from '../models';

const mongoAccount = mongooseModel(Account);

export async function createAccounts(data = []) {
  const num = await nextNum();

  const ids = await Account.merge(data.map((item, idx) => ({
    num: num + idx,
    ...item,
  })));

  return Account.findNormalized({ id: { $in: ids } });
}


async function nextNum() {
  const [max] = await mongoAccount.find({})
    .limit(1)
    .sort({ num: -1 });
  return ((max && max.num) || 0) + 1;
}
