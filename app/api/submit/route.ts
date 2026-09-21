import { NextResponse } from 'next/server';
import { redis, INITIAL_MARKET_STATE } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { choice, amount, wallet_address, tx_hash } = body;

    const betAmount = Number(amount) || 10;
    const wallet = wallet_address ? wallet_address.toLowerCase() : 'anonymous';

    // 1. Mövcud Market State gətir
    let state: any = await redis.get('market:main_state');
    if (!state) state = { ...INITIAL_MARKET_STATE };

    // 2. Hovuzları hesabla
    if (choice?.toUpperCase() === 'YES') {
      state.yes_pool += betAmount;
    } else {
      state.no_pool += betAmount;
    }
    state.total_pool = state.yes_pool + state.no_pool;
    
    state.yes_percent = Math.round((state.yes_pool / state.total_pool) * 100);
    state.no_percent = 100 - state.yes_percent;

    // Redis-də saxla
    await redis.set('market:main_state', state);

    // 3. İstifadəçi statistikasını yaz
    if (wallet !== 'anonymous') {
      const userKey = `user:${wallet}`;
      let userStats: any = await redis.get(userKey);

      if (!userStats) {
        userStats = {
          wallet: wallet,
          xp: 0,
          totalBets: 0,
          totalVolume: 0,
          wins: 0,
          streak: 1,
          lastActive: Date.now(),
        };
      }

      userStats.xp += betAmount * 10;
      userStats.totalBets += 1;
      userStats.totalVolume += betAmount;
      userStats.lastActive = Date.now();

      await redis.set(userKey, userStats);
      await redis.zadd('leaderboard:xp', { score: userStats.xp, member: wallet });
      await redis.lpush(`history:${wallet}`, JSON.stringify({
        choice,
        amount: betAmount,
        tx_hash: tx_hash || 'tx_' + Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      }));
    }

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
