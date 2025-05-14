import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    account: { cash: 10000.00, equity: 12500.00 },
    positions: [
      { symbol: "AAPL", qty: 10, market_value: 1750.00 },
      { symbol: "MSFT", qty: 5, market_value: 1500.00 }
    ]
  });
}