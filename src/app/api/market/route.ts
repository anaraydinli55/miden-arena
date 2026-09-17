import { NextResponse } from "next/server";

let marketState = {
  market_id: "0x00000000000000000000000000000001",
  total_pool: 20,
  yes_pool: 20,
  no_pool: 0,
  contract_id: "0x4fd1531ea602bd513c5b87df3d8332",
};

export async function GET() {
  return NextResponse.json(marketState);
}
