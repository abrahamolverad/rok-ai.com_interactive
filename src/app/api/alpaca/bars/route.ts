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
    bars.push({
      Timestamp:  bar.t,
      OpenPrice:  bar.o,
      HighPrice:  bar.h,
      LowPrice:   bar.l,
      ClosePrice: bar.c,
      Volume:     bar.v,
    });
  }

  return NextResponse.json({ bars });
}
