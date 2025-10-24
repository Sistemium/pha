import { expect } from 'chai';

import models from '../src/models';
import { checkConnectMongo, disconnectMongo } from './helpers';

describe('Mongo models', function () {

  before(checkConnectMongo);
  after(disconnectMongo);

  it('should create Account', async function () {

    const props = {
      id: 'test-account',
      name: 'Test',
      mobileNumber: '123456789',
      salesman: 12345678
    };

    const { Account } = models;

    const inserted = await Account.createOne(props);

    expect(inserted).to.deep.include(props);

    await Account.destroy(props.id);

  });

});
