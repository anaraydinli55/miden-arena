import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { asObj, hasRealRedis, normWallet } from '@/lib/ledger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const meFull = (searchParams.get('address') || '').trim().slice(0, 100);
    const me = normWallet(meFull);

    const raw: Record<string, unknown> | null = hasRealRedis() ? await redis.hgetall('lb:users') : null;
    const users: any[] = Object.values(raw || {}).map(asObj).filter(Boolean);

    if (me) {
      const mine = users.find((u) => String(u.address).toLowerCase() === me);
      if (mine) mine.address = meFull; // yalniz istek sahibinin satiri: "siz" vurgusu icin
      else users.push({ address: meFull, predictionsCount: 0, volume: '0', xp: 0 });
    }

    users.sort((a, b) => Number(b.xp) - Number(a.xp));
    const ranked = users.slice(0, 100).map((u, i) => ({ ...u, rank: i + 1 }));
    return NextResponse.json({ success: true, users: ranked, totalUsers: users.length });
  } catch {
    return NextResponse.json({ success: true, users: [], totalUsers: 0 });
  }
}
