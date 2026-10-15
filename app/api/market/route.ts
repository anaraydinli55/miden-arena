import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { OFFICIAL_MARKETS } from '@/lib/markets';
import { hasRealRedis, isToken, poolsKey, shapePool } from '@/lib/ledger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const t = (searchParams.get('token') || 'ANR').toUpperCase();
  const token = isToken(t) ? t : 'ANR';
  const marketId = searchParams.get('market_id') || 'miden-mainnet-q4';

  const pools: Record<string, ReturnType<typeof shapePool>> = {};
  try {
    const h: Record<string, string> | null = hasRealRedis() ? await redis.hgetall(poolsKey(token)) : null;
    for (const m of OFFICIAL_MARKETS) {
      pools[m.id] = shapePool(Number(h?.[`${m.id}:yes`] || 0), Number(h?.[`${m.id}:no`] || 0));
    }
  } catch {
    for (const m of OFFICIAL_MARKETS) pools[m.id] = shapePool(0, 0);
  }
  let resolved: Record<string, string> = {};
  try {
    if (hasRealRedis()) resolved = ((await redis.hgetall('resolved:all')) || {}) as Record<string, string>;
  } catch {}
  const state = pools[marketId] ?? shapePool(0, 0);

  return new NextResponse(
    JSON.stringify({
      ...state,
      total: state.total_pool,
      yes: state.yes_pool,
      no: state.no_pool,
      updated_state: state,
      token,
      pools,
      resolved,
    }),
    { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
