import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get('address');

    // Upstash Redis-dən real istifadəçi sıralamasını çəkirik
    const rawLeaderboard: any = await redis.get('arena:global:leaderboard') || [];
    
    let users = Array.isArray(rawLeaderboard) ? rawLeaderboard : [];

    // Əgər istifadəçi cüzdanını qoşubsa və hələ siyahıda yoxdursa, onu 0 xalla daxil edirik
    if (userAddress && !users.some((u: any) => u.address.toLowerCase() === userAddress.toLowerCase())) {
      users.push({
        address: userAddress,
        predictionsCount: 0,
        volume: '0 ELA',
        xp: 0,
      });
    }

    // XP xalına görə ən yüksəkdən aza doğru real sıralayırıq
    users.sort((a: any, b: any) => b.xp - a.xp);

    // Sıralama nömrələrini (Rank) təyin edirik
    const rankedUsers = users.map((u: any, index: number) => ({
      ...u,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      users: rankedUsers,
      totalUsers: rankedUsers.length,
    });
  } catch (error) {
    return NextResponse.json({ success: true, users: [], totalUsers: 0 });
  }
}
