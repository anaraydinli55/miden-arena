import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wallet_address, fromToken, toToken, fromAmount, toAmount, tx_hash } = body;

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: 'Wallet required' }, { status: 400 });
    }

    const wallet = wallet_address.toLowerCase().trim();
    const txId = tx_hash || 'tx_swap_' + Math.random().toString(36).substring(2, 10);

    // Swap tranzaksiyasını cüzdanın fəaliyyət tarixçəsinə qeyd edirik
    const txRecord = {
      tx_hash: txId,
      choice: `SWAP: ${fromAmount} ${fromToken} ➔ ${toAmount} ${toToken}`,
      amount: Number(toAmount) || 10,
      timestamp: Date.now(),
      status: 'Swap Confirmed',
    };

    await redis.lpush(`history:${wallet}`, JSON.stringify(txRecord));

    return NextResponse.json({ success: true, tx: txRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Swap processing failed' }, { status: 500 });
  }
}
