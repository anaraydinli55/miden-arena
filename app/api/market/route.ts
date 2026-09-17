import { NextResponse } from "next/server";

let marketState = {
  market_id: "0x00000000000000000000000000000001",
  total_pool: 20,
  yes_pool: 20,
  no_pool: 0,
  contract_id: "0xc05fa91f939040d1751dc990cb2dde",
};

export async function GET() {
  return NextResponse.json(marketState);
}
