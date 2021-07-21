export default {
  collection: 'Account',
  schema: {
    name: String,
    num: {
      type: Number,
      setOnInsert: true,
    },
    mobileNumber: String,
    countryCode: String,
    info: String,
    org: String,
    email: String,
    roles: {},
    salesman: Number,
    isDisabled: Boolean,
  },
};
