import { NextResponse } from "next/server";

let marketState = {
  market_id: "0x00000000000000000000000000000001",
  total_pool: 20,
  yes_pool: 20,
  no_pool: 0,
  contract_id: "0xc05fa91f939040d1751dc990cb2dde",
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
