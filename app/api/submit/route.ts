import { NextResponse } from 'next/server';
import { redis, INITIAL_MARKET_STATE } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { choice, amount, wallet_address, tx_hash } = body;

    const betAmount = Number(amount) || 10;
    const wallet = 'mtst1aqq...wr6w';
    const txId = tx_hash || 'tx_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    // 1. Market Hovuzunu yenilə
    let state: any = await redis.get('market:main_state');
    if (!state) state = { ...INITIAL_MARKET_STATE };

    if (choice?.toUpperCase() === 'YES') {
      state.yes_pool += betAmount;
    } else {
      state.no_pool += betAmount;
    }
    state.total_pool = state.yes_pool + state.no_pool;
    state.yes_percent = Math.round((state.yes_pool / state.total_pool) * 100);
    state.no_percent = 100 - state.yes_percent;

    await redis.set('market:main_state', state);

    // 2. Yalnız vahid real cüzdanı yenilə
    let userStats: any = (await redis.get(`user:${wallet}`)) || {
      wallet: wallet,
      xp: 0,
      totalBets: 0,
      totalVolume: 0,
      streak: 1,
    };

    userStats.wallet = wallet;
    userStats.xp = (Number(userStats.xp) || 0) + betAmount * 10;
    userStats.totalBets = (Number(userStats.totalBets) || 0) + 1;
    userStats.totalVolume = (Number(userStats.totalVolume) || 0) + betAmount;
    userStats.lastActive = Date.now();

    await redis.set(`user:${wallet}`, userStats);
    await redis.zadd('leaderboard:xp', { score: userStats.xp, member: wallet });

    // 3. Tranzaksiya Tarixçəsi
    const txRecord = {
      tx_hash: txId,
      choice: choice?.toUpperCase() || 'YES',
      amount: betAmount,
      timestamp: Date.now(),
      status: 'Confirmed',
    };

    await redis.lpush(`history:${wallet}`, JSON.stringify(txRecord));

    return new NextResponse(JSON.stringify({ success: true, state, stats: userStats, tx: txRecord }), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
