import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN!,
});

export const INITIAL_MARKET_STATE = {
  total_pool: 20,
  yes_pool: 20,
  no_pool: 0,
  yes_percent: 100,
  no_percent: 0,
};
