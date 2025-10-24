import { assert, expect } from 'chai';
import supertest from 'supertest';

import app from '../src/api';
import { beforeEachReset, checkConnectMongo, disconnectMongo } from './helpers';
import { AccessToken, Profile, Program } from '../src/models';

const api = supertest(app.callback());

describe('Auth API', function () {

  before(checkConnectMongo);
  before(beforeEachReset);
  after(disconnectMongo);

  it('should do auth', async function () {

    const mobileNumber = '0123456789';

    const props = {
      name: 'Money Star',
      mobileNumber,
      salesman: 123,
      countryCode: '7',
      org: 'dev',
      stringRoles: 'stg,auth:*,supervisor:s1,supervisor:s2,salesman:233,salesman:123,stg',
      roles: { stcTabs: [{ a: 1 }] },
    };

    const { body: account } = await api
      .post('/account')
      .send(props)
      .expect(200);

    const { body: { ID } } = await api
      .post(`/auth`)
      .send({ mobileNumber })
      .expect(200);

    expect(ID).to.be.not.null;

    await api
      .post('/auth')
      .send({ ID, smsCode: '1' })
      .expect(401);

    const { code } = await AccessToken.findByID(ID);

    expect(code.length).equals(6);

    const { body: authorized } = await api
      .post('/auth')
      .set('User-agent', 'iSisSales/209')
      .send({ ID, smsCode: code })
      .expect(200);

    expect(authorized).to.deep.include({
      ID: 1,
      apiUrl: 'https://socket2.sistemium.com/socket.io-client',
      name: 'Money Star',
      redirectUri: 'dev/Entity',
    });

  });

  it('should check roles', async function () {

    await createProfiles();
    const { token, accountId } = await AccessToken.findOne();

    expect(token).not.null;

    await api
      .get(`/roles?access-token=${token}`)
      .expect(200);

    await api
      .get(`/roles?access_token=${token}`)
      .expect(200);

    await api
      .get(`/roles/${token}`)
      .expect(200);

    const { body: roles } = await api
      .get('/roles')
      .set('authorization', token)
      .set('User-agent', 'iSisSales/250')
      .expect(200);

    await api
      .get(`/roles?access-token=1`)
      .expect(401);

    expect(roles.account).to.eql({
      code: '1',
      name: 'Money Star',
      'mobile-number': '0123456789',
      org: 'dev',
      authId: accountId,
    });

    expect(roles.token.expiresIn).to.greaterThan(1);
    expect(roles.roles).to.eql({
      auth: '*',
      authenticated: true,
      org: 'dev',
      salesman: [233, 123],
      stc: true,
      stg: true,
      supervisor: ['s1', 's2'],
      stcTabs: [{ a: 1 }],
      stcTabs2: [{ name: 'STMWKWebView' }],
    });

  });

  it('should require programCode for accounts with env', async function () {

    const mobileNumber = '0987654321';

    // Create account with env specified
    const props = {
      name: 'Test User',
      mobileNumber,
      org: 'dev',
      env: 'staging',
      stringRoles: 'stc',
    };

    await api
      .post('/account')
      .send(props)
      .expect(200);

    // Try to request auth code without programCode - should fail with 403
    await api
      .post('/auth')
      .send({ mobileNumber })
      .expect(403);

  });

  it('should allow auth with valid programCode and matching env', async function () {

    const mobileNumber = '0111222333';

    // Create a Program with staging env
    await Program.create({
      code: 'testapp',
      env: 'staging',
      config: { feature1: true },
    });

    // Create account with env specified
    const props = {
      name: 'Test User 2',
      mobileNumber,
      org: 'dev',
      env: 'staging',
      stringRoles: 'stc',
    };

    await api
      .post('/account')
      .send(props)
      .expect(200);

    // Request auth code with correct programCode
    const { body: { ID } } = await api
      .post('/auth')
      .send({ mobileNumber, programCode: 'testapp' })
      .expect(200);

    const { code } = await AccessToken.findByID(ID);

    // Verify with correct code - should succeed
    const { body: authorized } = await api
      .post('/auth')
      .set('User-agent', 'TestApp/100')
      .send({ ID, code, programCode: 'testapp' })
      .expect(200);

    expect(authorized).to.have.property('accessToken');
    expect(authorized).to.have.property('name', 'Test User 2');
    expect(authorized).to.have.property('config');
    expect(authorized.config).to.deep.equal({ feature1: true });

  });

  it('should reject auth with wrong env programCode', async function () {

    const mobileNumber = '0444555666';

    // Create a Program with production env
    await Program.create({
      code: 'prodapp',
      env: 'prod',
      config: {},
    });

    // Create account with staging env
    const props = {
      name: 'Test User 3',
      mobileNumber,
      org: 'dev',
      env: 'staging',
      stringRoles: 'stc',
    };

    await api
      .post('/account')
      .send(props)
      .expect(200);

    // Try to request auth code with programCode from different env - should fail with 403
    await api
      .post('/auth')
      .send({ mobileNumber, programCode: 'prodapp' })
      .expect(403);

  });

});

async function createProfiles() {

  await Profile.create({
    rolesRe: '(salesman|supervisor)',
    orgRe: 'dev',
    minVersion: 250,
    roles: [
      {
        role: 'stcTabs2',
        data: { name: 'STMWKWebView' },
        minBuild: 250,
        maxBuild: 250,
        rolesRe: 'stc',
        ord: 1,
      },
      {
        role: 'stcTabs2',
        data: { name: 'STMWKWebView2' },
        minBuild: 240,
        maxBuild: 245,
        rolesRe: null,
        ord: 1,
      },
      {
        role: 'stcTabs2',
        data: { name: 'STMWKWebView3' },
        rolesRe: 'none',
        ord: 1,
      }
    ],
  });

}
