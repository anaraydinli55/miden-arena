import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawWallet = searchParams.get('wallet')?.trim()?.toLowerCase();

  if (!rawWallet) {
    return NextResponse.json({ stats: null, badges: [], history: [] });
  }

  // Yalnız bu real cüzdanın datasını gətir
  let userStats: any = await redis.get(`user:${rawWallet}`);
  let rawHistory: any[] = (await redis.lrange(`history:${rawWallet}`, 0, 99)) || [];

  const history = rawHistory.map((item) => {
    try {
      return typeof item === 'string' ? JSON.parse(item) : item;
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  const bets = history.length;
  const volume = history.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const xp = volume * 10;

  const realStats = {
    wallet: rawWallet,
    xp: userStats?.xp ?? xp,
    totalBets: userStats?.totalBets ?? bets,
    totalVolume: userStats?.totalVolume ?? volume,
    streak: bets > 0 ? 1 : 0,
  };

  const badges = [
    {
      id: 'tx_1',
      title: 'First Step',
      desc: 'Placed 1 prediction on Miden zkVM',
      target: 1,
      current: realStats.totalBets,
      unlocked: realStats.totalBets >= 1,
      icon: '🌱',
    },
    {
      id: 'tx_10',
      title: 'Miden Pioneer',
      desc: 'Placed 10 predictions on Miden zkVM',
      target: 10,
      current: realStats.totalBets,
      unlocked: realStats.totalBets >= 10,
      icon: '⚡',
    },
    {
      id: 'tx_25',
      title: 'Arena Master',
      desc: 'Placed 25 predictions on Miden zkVM',
      target: 25,
      current: realStats.totalBets,
      unlocked: realStats.totalBets >= 25,
      icon: '⚔️',
    },
    {
      id: 'tx_50',
      title: 'Miden Legend',
      desc: 'Placed 50 predictions on Miden zkVM',
      target: 50,
      current: realStats.totalBets,
      unlocked: realStats.totalBets >= 50,
      icon: '👑',
    },
  ];

  return new NextResponse(
    JSON.stringify({
      stats: realStats,
      badges,
      history,
    }),
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    }
  );
}
