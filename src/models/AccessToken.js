export default {
  collection: 'AccessToken',
  schema: {
    accountId: String,
    accountData: {
      name: String,
      mobileNumber: String,
      email: String,
    },
    token: {
      type: String,
      unique: true,
    },
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
  },
};
