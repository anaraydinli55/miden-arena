import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { OFFICIAL_MARKETS } from '@/lib/markets';
import { adminOk } from '@/lib/admin';
import { asObj, hasRealRedis } from '@/lib/ledger';
import { buildPlan, Outcome } from '@/lib/payout';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const json = (body: any, status = 200) => NextResponse.json(body, { status });

export async function POST(req: Request) {
  if (!adminOk(req)) return json({ success: false, error: 'unauthorized' }, 401);
  if (!hasRealRedis()) return json({ success: false, error: 'redis not configured' }, 503);
  try {
    const body = await req.json();
    const marketId = String(body.market_id || '');
    const outcome = String(body.outcome || '').toUpperCase() as Outcome;
    const dryRun = body.dry_run === true;

    if (!OFFICIAL_MARKETS.some((m) => m.id === marketId)) return json({ success: false, error: 'unknown market' }, 400);
    if (!['YES', 'NO', 'VOID'].includes(outcome)) return json({ success: false, error: 'outcome must be YES, NO or VOID' }, 400);

    const existing = asObj(await redis.get(`resolved:${marketId}`));
    if (existing && existing.outcome !== outcome) {
      return json({ success: false, error: `already resolved as ${existing.outcome}` }, 409);
    }

    if (dryRun) {
      const { items, problems, summary } = await buildPlan(marketId, outcome);
      return json({ success: problems.length === 0, dry_run: true, outcome, summary, problems, items });
    }

    // close the market first (no new bets or deposits are counted), let in-flight requests finish, then build the plan
    if (!existing) {
      const ok = await redis.set(`resolved:${marketId}`, JSON.stringify({ outcome, ts: Date.now() }), { nx: true });
      if (!ok) return json({ success: false, error: 'concurrent resolve' }, 409);
      await new Promise((r) => setTimeout(r, 3000));
    }
    await redis.hset('resolved:all', { [marketId]: outcome });

    const { items, problems, summary } = await buildPlan(marketId, outcome);
    if (problems.length) {
      return json({ success: false, error: 'inconsistent data; market stays closed, fix and re-run with the same outcome', problems }, 409);
    }
    if (items.length) {
      const fields: Record<string, string> = {};
      for (const i of items) fields[`${i.token}:${i.wallet}`] = JSON.stringify(i);
      await redis.hset(`plan:${marketId}`, fields);
    }
    return json({ success: true, outcome, summary, items: items.length });
  } catch (e) {
    console.error('resolve error', e);
    return json({ success: false, error: 'server error' }, 500);
  }
}
