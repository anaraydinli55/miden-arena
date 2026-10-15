import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { redis } from '@/lib/redis';
import { OFFICIAL_MARKETS } from '@/lib/markets';
import { DECIMALS, isToken, ledgerOpen, normWallet, validWallet } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

const json = (body: any, status = 200) => NextResponse.json(body, { status });

async function limited(key: string, max: number, windowSec: number) {
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, windowSec);
  return n > max;
}

export async function POST(req: Request) {
  if (!ledgerOpen()) return json({ success: false, error: 'Bets are closed' }, 503);
  try {
    const body = await req.json();
    const wallet = normWallet(body.wallet);
    const token = String(body.token || '').toUpperCase();
    const choice = String(body.choice || '').toUpperCase();
    const marketId = String(body.market_id || '');
    const amount = Number(body.amount);

    if (!validWallet(wallet)) return json({ success: false, error: 'Cüzdan ünvanı yanlışdır' }, 400);
    if (!isToken(token)) return json({ success: false, error: 'Token yanlışdır' }, 400);
    if (choice !== 'YES' && choice !== 'NO') return json({ success: false, error: 'Seçim yanlışdır' }, 400);
    const market = OFFICIAL_MARKETS.find((m) => m.id === marketId);
    if (!market || market.expiresAt <= Date.now()) {
      return json({ success: false, error: 'Bazar tapılmadı və ya bağlanıb' }, 400);
    }
    if (await redis.get(`resolved:${marketId}`)) {
      return json({ success: false, error: 'Bazar artıq nəticələnib' }, 400);
    }
    if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
      return json({ success: false, error: 'Məbləğ 1 ilə 1000 arasında tam ədəd olmalıdır' }, 400);
    }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    if ((await limited(`rl:intent:ip:${ip}`, 30, 600)) || (await limited(`rl:intent:w:${wallet}`, 15, 600))) {
      return json({ success: false, error: 'Çox sorğu, bir az sonra yenidən cəhd edin' }, 429);
    }

    const base = amount * DECIMALS;
    for (let i = 0; i < 20; i++) {
      const total = base + randomInt(1, 10000);
      const key = `intent:${wallet}:${token}:${total}`;
      const ok = await redis.set(key, JSON.stringify({ marketId, choice, base, ts: Date.now() }), {
        nx: true,
        ex: 1800,
      });
      if (ok) return json({ success: true, total_base_units: total, expires_in: 1800 });
    }
    return json({ success: false, error: 'Yenidən cəhd edin' }, 503);
  } catch (e) {
    console.error('intent error', e);
    return json({ success: false, error: 'Server xətası' }, 500);
  }
}
