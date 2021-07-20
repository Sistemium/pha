import { Model } from 'sistemium-data';
import MongoStoreAdapter from 'sistemium-data/src/MongoStoreAdapter';
import CommonFieldsPlugin from 'sistemium-data/src/plugins/CommonFieldsPlugin';

import DefAccount from './Account';
import DefAccessToken from './AccessToken';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import fpOmitBy from 'lodash/fp/omitBy';

// FIXME: id and cts handling must be done in adapter
const INTERNAL_FIELDS_RE = /^(_.*|cts)$/;
const omitInternal = fpOmitBy((val, key) => INTERNAL_FIELDS_RE.test(key));

class PHAModel extends Model {

  normalizeItem(item, defaults = {}, overrides = {}) {
    const { schema } = this;
    const all = mapValues(schema, (keySchema, key) => {
      const res = overrides[key] || item[key] || defaults[key];
      if (res === undefined) {
        if (keySchema.default) {
          return res;
        }
        return null;
      }
      return res;
    });
    return omitInternal(all);
  }

  constructor(config) {
    const { schema = {} } = config;
    super({ ...config, schema: { id: String, ...schema } });
  }

  findNormalized(filter, options) {
    return this.find(filter, options)
      .then(res => map(res, item => this.normalizeItem(item)));
  }

}

const adapter = new MongoStoreAdapter({});

PHAModel.useStoreAdapter(adapter)
  .plugin(new CommonFieldsPlugin());

export const Account = new PHAModel(DefAccount);
export const AccessToken = new PHAModel(DefAccessToken);

export default {
  Account,
  AccessToken,
};

export async function connect(url) {
  return adapter.connect(url)
}

export async function disconnect() {
  return adapter.disconnect()
}

export function mongooseModel(model) {
  return adapter.getStoreModel(model.collection)
}