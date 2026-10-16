import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// ---------------------------------------------------------------------------
// In-memory fallback (used when the Upstash env vars are missing)
// ---------------------------------------------------------------------------
const memStore = new Map<string, unknown>();
const memZSets = new Map<string, Map<string, number>>();
const memLists = new Map<string, unknown[]>();

const memRedis = {
  async get(key: string) { return memStore.get(key) ?? null; },
  async set(key: string, value: unknown) { memStore.set(key, value); return 'OK'; },
  async zadd(key: string, entry: { score: number; member: string }) {
    if (!memZSets.has(key)) memZSets.set(key, new Map());
    memZSets.get(key)!.set(entry.member, entry.score);
    return 1;
  },
  async zrange(key: string, min: number, max: number, opts?: { rev?: boolean }) {
    const zset = memZSets.get(key);
    if (!zset) return [];
    const sorted = [...zset.entries()].sort((a, b) => opts?.rev ? b[1] - a[1] : a[1] - b[1]);
    const slice = max === -1 ? sorted : sorted.slice(min, max + 1);
    return slice.map(([member]) => member);
  },
  async lpush(key: string, ...values: unknown[]) {
    if (!memLists.has(key)) memLists.set(key, []);
    memLists.get(key)!.unshift(...values);
    return memLists.get(key)!.length;
  },
  async lrange(key: string, start: number, stop: number) {
    const list = memLists.get(key) ?? [];
    return stop === -1 ? list.slice(start) : list.slice(start, stop + 1);
  },
};

export const redis = (url && token)
  ? new Redis({ url, token })
  : (console.warn('⚠️ Upstash env vars missing: using the in-memory fallback'), memRedis as any);
