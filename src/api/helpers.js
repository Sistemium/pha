import filter from 'lodash/filter';

const API_ROOT = 'https://api.sistemium.com';

const ORG_API_MAP = new Map([
  ['dev', 'api2'],
  ['dr50', 'api2'],
]);

export function agentBuildByUserAgent(userAgent) {
  const [first] = userAgent.match(/^[^ ]+/);
  if (!first) {
    return 0;
  }
  return parseInt(first.match(/[\d]+$/)[0], 0) || 0;
}

export function apiURL(org, userAgent = 'iSistemium') {
  const version = agentBuildByUserAgent(userAgent) || 0;

  if (version <= 200) {
    return [
      API_ROOT,
      orgToAPIRoot(org),
      userAgent.match(/iSis/) ? 'v1' : 'v3',
      org
    ].join('/');
  }

  return [
    'https://socket',
    ['dr50', 'dev', 'ae', 'dr50p'].includes(org) ? '2' : '',
    '.sistemium.com/socket.io-client',
  ].join('');

}

export function orgToAPIRoot(name) {
  return ORG_API_MAP.get(name) || 'api';
}

export function startURL(org, prg, token) {

  const program = prg || 'tp';

  const site = () => {
    if (program === 'Entity') return '';
    if (/(^|.*[/])tp$/.test(program)) return 'https://sistemium.com';
    return `https://api.sistemium.com/${orgToAPIRoot(org)}'/v1`
  };

  return filter([
    site(),
    org,
    program,
    /(^|.*[/])tp$/.test(program) && `access-token=${token}`,
  ]).join('/');
}
