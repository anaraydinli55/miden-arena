import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { asObj, creditDeposit, isToken, ledgerOpen, normWallet, validWallet } from '@/lib/ledger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const json = (body: any, status = 200) => NextResponse.json(body, { status });

export async function POST(req: Request) {
  if (!ledgerOpen()) return json({ success: false, error: 'Betting is closed' }, 503);
  try {
    const body = await req.json();
    const wallet = normWallet(body.wallet);
    const token = String(body.token || '').toUpperCase();
    const total = Number(body.total_base_units);
    if (!validWallet(wallet) || !isToken(token) || !Number.isInteger(total) || total <= 0) {
      return json({ success: false, error: 'Invalid parameters' }, 400);
    }

    const intentKey = `intent:${wallet}:${token}:${total}`;
    const intent = asObj(await redis.get(intentKey));
    if (!intent) {
      const done = await redis.get(`credited:${wallet}:${token}:${total}`);
      if (done) return json({ success: true, status: 'already', note_id: done });
      return json({ success: false, error: 'Bet not found or expired' }, 404);
    }

    if (await redis.get(`resolved:${intent.marketId}`)) {
      return json({ success: false, error: 'Market already resolved, the deposit was not counted' }, 409);
    }

    const base = process.env.MINT_SERVICE_URL;
    const secret = process.env.MINT_SERVICE_SECRET;
    if (!base || !secret) {
      return json({ success: false, error: 'Verification service is not configured' }, 501);
    }

    let data: any = {};
    try {
      const res = await fetch(`${base}/deposits/find`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, token, baseUnits: total }),
        signal: AbortSignal.timeout(50_000),
      });
      data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return json({ success: false, error: data?.error || 'Verification service error' }, 502);
      }
    } catch {
      return json({ success: false, pending: true, error: 'Verification service did not respond' }, 504);
    }

    const ids: string[] = Array.isArray(data.noteIds) ? data.noteIds : [];
    for (const noteId of ids) {
      const lock = await redis.set(
        `deposit:${noteId}`,
        JSON.stringify({ wallet, token, total, marketId: intent.marketId, choice: intent.choice, ts: Date.now() }),
        { nx: true }
      );
      if (!lock) continue; // this deposit was already counted
      try {
        await creditDeposit({
          wallet,
          token,
          totalBase: total,
          marketId: intent.marketId,
          choice: intent.choice,
          noteId,
        });
      } catch (e) {
        await redis.del(`deposit:${noteId}`); // crediting failed: release the lock
        throw e;
      }
      await redis.del(intentKey);
      await redis.set(`credited:${wallet}:${token}:${total}`, noteId, { ex: 86400 });
      return json({ success: true, status: 'credited', note_id: noteId });
    }
    return json({ success: false, pending: true, error: 'Deposit not visible yet' }, 404);
  } catch (e) {
    console.error('confirm error', e);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
