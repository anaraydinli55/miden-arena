import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const wallet = 'mtst1aqq...wr6w';

  // Canlı statistikaları gətir
  let userStats: any = (await redis.get(`user:${wallet}`)) || 
                       (await redis.get('user:mtst1_default_tester')) || {
                         wallet: wallet,
                         xp: 0,
                         totalBets: 0,
                         totalVolume: 0,
                         streak: 1,
                       };

  // Tarixçəni gətir
  let rawHistory: any[] = (await redis.lrange(`history:${wallet}`, 0, 99)) || [];
  if (rawHistory.length === 0) {
    rawHistory = (await redis.lrange('history:mtst1_default_tester', 0, 99)) || [];
  }

  const history = rawHistory.map((item) => {
    try {
      return typeof item === 'string' ? JSON.parse(item) : item;
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  // Tarixçəyə əsasən dəqiq tx sayını hesabla
  const bets = Math.max(Number(userStats.totalBets) || 0, history.length);
  userStats.totalBets = bets;
  userStats.totalVolume = bets * 10;
  userStats.xp = bets * 100;

  // 1, 10, 25, 50 Prediction Rozetləri
  const badges = [
    {
      id: 'tx_1',
      title: 'First Step',
      desc: 'Placed 1 prediction on Miden zkVM',
      target: 1,
      current: bets,
      unlocked: bets >= 1,
      icon: '🌱',
    },
    {
      id: 'tx_10',
      title: 'Miden Pioneer',
      desc: 'Placed 10 predictions on Miden zkVM',
      target: 10,
      current: bets,
      unlocked: bets >= 10,
      icon: '⚡',
    },
    {
      id: 'tx_25',
      title: 'Arena Master',
      desc: 'Placed 25 predictions on Miden zkVM',
      target: 25,
      current: bets,
      unlocked: bets >= 25,
      icon: '⚔️',
    },
    {
      id: 'tx_50',
      title: 'Miden Legend',
      desc: 'Placed 50 predictions on Miden zkVM',
      target: 50,
      current: bets,
      unlocked: bets >= 50,
      icon: '👑',
    },
  ];

  return new NextResponse(
    JSON.stringify({
      stats: userStats,
      badges,
      history,
    }),
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Content-Type': 'application/json',
      },
    }
  );
}
