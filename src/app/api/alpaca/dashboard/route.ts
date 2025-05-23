console.log("[DEBUG] LIVE route.ts executing for strategyKey logic – 2024-05-23");


import { NextResponse } from 'next/server';
import { getAccountAndPositions, getRealizedTradesAndPnlFromAPI } from '@/lib/alpacaService';
import dayjs from 'dayjs';

export const dynamic = 'force-dynamic';

function getAlpacaCredsForStrategy(strategyKey: string) {
  switch ((strategyKey || '').toLowerCase()) {
    case 'unholy_v1':
      return {
        keyId: process.env.ALPACA_UNHOLY_KEY!,
        secretKey: process.env.ALPACA_UNHOLY_SECRET_KEY!,
      };
    case 'scalpingsniper':
    case 'scalpingsniper_v0':
      return {
        keyId: process.env.ALPACA_SCALPINGSNIPER_KEY!,
        secretKey: process.env.ALPACA_SCALPINGSNIPER_SECRET_KEY!,
      };
    case 'default_strategy':
    default:
      return {
        keyId: process.env.ALPACA_API_KEY!,
        secretKey: process.env.ALPACA_SECRET_KEY!,
      };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const strategyKey = searchParams.get('strategyKey') ?? 'default_strategy';

  const start = startDateParam
    ? dayjs(startDateParam).startOf('day').toDate()
    : dayjs().subtract(30, 'days').startOf('day').toDate();
  const end = endDateParam
    ? dayjs(endDateParam).endOf('day').toDate()
    : dayjs().endOf('day').toDate();

  const creds = getAlpacaCredsForStrategy(strategyKey);

  let realizedTrades: any[] = [];
  let fetchErrors: string[] = [];
  let totalRealizedPL = 0;

  try {
    const { data, fetchErrors: errors } = await getRealizedTradesAndPnlFromAPI(start, end, creds);
    realizedTrades = data || [];
    fetchErrors = errors || [];
    totalRealizedPL = realizedTrades.reduce((sum, t) => sum + (Number(t.Pnl) || 0), 0);
  } catch (err: any) {
    fetchErrors.push(err.message || String(err));
  }

  let openPositionsMapped: any[] = [];
  let unrealizedPL = 0;
  let totalMarketValue = 0;
  try {
    const { positions } = await getAccountAndPositions(creds); // <-- pass creds here too!
    openPositionsMapped = positions.map((p: any) => ({
      Symbol: p.Symbol,
      Qty: p.Qty,
      'Avg Entry Price': p['Avg Entry Price'],
      'Current Price': p['Current Price'],
      'Market Value': p['Market Value'],
      'Unrealized P&L': p['Unrealized P&L'],
      Side: p.Side,
    }));
    unrealizedPL = openPositionsMapped.reduce((s, p) => s + (p['Unrealized P&L'] || 0), 0);
    totalMarketValue = openPositionsMapped.reduce((s, p) => s + (p['Market Value'] || 0), 0);
  } catch (err: any) {
    fetchErrors.push(err.message || String(err));
  }

  return NextResponse.json({
    openPositions: openPositionsMapped,
    unrealizedPL,
    totalMarketValue,
    totalRealizedPL,
    realizedTrades,
    fetchErrors,
    dataTimestamp: new Date().toISOString(),
  });
}
