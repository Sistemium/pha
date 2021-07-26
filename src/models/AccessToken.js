export default {
  collection: 'AccessToken',
  schema: {
    accountId: String,
    token: {
      type: String,
      unique: true,
    },
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
  },
};
