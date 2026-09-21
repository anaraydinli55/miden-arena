import { NextResponse } from 'next/server';
import { redis, INITIAL_MARKET_STATE } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let state: any = await redis.get('market:main_state');
    
    if (!state) {
      state = INITIAL_MARKET_STATE;
      await redis.set('market:main_state', state);
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error('Market fetch error:', error);
    return NextResponse.json(INITIAL_MARKET_STATE, { status: 500 });
  }
}
