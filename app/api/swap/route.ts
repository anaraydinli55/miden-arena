import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Deprecated: bets go through /api/bet/intent and /api/bet/confirm.
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Deprecated endpoint. Use /api/bet/intent and /api/bet/confirm.' },
    { status: 410 }
  );
}
