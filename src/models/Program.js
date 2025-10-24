export default {
  collection: 'Program',
  schema: {
    name: String,
    code: String,
    env: String,
    config: Object,
  },
  indexes: [{ code: 1 }],
};
