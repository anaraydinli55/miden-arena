import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const userStats: any = (await redis.get(`user:${wallet}`)) || {
    wallet,
    xp: 0,
    totalBets: 0,
    totalVolume: 0,
    streak: 0,
  };

  const badges = [
    {
      id: 'first_bet',
      title: 'First Step',
      desc: 'Placed your first prediction',
      unlocked: userStats.totalBets >= 1,
    },
    {
      id: 'high_roller',
      title: 'ANR Whale',
      desc: 'Staked over 50 ANR',
      unlocked: userStats.totalVolume >= 50,
    },
    {
      id: 'xp_master',
      title: 'Miden Veteran',
      desc: 'Earned 500+ XP',
      unlocked: userStats.xp >= 500,
    },
  ];

  return NextResponse.json({
    stats: userStats,
    badges,
  });
}
