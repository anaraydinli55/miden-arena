import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Köhnə duplicate test açarlarını bazadan təmizlə
    await redis.zrem('leaderboard:xp', 'mtst1_default_tester', 'connected_tester');

    // 2. Bazadan sıralamanı gətir
    const topMembers = await redis.zrange('leaderboard:xp', 0, 19, {
      rev: true,
      withScores: true,
    });

    const leaderboard = [];
    const seenWallets = new Set();

    for (let i = 0; i < topMembers.length; i += 2) {
      let wallet = topMembers[i] as string;
      const xp = Number(topMembers[i + 1]);
      
      if (seenWallets.has(wallet)) continue;
      seenWallets.add(wallet);

      const details: any = (await redis.get(`user:${wallet}`)) || {};
      const totalBets = Number(details?.totalBets) || Math.round(xp / 100) || 1;
      const volume = Number(details?.totalVolume) || totalBets * 10;

      // Real cüzdanın yanına (You) qoyuruq
      let formattedAddress = wallet;
      if (wallet.includes('mtst1aqq') || wallet.includes('wr6w')) {
        formattedAddress = 'mtst1aqq...wr6w (You)';
      } else if (wallet.length > 20) {
        formattedAddress = `${wallet.slice(0, 10)}...${wallet.slice(-6)}`;
      }

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
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
