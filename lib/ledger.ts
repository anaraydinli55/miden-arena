import { redis } from '@/lib/redis';

export const TOKENS = ['ANR', 'SKS', 'ELA'] as const;
export type BetToken = (typeof TOKENS)[number];
export const DECIMALS = 1_000_000;

export function hasRealRedis(): boolean {
  const e = process.env;
  return !!(
    (e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN) ||
    (e.KV_REST_API_URL && e.KV_REST_API_TOKEN)
  );
}

// Betting is open only when every dependency of the deposit flow is configured:
// the flag, a real Redis and the mint service that verifies deposits on chain.
// Otherwise users could send tokens that can never be verified.
export function ledgerOpen(): boolean {
  const e = process.env;
  return (
    e.BETS_LEDGER_OPEN === '1' && hasRealRedis() && !!e.MINT_SERVICE_URL && !!e.MINT_SERVICE_SECRET
  );
}

// Bread addresses look like "<bech32>_<suffix>": drop the suffix and lowercase.
export function normWallet(w: string): string {
  return String(w || '').trim().toLowerCase().split('_')[0];
}

export function validWallet(w: string): boolean {
  return /^mtst1[a-z0-9]{20,70}$/.test(w) || /^0x[0-9a-f]{30}$/.test(w);
}

export function isToken(t: string): t is BetToken {
  return (TOKENS as readonly string[]).includes(t);
}

// One hash per token. Fields are "<market>:yes" and "<market>:no" in base units,
// so reading all pools of a token costs a single Redis command.
export const poolsKey = (token: string) => `pools:${token}`;

export function shapePool(yesBase: number, noBase: number) {
  const r = (x: number) => Math.round(x * 1e4) / 1e4;
  const yes = r(yesBase / DECIMALS);
  const no = r(noBase / DECIMALS);
  const total = r(yes + no);
  const yp = total === 0 ? 50 : Math.round((yes / total) * 100);
  return { total_pool: total, yes_pool: yes, no_pool: no, yes_percent: yp, no_percent: 100 - yp };
}

export function asObj(v: unknown): any {
  if (!v) return null;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v;
}

export async function creditDeposit(p: {
  wallet: string;
  token: BetToken;
  totalBase: number;
  marketId: string;
  choice: 'YES' | 'NO';
  noteId: string;
}) {
  const side = p.choice === 'YES' ? 'yes' : 'no';
  await redis.hincrby(poolsKey(p.token), `${p.marketId}:${side}`, p.totalBase);
  await redis.hincrby(`stakes:${p.marketId}:${p.token}`, `${p.wallet}:${side}`, p.totalBase);

  const prev = asObj(await redis.get(`user:${p.wallet}`)) || {};
  const volumeByToken: Record<string, number> = { ...(prev.volumeByToken || {}) };
  volumeByToken[p.token] = (Number(volumeByToken[p.token]) || 0) + p.totalBase / DECIMALS;
  const totalBets = (Number(prev.totalBets) || 0) + 1;
  const totalVolume = Object.values(volumeByToken).reduce((a, b) => a + Number(b), 0);
  const stats = {
    wallet: p.wallet,
    totalBets,
    volumeByToken,
    totalVolume,
    xp: totalBets * 100,
    lastActive: Date.now(),
  };
  await redis.set(`user:${p.wallet}`, JSON.stringify(stats));
  await redis.zadd('leaderboard:xp', { score: stats.xp, member: p.wallet });

  const volumeText = Object.entries(volumeByToken)
    .filter(([, v]) => Number(v) > 0)
    .map(([t, v]) => `${Math.round(Number(v) * 100) / 100} ${t}`)
    .join(' · ');
  await redis.hset('lb:users', {
    [p.wallet]: JSON.stringify({
      address: p.wallet,
      predictionsCount: totalBets,
      volume: volumeText || '0',
      xp: stats.xp,
    }),
  });

  await redis.lpush(
    `history:${p.wallet}`,
    JSON.stringify({
      tx_hash: p.noteId,
      market_id: p.marketId,
      choice: p.choice,
      amount: p.totalBase / DECIMALS,
      token: p.token,
      timestamp: Date.now(),
      status: 'Deposit verified',
    })
  );
}
