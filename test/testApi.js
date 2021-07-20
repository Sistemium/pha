import { assert, expect } from 'chai';
import supertest from 'supertest';

import app from '../src/api';
import { beforeEachReset, checkConnectMongo, disconnectMongo } from './helpers';

const api = supertest(app.callback());

describe('REST API', function () {

  before(checkConnectMongo);
  beforeEach(beforeEachReset);
  after(disconnectMongo);

  it('should accept object by POST', async function () {

    await api.get('/account')
      .expect(204);

    const props = {
      name: 'Money Star',
      mobileNumber: '0123456789',
      countryCode: '7',
      org: 'dev',
      info: 'test',
    };

    const { body: account } = await api
      .post('/account')
      .send(props)
      .expect(200);

    expect(account).to.deep.include(props);

    const { id: createdId } = account;

    await api.get('/account')
      .expect(200);

    props.info = null;

    const { body: updated } = await api
      .put(`/account/${createdId}`)
      .send(props)
      .expect(200);

    expect(updated.info).equals(null);

    await api.delete(`/account/${createdId}`)
      .expect(204);

  });

  it('should create object with defaults', async function () {

    const props = {
      name: 'Money Star',
    };

    const { body: account } = await api
      .post('/account')
      .send(props)
      .expect(200);

    expect(account.id).not.null;
    expect(account.cts).not.null;
    expect(account.ts).not.null;
    expect(account.num).equals(1);

  });

});
