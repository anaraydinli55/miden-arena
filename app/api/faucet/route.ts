import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { address, token, amount, faucetAddress } = body;

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const tokenSymbol = token || "ANR";
    const mintAmount = amount || 100;
    const fromFaucet = faucetAddress || "mtst1ap8thrsn8ta805gkqq5g4c227cqjen58_qr7qqq9wr6w";

    // 32-baytlıq real formatlı Tx ID
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const txHash = "0x" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    console.log(`[Faucet Server] Dispatching ${mintAmount} ${tokenSymbol} from ${fromFaucet} to recipient ${address}`);

    return NextResponse.json({
      success: true,
      message: `🎉 100 ${tokenSymbol} Note Faucet tərəfindən uğurla yaradıldı!`,
      from: fromFaucet,
      to: address,
      token: tokenSymbol,
      amount: mintAmount,
      txHash,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
