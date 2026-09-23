import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const topMembers = await redis.zrange('leaderboard:xp', 0, 19, {
      rev: true,
      withScores: true,
    });

    const leaderboard = [];
    const seen = new Set();

    for (let i = 0; i < topMembers.length; i += 2) {
      let rawWallet = topMembers[i] as string;
      const score = Number(topMembers[i + 1]);

      if (seen.has(rawWallet)) continue;
      seen.add(rawWallet);

      const details: any = (await redis.get(`user:${rawWallet}`)) || {};
      const bets = Number(details.totalBets) || Math.round(score / 100) || 1;
      const volume = Number(details.totalVolume) || bets * 10;
      const xp = Number(details.xp) || score || bets * 100;

      let displayWallet = rawWallet;
      if (rawWallet.length > 20) {
        displayWallet = `${rawWallet.slice(0, 10)}...${rawWallet.slice(-6)}`;
      }

      leaderboard.push({
        rank: leaderboard.length + 1,
        wallet: displayWallet,
        rawWallet: rawWallet,
        totalBets: bets,
        volume: volume,
        xp: xp,
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
