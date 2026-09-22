import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const topMembers = await redis.zrange('leaderboard:xp', 0, 49, {
      rev: true,
      withScores: true,
    });

    const leaderboard = [];
    for (let i = 0; i < topMembers.length; i += 2) {
      let wallet = topMembers[i] as string;
      const xp = Number(topMembers[i + 1]);
      
      const details: any = (await redis.get(`user:${wallet}`)) || {};
      const totalBets = Number(details?.totalBets) || Math.round(xp / 100) || 1;
      const volume = Number(details?.totalVolume) || totalBets * 10;

      let formattedAddress = wallet.length > 18 ? `${wallet.slice(0, 10)}...${wallet.slice(-6)}` : wallet;

      leaderboard.push({
        rank: leaderboard.length + 1,
        wallet: formattedAddress,
        rawWallet: wallet,
        totalBets: `${totalBets} txs`,
        volume: `${volume} ANR`,
        xp: `${xp.toLocaleString()} XP`,
      });
    }

    return new NextResponse(JSON.stringify(leaderboard), {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
