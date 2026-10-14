import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Kullanimdan kaldirildi: bahisler /api/bet/intent ve /api/bet/confirm uzerinden gecer.
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Deprecated endpoint. Use /api/bet/intent and /api/bet/confirm.' },
    { status: 410 }
  );
}
