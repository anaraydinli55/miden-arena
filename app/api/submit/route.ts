import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { market_id, choice, amount, wallet_address, txHash, tx_hash } = body;

    const betAmount = Number(amount) || 10;
    const mId = market_id || 'miden-mainnet-q4';
    const txId = txHash || tx_hash || 'tx_' + Math.random().toString(36).substring(2, 10);
    const wallet = (wallet_address || 'mtst1aqq...wr6w').trim().toLowerCase();
    const selectedChoice = choice?.toUpperCase() === 'NO' ? 'NO' : 'YES';

    // 1. Bazarın cari hovuzunu gətir və yenilə
    let state: any = (await redis.get(`market:${mId}:state`)) || (await redis.get('market:main_state')) || {
      total_pool: 20,
      yes_pool: 10,
      no_pool: 10,
      yes_percent: 50,
      no_percent: 50,
    };

    if (selectedChoice === 'YES') {
      state.yes_pool = (Number(state.yes_pool) || 0) + betAmount;
    } else {
      state.no_pool = (Number(state.no_pool) || 0) + betAmount;
    }

    state.total_pool = state.yes_pool + state.no_pool;
    state.yes_percent = Math.round((state.yes_pool / state.total_pool) * 100);
    state.no_percent = 100 - state.yes_percent;

    await redis.set(`market:${mId}:state`, state);
    await redis.set('market:main_state', state);

    // 2. İstifadəçi xalını yenilə
    let userStats: any = (await redis.get(`user:${wallet}`)) || {
      wallet: wallet,
      xp: 0,
      totalBets: 0,
      totalVolume: 0,
      streak: 1,
    };

    userStats.wallet = wallet;
    userStats.totalBets = (Number(userStats.totalBets) || 0) + 1;
    userStats.totalVolume = (Number(userStats.totalVolume) || 0) + betAmount;
    userStats.xp = userStats.totalVolume * 10;
    userStats.lastActive = Date.now();

    await redis.set(`user:${wallet}`, userStats);
    await redis.zadd('leaderboard:xp', { score: userStats.xp, member: wallet });

    // 3. Tranzaksiya Tarixçəsinə Əlavə Et
    const txRecord = {
      tx_hash: txId,
      market_id: mId,
      choice: selectedChoice,
      amount: betAmount,
      timestamp: Date.now(),
      status: 'Confirmed on Testnet',
    };

    await redis.lpush(`history:${wallet}`, JSON.stringify(txRecord));

    return new NextResponse(
      JSON.stringify({
        success: true,
        state,
        updated_state: state,
        stats: userStats,
        tx: txRecord,
      }),
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    console.error('Submit API error:', error);
    return NextResponse.json({ success: false, error: 'Database execution failed' }, { status: 500 });
  }
}
