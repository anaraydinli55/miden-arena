import { NextResponse } from "next/server";

let marketState = {
  market_id: "0x00000000000000000000000000000001",
  total_pool: 20,
  yes_pool: 20,
  no_pool: 0,
  contract_id: "0x4fd1531ea602bd513c5b87df3d8332",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { choice, amount, txHash } = body;

    const betAmount = Number(amount) || 10;
    marketState.total_pool += betAmount;

    if (String(choice).toUpperCase() === "NO") {
      marketState.no_pool += betAmount;
    } else {
      marketState.yes_pool += betAmount;
    }

    return NextResponse.json({
      success: true,
      updated_state: marketState,
      confirmed_tx: txHash,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
