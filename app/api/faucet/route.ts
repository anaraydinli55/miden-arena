import { NextResponse } from "next/server";

export const maxDuration = 60;

// MINT_SERVICE_URL: faucet anahtarini tutan ayri mint servisi (ornegin Railway)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { address, token, amount, faucetId } = body;

    if (!address || !token || !faucetId) {
      return NextResponse.json({ error: "address, token ve faucetId zorunlu" }, { status: 400 });
    }

    const url = process.env.MINT_SERVICE_URL;
    if (!url) {
      return NextResponse.json(
        { error: "Mint servisi henuz kurulu degil (MINT_SERVICE_URL yok). Claim su an gercek token gondermiyor." },
        { status: 501 }
      );
    }

    const upstream = await fetch(`${url}/mint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MINT_SERVICE_SECRET ?? ""}`,
      },
      body: JSON.stringify({ address, token, amount, faucetId }),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
