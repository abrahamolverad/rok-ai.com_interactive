import { NextResponse } from 'next/server';
import Alpaca from '@alpacahq/alpaca-trade-api';
import dayjs from 'dayjs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate   = searchParams.get('startDate')!;
  const endDate     = searchParams.get('endDate')!;
  const strategy    = searchParams.get('strategy') ?? 'Swing';   // default

  /* ---- pick creds / algo per strategy ------------------------------ */
  let alpaca: any;
  switch (strategy) {
    case 'Day':
      alpaca = new Alpaca({
        keyId:     process.env.ALPACA_API_KEY!,
        secretKey: process.env.ALPACA_API_SECRET!,
        paper:     true,
      });
      break;
    case 'Options':
      alpaca = new Alpaca({
        keyId:     process.env.ALPACA_SCALPINGSNIPER_KEY!,
        secretKey: process.env.ALPACA_SCALPINGSNIPER_SECRET!,
        paper:     true,
      });
      break;
    default: // 'Swing'
      alpaca = new Alpaca({
        keyId:     process.env.ALPACA_UNHOLY_KEY!,
        secretKey: process.env.ALPACA_UNHOLY_SECRET!,
        paper:     true,
      });
  }

  /* ---- open positions --------------------------------------------- */
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

  /* ---- closed (realized) trades ----------------------------------- */
  // Alpaca v2 activities endpoint
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
      EntryTime:  a.transaction_time,          // simplify – real app should pair fills
      ExitTime:   a.transaction_time,
      Qty:        Number(a.qty),
      EntryPrice: Number(a.price),             // placeholder
      ExitPrice:  Number(a.price),
      Pnl:        Number(a.net_amount),        // sign already correct
    }));

  /* ---- summaries --------------------------------------------------- */
  const totalRealized = realizedTrades.reduce((s, t) => s + t.Pnl, 0);
  const totalUnreal   = openPositions.reduce((s, p) => s + p['Unrealized P&L'], 0);
  const mktVal        = openPositions.reduce((s, p) => s + p['Market Value'], 0);

  /* ---- respond ----------------------------------------------------- */
  return NextResponse.json({
    openPositions,
    unrealizedPL: totalUnreal,
    totalMarketValue: mktVal,
    totalRealizedPL: totalRealized,
    realizedTrades,
    fetchErrors: [],
    dataTimestamp: new Date().toISOString(),
  });
}
