import { mongoose } from 'sistemium-data/src/MongoStoreAdapter';
import { connect } from '../src/models';
import { MockMongoose } from 'mock-mongoose';
import { disconnect } from 'sistemium-mongo/lib/mongoose';

const mockMongoose = new MockMongoose(mongoose);

export async function checkConnectMongo() {
  await mockMongoose.prepareStorage();
  await connect();
}

export async function disconnectMongo() {
  await disconnect();
}

export async function beforeEachReset() {
  await mockMongoose.helper.reset();
}
