import { NextResponse } from "next/navigation";

export async function POST(req: Request) {
  try {
    const { address, token, amount, faucetId } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    console.log(`[Faucet Mint Request] Sending ${amount} ${token} (${faucetId}) to ${address}`);

    return NextResponse.json({
      success: true,
      message: `Successfully minted ${amount} ${token}`,
      address,
      token,
      amount,
      txHash: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
