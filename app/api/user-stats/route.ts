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

  // Tarixçəni gətir (ən son 50 əməliyyat)
  let rawHistory: any[] = (await redis.lrange(`history:${wallet}`, 0, 49)) || [];
  if (rawHistory.length === 0) {
    rawHistory = (await redis.lrange('history:mtst1_default_tester', 0, 49)) || [];
  }

  const history = rawHistory.map((item) => {
    try {
      return typeof item === 'string' ? JSON.parse(item) : item;
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  // Əgər tarixçədə daha çox əməliyyat varsa, sayını sinxronlaşdır
  if (history.length > (userStats.totalBets || 0)) {
    userStats.totalBets = history.length;
    userStats.totalVolume = history.reduce((sum, t) => sum + (Number(t.amount) || 10), 0);
    userStats.xp = userStats.totalVolume * 10;
    await redis.set(`user:${wallet}`, userStats);
    await redis.set('user:mtst1_default_tester', userStats);
  }

  const xp = Number(userStats.xp) || 0;
  const bets = Number(userStats.totalBets) || 0;
  const volume = Number(userStats.totalVolume) || 0;

  const badges = [
    {
      id: 'first_bet',
      title: 'First Step',
      desc: 'Placed your first prediction on Miden zkVM',
      unlocked: bets >= 1,
    },
    {
      id: 'high_roller',
      title: 'ANR Whale',
      desc: 'Staked over 20 ANR total volume',
      unlocked: volume >= 20,
    },
    {
      id: 'xp_master',
      title: 'Miden Veteran',
      desc: 'Earned 100+ XP across all sessions',
      unlocked: xp >= 100,
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Content-Type': 'application/json',
      },
    }
  );
}
