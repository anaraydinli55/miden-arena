import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { normWallet } from '@/lib/ledger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BADGES = [
  { id: 'tx_1', title: 'First Step', desc: 'Placed 1 prediction on Miden zkVM', target: 1, icon: '🌱' },
  { id: 'tx_10', title: 'Miden Pioneer', desc: 'Placed 10 predictions on Miden zkVM', target: 10, icon: '⚡' },
  { id: 'tx_25', title: 'Arena Master', desc: 'Placed 25 predictions on Miden zkVM', target: 25, icon: '⚔️' },
  { id: 'tx_50', title: 'Miden Legend', desc: 'Placed 50 predictions on Miden zkVM', target: 50, icon: '👑' },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = normWallet(searchParams.get('wallet') || '');

    let userStats: any = null;
    let history: any[] = [];

    // Only the requested wallet's own data. Never falls back to another wallet.
    if (wallet) {
      userStats = await redis.get(`user:${wallet}`);
      const raw: any[] = (await redis.lrange(`history:${wallet}`, 0, 49)) || [];
      history = raw
        .map((item) => {
          try {
            return typeof item === 'string' ? JSON.parse(item) : item;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }

    const bets = Number(userStats?.totalBets) || 0;
    const volume = Number(userStats?.totalVolume) || 0;
    const xp = Number(userStats?.xp) || 0;

    return new NextResponse(
      JSON.stringify({
        stats: {
          wallet,
          xp,
          totalBets: bets,
          totalVolume: volume,
          volumeByToken: userStats?.volumeByToken || {},
          streak: bets > 0 ? 1 : 0,
        },
        badges: BADGES.map((b) => ({ ...b, current: bets, unlocked: bets >= b.target })),
        history,
      }),
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    return NextResponse.json({ stats: null, badges: [], history: [] }, { status: 500 });
  }
}
