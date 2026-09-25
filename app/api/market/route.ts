import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { OFFICIAL_MARKETS } from '@/lib/markets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get('market_id') || 'miden-mainnet-q4';

    // 1. Əsas bazarın canlı vəziyyətini oxu (Hər şey 0-dan başlayır)
    const rawMainState: any = (await redis.get(`market:${marketId}:state`)) || null;
    
    const yes_pool = Number(rawMainState?.yes_pool || 0);
    const no_pool = Number(rawMainState?.no_pool || 0);
    const total_pool = yes_pool + no_pool;
    const yes_percent = total_pool === 0 ? 50 : Math.round((yes_pool / total_pool) * 100);
    const no_percent = total_pool === 0 ? 50 : 100 - yes_percent;

    const state = {
      total_pool,
      yes_pool,
      no_pool,
      yes_percent,
      no_percent,
    };

    // 2. Bütün bazarların hovuzlarını gətir (Real 0 başlanğıc)
    const pools: Record<string, any> = {};
    for (const m of OFFICIAL_MARKETS) {
      const rawMState: any = (await redis.get(`market:${m.id}:state`)) || null;
      const mYes = Number(rawMState?.yes_pool || 0);
      const mNo = Number(rawMState?.no_pool || 0);
      const mTotal = mYes + mNo;
      const mYesPercent = mTotal === 0 ? 50 : Math.round((mYes / mTotal) * 100);
      const mNoPercent = mTotal === 0 ? 50 : 100 - mYesPercent;

      pools[m.id] = {
        total_pool: mTotal,
        yes_pool: mYes,
        no_pool: mNo,
        yes_percent: mYesPercent,
        no_percent: mNoPercent,
      };
    }

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
    // Xəta olarsa belə saxta rəqəm deyil, 0 qaytarır
    return NextResponse.json(
      {
        total_pool: 0,
        yes_pool: 0,
        no_pool: 0,
        yes_percent: 50,
        no_percent: 50,
        total: 0,
        yes: 0,
        no: 0,
      },
      { status: 200 }
    );
  }
}
