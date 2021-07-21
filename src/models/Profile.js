export default {
  collection: 'Profile',
  schema: {
    name: String,
    rolesRe: String,
    orgRe: String,
    minBuild: Number,
    maxBuild: Number,
    roles: [
      {
        _id: false,
        role: String,
        data: {},
        minBuild: Number,
        maxBuild: Number,
        rolesRe: String,
        ord: Number,
      }
    ],
  },
};
