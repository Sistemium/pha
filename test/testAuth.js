import { assert, expect } from 'chai';
import supertest from 'supertest';

import app from '../src/api';
import { beforeEachReset, checkConnectMongo, disconnectMongo } from './helpers';
import { AccessToken } from '../src/models';

const api = supertest(app.callback());

describe('Auth API', function () {

  before(checkConnectMongo);
  beforeEach(beforeEachReset);
  after(disconnectMongo);

  it('should do auth', async function () {

    const mobileNumber = '0123456789';

    const props = {
      name: 'Money Star',
      mobileNumber,
      countryCode: '7',
      org: 'dev',
      info: 'test',
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

});
