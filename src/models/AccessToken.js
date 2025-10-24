export default {
  collection: 'AccessToken',
  schema: {
    accountId: String,
    accountData: {
      name: String,
      mobileNumber: String,
      email: String,
    },
    token: String,
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
  },
  indexes: [{ token: 1 }],
};
