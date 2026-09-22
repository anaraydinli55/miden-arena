import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { OFFICIAL_MARKETS } from '@/lib/markets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get('market_id');

    if (marketId) {
      const state: any = (await redis.get(`market:${marketId}:state`)) || {
        total_pool: 0,
        yes_pool: 0,
        no_pool: 0,
        yes_percent: 0,
        no_percent: 0,
      };
      return NextResponse.json(state);
    }

    // Bütün aktiv bazarların real canlı vəziyyətini gətir
    const now = Date.now();
    const activeMarkets = OFFICIAL_MARKETS.filter(m => m.expiresAt > now);

    const pools: Record<string, any> = {};
    for (const m of activeMarkets) {
      const state: any = (await redis.get(`market:${m.id}:state`)) || {
        total_pool: 0,
        yes_pool: 0,
        no_pool: 0,
        yes_percent: 0,
        no_percent: 0,
      };
      pools[m.id] = state;
    }

    return new NextResponse(JSON.stringify({ pools }), {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json({ pools: {} }, { status: 500 });
  }
}
