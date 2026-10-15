import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { adminOk, mintFetch } from '@/lib/admin';
import { asObj, hasRealRedis } from '@/lib/ledger';
import type { PlanItem } from '@/lib/payout';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const json = (body: any, status = 200) => NextResponse.json(body, { status });

export async function POST(req: Request) {
  if (!adminOk(req)) return json({ success: false, error: 'unauthorized' }, 401);
  if (!hasRealRedis()) return json({ success: false, error: 'redis not configured' }, 503);
  try {
    const body = await req.json();
    const marketId = String(body.market_id || '');
    const step = String(body.step || 'pay');
    const retryPending = body.retry_pending === true;

    if (!asObj(await redis.get(`resolved:${marketId}`))) {
      return json({ success: false, error: 'market is not resolved' }, 409);
    }

    if (step === 'consume') {
      const r = await mintFetch('/escrow/consume', 'POST', undefined, 55_000);
      const st = await mintFetch('/status', 'GET', undefined, 20_000).catch(() => null);
      return json({
        success: r.status === 200 && r.data?.success === true,
        consumed: r.data?.consumed ?? 0,
        error: r.data?.error,
        vault: st?.data?.escrowTokens,
      });
    }

    const raw = ((await redis.hgetall(`plan:${marketId}`)) || {}) as Record<string, unknown>;
    const items = Object.values(raw).map(asObj).filter(Boolean) as PlanItem[];
    const started = Date.now();
    let doneBefore = 0;
    let paid = 0;
    const pending: string[] = [];
    const results: any[] = [];
    let error: string | undefined;

    for (const it of items) {
      const key = `payout:${marketId}:${it.token}:${it.wallet}`;
      const state = (await redis.get(key)) as string | null;
      if (typeof state === 'string' && state.startsWith('done')) {
        doneBefore++;
        continue;
      }
      if (state && !retryPending) {
        pending.push(`${it.token}:${it.wallet}`);
        continue;
      }
      if (Date.now() - started > 25_000) break; // leave the rest for the next call

      const locked = state ? true : await redis.set(key, `pending:${Date.now()}`, { nx: true });
      if (!locked) continue;

      let r: { status: number; data: any };
      try {
        r = await mintFetch(
          '/escrow/pay',
          'POST',
          { token: it.token, wallet: it.wallet, baseUnits: it.base },
          Math.max(10_000, 55_000 - (Date.now() - started))
        );
      } catch {
        pending.push(`${it.token}:${it.wallet}`);
        error = 'ambiguous: the service did not answer in time; the record stays pending, check Bread or the explorer';
        break;
      }

      if (r.status === 200 && r.data?.success) {
        await redis.set(key, `done:${r.data.txHash}`);
        paid++;
        results.push({ item: `${it.token}:${it.wallet}`, base: it.base, kind: it.kind, tx: r.data.txHash });
        continue;
      }
      if ((r.status >= 400 && r.status < 500) || r.status === 502) {
        await redis.del(key); // definite failure: safe to retry
        error = r.data?.error || `mint service ${r.status}`;
        break;
      }
      pending.push(`${it.token}:${it.wallet}`);
      error = `ambiguous (${r.status}); the record stays pending, please check`;
      break;
    }

    const remaining = items.length - doneBefore - paid;
    return json({ success: !error, paid, remaining, pending, results, error });
  } catch (e) {
    console.error('payout error', e);
    return json({ success: false, error: 'server error' }, 500);
  }
}
