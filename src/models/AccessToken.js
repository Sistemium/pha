export default {
  collection: 'AccessToken',
  schema: {
    accountId: String,
    token: String,
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
  },
};
