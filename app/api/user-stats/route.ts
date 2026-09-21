import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet')?.toLowerCase()?.trim() || 'mtst1_default_tester';

  // 1. İstifadəçi məlumatlarını gətir
  let userStats: any = await redis.get(`user:${wallet}`);
  
  if (!userStats) {
    userStats = {
      wallet: wallet,
      xp: 0,
      totalBets: 0,
      totalVolume: 0,
      streak: 0,
    };
  }

  // 2. Bütün cihazlardan edilmiş tranzaksiya tarixçəsini gətir (ən son 50 əməliyyat)
  const rawHistory: any[] = await redis.lrange(`history:${wallet}`, 0, 49) || [];
  const history = rawHistory.map((item) => {
    try {
      return typeof item === 'string' ? JSON.parse(item) : item;
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  // 3. Rozetlər
  const badges = [
    {
      id: 'first_bet',
      title: 'First Step',
      desc: 'Placed your first prediction on Miden zkVM',
      unlocked: (userStats?.totalBets || 0) >= 1,
    },
    {
      id: 'high_roller',
      title: 'ANR Whale',
      desc: 'Staked over 30 ANR total volume',
      unlocked: (userStats?.totalVolume || 0) >= 30,
    },
    {
      id: 'xp_master',
      title: 'Miden Veteran',
      desc: 'Earned 100+ XP across all sessions',
      unlocked: (userStats?.xp || 0) >= 100,
    },
  ];

  return NextResponse.json({
    stats: userStats,
    badges,
    history,
  });
}
