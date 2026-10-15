import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { hasRealRedis } from '@/lib/ledger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// MINT_SERVICE_URL points at the separate mint service that holds the faucet keys.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { address, token, amount, faucetId } = body;

    if (!address || !token || !faucetId) {
      return NextResponse.json({ error: 'address, token and faucetId are required' }, { status: 400 });
    }

    const url = process.env.MINT_SERVICE_URL;
    if (!url) {
      return NextResponse.json(
        { error: 'Mint service is not configured (MINT_SERVICE_URL is missing). Claims do not send real tokens right now.' },
        { status: 501 }
      );
    }

    if (hasRealRedis()) {
      const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
      const key = `rl:faucet:${ip}`;
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, 3600);
      if (n > 20) {
        return NextResponse.json({ error: 'Too many claims from this network, try again later' }, { status: 429 });
      }
    }

    const upstream = await fetch(`${url}/mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MINT_SERVICE_SECRET ?? ''}`,
      },
      body: JSON.stringify({ address, token, amount, faucetId }),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
