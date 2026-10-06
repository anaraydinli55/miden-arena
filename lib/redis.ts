import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// ---------------------------------------------------------------------------
// In-memory fallback (env yoksa)
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
  : (console.warn('⚠️ Upstash env eksik — in-memory fallback aktif'), memRedis as any);

// ---------------------------------------------------------------------------
// redisCommand — REST API üzerinden ham komut (src/lib/redis.ts uyumluluğu)
// ---------------------------------------------------------------------------
export async function redisCommand(command: string, ...args: (string | number)[]) {
  if (!url || !token) {
    const key = String(args[0]);
    if (command.toUpperCase() === 'GET') return memStore.get(key) ?? null;
    if (command.toUpperCase() === 'SET') { memStore.set(key, args[1]); return 'OK'; }
    if (command.toUpperCase() === 'INCRBYFLOAT') {
      const val = Number(memStore.get(key) ?? 0) + Number(args[1]);
      memStore.set(key, val); return val;
    }
    if (command.toUpperCase() === 'LPUSH') {
      if (!memLists.has(key)) memLists.set(key, []);
      memLists.get(key)!.unshift(args[1]); return memLists.get(key)!.length;
    }
    return null;
  }
  try {
    const formattedArgs = args.map(a => encodeURIComponent(String(a))).join('/');
    const res = await fetch(`${url}/${command}/${formattedArgs}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    });
    const data = await res.json();
    return (data as { result: unknown }).result;
  } catch (e) { console.error('Redis command error:', e); return null; }
}

export async function recordBetToLiveMemory(
  predictionId: string, outcomeValue: string, amount: number, tokenSymbol: string
) {
  await redisCommand('INCRBYFLOAT', `pred:${predictionId}:volume`, amount);
  await redisCommand('INCRBYFLOAT', `pred:${predictionId}:outcome:${outcomeValue}`, amount);
  await redisCommand('LPUSH', `pred:${predictionId}:recent_bets`,
    JSON.stringify({ outcome: outcomeValue, amount, token: tokenSymbol, timestamp: Date.now() }));
}

export const INITIAL_MARKET_STATE = {
  total_pool: 0, yes_pool: 0, no_pool: 0, yes_percent: 50, no_percent: 50,
};
