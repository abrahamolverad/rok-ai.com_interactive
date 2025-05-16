import { NextRequest, NextResponse } from 'next/server';
import Alpaca from '@alpacahq/alpaca-trade-api';

const {
  ALPACA_KEY,
  ALPACA_SECRET,
  ALPACA_PAPER = 'true',
} = process.env;

const alpaca = new Alpaca({
  keyId: ALPACA_KEY,
  secretKey: ALPACA_SECRET,
  paper: ALPACA_PAPER === 'true',
});

export async function GET(req: NextRequest) {
  if (!ALPACA_KEY || !ALPACA_SECRET) {
    return NextResponse.json(
      { message: 'Alpaca API keys not configured.' },
      { status: 200 }
    );
  }

  const { searchParams } = new URL(req.url);
  const symbol    = searchParams.get('symbol')!;
  const timeframe = searchParams.get('timeframe') ?? '1Day';

  const resp = await alpaca.getBarsV2(
    symbol,
    {
      timeframe,
      limit: 90,
      adjustment: 'raw',
    },
    alpaca.configuration
  );

  const bars = [];
  for await (const bar of resp) {
    const b: any = bar;           // <-- cast to any to satisfy TypeScript
    bars.push({
      Timestamp:  b.t,            // ISO string
      OpenPrice:  b.o,
      HighPrice:  b.h,
      LowPrice:   b.l,
      ClosePrice: b.c,
      Volume:     b.v,
    });
  }

  return NextResponse.json({ bars });
}
