import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { OFFICIAL_MARKETS } from '@/lib/markets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get('market_id') || 'miden-mainnet-q4';

    // 1. Əsas bazarın canlı vəziyyətini oxu
    let state: any = (await redis.get(`market:${marketId}:state`)) || 
                     (await redis.get('market:main_state')) || {
                       total_pool: 160,
                       yes_pool: 140,
                       no_pool: 20,
                       yes_percent: 88,
                       no_percent: 12,
                     };

    // 2. Bütün bazarların hovuzlarını gətir
    const pools: Record<string, any> = {};
    for (const m of OFFICIAL_MARKETS) {
      const mState: any = (await redis.get(`market:${m.id}:state`)) || {
        total_pool: 20,
        yes_pool: 10,
        no_pool: 10,
        yes_percent: 50,
        no_percent: 50,
      };
      pools[m.id] = mState;
    }

    // prediction-panel.tsx-in gözlədiyi bütün formatları təmin edirik
    return new NextResponse(
      JSON.stringify({
        ...state,
        total: state.total_pool,
        yes: state.yes_pool,
        no: state.no_pool,
        updated_state: state,
        pools,
      }),
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        total_pool: 160,
        yes_pool: 140,
        no_pool: 20,
        total: 160,
        yes: 140,
        no: 20,
      },
      { status: 500 }
    );
  }
}
