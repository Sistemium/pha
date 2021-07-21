import { AccessToken, Account, Profile } from '../models';
import dayjs from '../lib/dates';
import { agentBuildByUserAgent } from './helpers';
import mapValues from 'lodash/mapValues';
import uniq from 'lodash/uniq';
import groupBy from 'lodash/groupBy';
import flatten from 'lodash/flatten';
import filter from 'lodash/filter';

export default async function (ctx) {

  const authorization = ctx.get('authorization');
  const agentBuild = agentBuildByUserAgent(ctx.get('user-agent'));
  const { id } = ctx.params;
  const token = ctx.query.accessToken
    || ctx.query['access-token']
    || ctx.query['access_token']
    || id
    || authorization;

  ctx.assert(token, 401);

  const accessToken = await AccessToken.findOne({ token });

  ctx.assert(accessToken, 401);

  const account = await Account.findByID(accessToken.accountId);

  ctx.assert(account, 401);
  ctx.assert(!account.isDisabled, 403, 'Account blocked');

  const { expiresAt } = accessToken;
  const expiresDayJS = dayjs(expiresAt);

  const roles = {
    ...accountRoles(account),
    ...(account.roles || {}),
  };

  ctx.body = {
    account: {
      code: (account.num || 0).toFixed(0),
      name: account.name,
      email: account.email,
      'mobile-number': account.mobileNumber,
      org: account.org,
      authId: account.id,
    },
    token: {
      expiresAt: expiresAt ? expiresDayJS.format('YYYY-MM-DDTHH:mm:ssZ') : null,
      expiresIn: expiresAt ? expiresDayJS.diff(new Date(), 'second') : null,
    },
    roles: {
      ...(await accountProfileRoles(account, roles, agentBuild)),
      ...roles,
    },
  };

}

async function accountProfileRoles(account, roles, agentBuild) {

  const { org } = account;
  const keys = Object.keys(roles || {});

  const profiles = await Profile.find({
    $where: `function () {
      const rolesRe = RegExp(this.rolesRe);
      return RegExp(this.orgRe).test('${org}')
        && ${JSON.stringify(keys)}.find(role => rolesRe.test(role));
    }`
  });

  const profileRoles = flatten(profiles.map(({ roles }) => filter(roles, profileRoleFilter)));
  const res = groupBy(profileRoles, 'role');

  return mapValues(res, items => items.map(({ data }) => data));

  function profileRoleFilter(profileRole) {
    const {
      minBuild, maxBuild,
      rolesRe,
    } = profileRole;
    const re = new RegExp(rolesRe);
    return (!rolesRe || keys.find(key => re.test(key)))
      && (!minBuild || minBuild <= agentBuild)
      && (!maxBuild || maxBuild >= agentBuild);
  }

}

function accountRoles(account) {

  const { info, salesman } = account;

  const arrayRoles = parseInfoRoles(info);

  if (salesman) {
    arrayRoles.salesman = [...(arrayRoles.salesman || []), salesman];
  }

  const roles = mapValues(arrayRoles, val => {
    const res = uniq(val);
    return res.length > 1 ? res : res[0];
  });

  return {
    authenticated: true,
    org: account.org,
    stc: true,
    ...roles,
  };

}

function parseInfoRoles(info) {

  const split = (info || '').split(',');
  const res = {};

  split.forEach(item => {
    const [role, value] = item.split(':');
    const anotherValue = res[role] || [];
    res[role] = [...anotherValue, parseValue(value)];
  });

  return res;

}

function parseValue(string) {
  if (!string) {
    return true;
  }
  if (!string.match(/[^\d]/)) {
    return parseInt(string, 0);
  }
  return string;
}
