import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topMembers = await redis.zrange('leaderboard:xp', 0, 9, {
      rev: true,
      withScores: true,
    });

    const leaderboard = [];
    for (let i = 0; i < topMembers.length; i += 2) {
      const wallet = topMembers[i] as string;
      const xp = Number(topMembers[i + 1]);
      const details: any = await redis.get(`user:${wallet}`);

      leaderboard.push({
        rank: leaderboard.length + 1,
        wallet,
        xp,
        totalBets: details?.totalBets || 0,
        volume: details?.totalVolume || 0,
      });
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
