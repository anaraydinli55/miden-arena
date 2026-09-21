import { NextResponse } from 'next/server';
import { redis, INITIAL_MARKET_STATE } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { choice, amount, wallet_address, tx_hash } = body;

    const betAmount = Number(amount) || 10;
    const wallet = wallet_address ? wallet_address.trim().toLowerCase() : 'mtst1_default_tester';
    const txId = tx_hash || 'tx_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

    // 1. Ümumi Market Hovuzunu yenilə
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

    // 2. Cüzdanın qalıcı statistikasını yenilə
    const userKey = `user:${wallet}`;
    let userStats: any = await redis.get(userKey);

    if (!userStats) {
      userStats = {
        wallet: wallet,
        xp: 0,
        totalBets: 0,
        totalVolume: 0,
        streak: 1,
        createdAt: Date.now(),
      };
    }

    userStats.xp += betAmount * 10;
    userStats.totalBets += 1;
    userStats.totalVolume += betAmount;
    userStats.lastActive = Date.now();

    await redis.set(userKey, userStats);
    await redis.zadd('leaderboard:xp', { score: userStats.xp, member: wallet });

    // 3. Tranzaksiya Tarixçəsinə Əlavə Et (Heç vaxt silinməyən siyahı)
    const txRecord = {
      tx_hash: txId,
      choice: choice?.toUpperCase() || 'YES',
      amount: betAmount,
      timestamp: Date.now(),
      status: 'Confirmed',
    };

    await redis.lpush(`history:${wallet}`, JSON.stringify(txRecord));

    return NextResponse.json({ success: true, state, tx: txRecord });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
