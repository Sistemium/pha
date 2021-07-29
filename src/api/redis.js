import Redis from 'ioredis';

const { REDIS_URL, REDIS_EXPIRE } = process.env;
const AUTH_EXPIRE = parseInt(REDIS_EXPIRE, 0) || 300;

const redis = REDIS_URL && new Redis(REDIS_URL, {
  enableOfflineQueue: false,
});

export default redis;

export async function redisSet(key, value) {
  if (!redis) {
    return;
  }
  await redis.set(key, JSON.stringify(value), 'EX', AUTH_EXPIRE)
    .catch(() => {});
}

export async function redisGet(key) {
  if (!redis) {
    return null;
  }
  const res = await redis.get(key)
    .catch(() => null);
  return res && JSON.parse(res);
}
