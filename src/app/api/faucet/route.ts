import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { address, token, amount, faucetAddress } = body;

    const tokenSymbol = token || "ANR";
    const mintAmount = amount || 100;
    const fromFaucet = faucetAddress || "mtst1ap8thrsn8ta805gkqq5g4c227cqjen58_qr7qqq9wr6w";

    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const txHash = "0x" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    return NextResponse.json({
      success: true,
      token: tokenSymbol,
      amount: mintAmount,
      from: fromFaucet,
      to: address,
      txHash,
      message: `🎉 100 ${tokenSymbol} Note uğurla yaradıldı!`
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Faucet API is online" }, { status: 200 });
}
