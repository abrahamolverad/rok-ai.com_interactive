import { NextResponse } from 'next/server';
import Alpaca from '@alpacahq/alpaca-trade-api';
import dayjs from 'dayjs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Accepts either start or startDate, end or endDate for maximum compatibility
  const startDateParam = searchParams.get('startDate') || searchParams.get('start');
  const endDateParam   = searchParams.get('endDate')   || searchParams.get('end');
  const strategy = searchParams.get('strategy') ?? 'Swing';   // default

  // Defensive: Check for missing/invalid date params
  const startDate = startDateParam ? new Date(startDateParam) : null;
  const endDate   = endDateParam   ? new Date(endDateParam)   : null;

  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json(
      {
        error: 'Invalid or missing start/end date.',
        startDateParam,
        endDateParam,
      },
      { status: 400 }
    );
  }

  // --- SETUP STRATEGY CREDENTIALS --- //
  let alpaca: any;
  try {
    switch (strategy) {
      case 'Day':
        alpaca = new Alpaca({
          keyId:     process.env.ALPACA_API_KEY!,
          secretKey: process.env.ALPACA_SECRET_KEY!,  // <<== Use ALPACA_SECRET_KEY, not API_SECRET_KEY
          paper:     true,
        });
        break;
      case 'Options':
        alpaca = new Alpaca({
          keyId:     process.env.ALPACA_SCALPINGSNIPER_KEY!,
          secretKey: process.env.ALPACA_SCALPINGSNIPER_SECRET_KEY!,
          paper:     true,
        });
        break;
      default: // 'Swing'
        alpaca = new Alpaca({
          keyId:     process.env.ALPACA_UNHOLY_KEY!,
          secretKey: process.env.ALPACA_UNHOLY_SECRET_KEY!,
          paper:     true,
        });
    }
  } catch (e) {
    return NextResponse.json(
      { error: 'Missing required Alpaca API credentials for this strategy.', env: process.env },
      { status: 500 }
    );
  }

  try {
    // ---- open positions ---- //
    const acct = await alpaca.getAccount();
    const positionsResp = await alpaca.getPositions();
    const openPositions = positionsResp.map((p: any) => ({
      Symbol: p.symbol,
      Qty: Number(p.qty),
      'Avg Entry Price': Number(p.avg_entry_price),
      'Current Price':   Number(p.current_price),
      'Market Value':    Number(p.market_value),
      'Unrealized P&L':  Number(p.unrealized_pl),
    }));

    // ---- closed (realized) trades ---- //
    const acts = await alpaca.getActivities({
      activity_type: 'FILL',
      direction: 'desc',
      after:  dayjs(startDate).toISOString(),
      until:  dayjs(endDate).endOf('day').toISOString(),
    });

    const realizedTrades = acts
      .filter((a: any) => a.side === 'sell' || a.side === 'sell_short')
      .map((a: any) => ({
        Symbol:     a.symbol,
        Type:       a.side === 'sell' ? 'Long' : 'Short',
        EntryTime:  a.transaction_time,
        ExitTime:   a.transaction_time,
        Qty:        Number(a.qty),
        EntryPrice: Number(a.price),
        ExitPrice:  Number(a.price),
        Pnl:        Number(a.net_amount),
      }));

    // ---- summaries ---- //
    const totalRealized = realizedTrades.reduce((s, t) => s + t.Pnl, 0);
    const totalUnreal   = openPositions.reduce((s, p) => s + p['Unrealized P&L'], 0);
    const mktVal        = openPositions.reduce((s, p) => s + p['Market Value'], 0);

    return NextResponse.json({
      openPositions,
      unrealizedPL: totalUnreal,
      totalMarketValue: mktVal,
      totalRealizedPL: totalRealized,
      realizedTrades,
      fetchErrors: [],
      dataTimestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    // Print error details to the response for easier debugging
    return NextResponse.json(
      {
        error: error?.message || 'Unknown error in Alpaca API call.',
        stack: error?.stack,
        env: {
          STRATEGY: strategy,
          ALPACA_API_KEY: process.env.ALPACA_API_KEY ? 'SET' : undefined,
          ALPACA_SECRET_KEY: process.env.ALPACA_SECRET_KEY ? 'SET' : undefined,
          ALPACA_UNHOLY_KEY: process.env.ALPACA_UNHOLY_KEY ? 'SET' : undefined,
          ALPACA_UNHOLY_SECRET_KEY: process.env.ALPACA_UNHOLY_SECRET_KEY ? 'SET' : undefined,
          ALPACA_SCALPINGSNIPER_KEY: process.env.ALPACA_SCALPINGSNIPER_KEY ? 'SET' : undefined,
          ALPACA_SCALPINGSNIPER_SECRET_KEY: process.env.ALPACA_SCALPINGSNIPER_SECRET_KEY ? 'SET' : undefined,
        },
        inputParams: {
          startDateParam,
          endDateParam,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          strategy
        }
      },
      { status: 500 }
    );
  }
}
