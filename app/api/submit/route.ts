import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { market_id, choice, amount, wallet_address, tx_hash } = body;

    // Cüzdan mütləq olmalıdır
    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.trim() === '') {
      return NextResponse.json({ success: false, error: 'Wallet not connected' }, { status: 400 });
    }

    const wallet = wallet_address.trim().toLowerCase();
    const betAmount = Number(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid prediction amount' }, { status: 400 });
    }

    const selectedChoice = choice?.toUpperCase() === 'NO' ? 'NO' : 'YES';
    const mId = market_id || 'miden-mainnet-q4';
    const txId = tx_hash || 'tx_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    // 1. Bazanın cari real vəziyyətini oxu
    let state: any = (await redis.get(`market:${mId}:state`)) || {
      total_pool: 0,
      yes_pool: 0,
      no_pool: 0,
      yes_percent: 0,
      no_percent: 0,
    };

    if (selectedChoice === 'YES') {
      state.yes_pool = (Number(state.yes_pool) || 0) + betAmount;
    } else {
      state.no_pool = (Number(state.no_pool) || 0) + betAmount;
    }

    state.total_pool = state.yes_pool + state.no_pool;
    state.yes_percent = state.total_pool > 0 ? Math.round((state.yes_pool / state.total_pool) * 100) : 0;
    state.no_percent = state.total_pool > 0 ? 100 - state.yes_percent : 0;

    await redis.set(`market:${mId}:state`, state);

    // 2. Qazanc paylanması üçün bu cüzdanın proqnozunu qeyd et
    await redis.lpush(`market:${mId}:bets`, JSON.stringify({
      wallet,
      choice: selectedChoice,
      amount: betAmount,
      txId,
      timestamp: Date.now(),
    }));

    // 3. İstifadəçi statistikasını real yenilə
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

    // 4. Tranzaksiya Tarixçəsinə yaz
    const txRecord = {
      tx_hash: txId,
      market_id: mId,
      choice: selectedChoice,
      amount: betAmount,
      timestamp: Date.now(),
      status: 'Confirmed on Testnet',
    };

    await redis.lpush(`history:${wallet}`, JSON.stringify(txRecord));

    return new NextResponse(JSON.stringify({ success: true, state, stats: userStats, tx: txRecord }), {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: 'Database execution failed' }, { status: 500 });
  }
}
