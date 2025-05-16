import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getAccountAndPositions } from '@/lib/alpacaService';

const uri = process.env.MONGO_URI!;
const client = globalThis.mongoClient ?? new MongoClient(uri);
if (!globalThis.mongoClient) globalThis.mongoClient = client;

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = new Date(searchParams.get('startDate') ?? '1970-01-01');
  const end   = new Date(searchParams.get('endDate') ?? Date.now());
  const strategy = searchParams.get('strategy') ?? 'all';

  try {
    await client.connect();
    const db  = client.db('rokai');
    const col = db.collection('realized_trades');

    const query: any = { exit_time: { $gte: start, $lte: end } };
    if (strategy !== 'all') query.strategy = strategy;

    const realizedTrades = await col.find(query).sort({ exit_time: -1 }).toArray();
    const totalRealizedPL = realizedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

    const sorted = [...realizedTrades].sort((a, b) => b.pnl - a.pnl);
    const topWinners = sorted.slice(0, 10);
    const topLosers = sorted.filter(t => t.pnl < 0).slice(-10).reverse();

    const { positions } = await getAccountAndPositions();
    const openPositions = positions.map((p: any) => ({
      Symbol: p.symbol,
      Qty: p.qty,
      'Avg Entry Price': p.avg_entry_price,
      'Current Price': p.current_price,
      'Market Value': p.market_value,
      'Unrealized P&L': p.unrealized_pl,
      Side: p.side,
    }));

    const unrealizedPL = openPositions.reduce((s, p) => s + p['Unrealized P&L'], 0);
    const totalMarketValue = openPositions.reduce((s, p) => s + p['Market Value'], 0);

    return NextResponse.json({
      openPositions,
      unrealizedPL,
      totalMarketValue,
      totalRealizedPL,
      realizedTrades,
      topWinners,
      topLosers,
      fetchErrors: [],
      dataTimestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[dashboard API]', err);
    return NextResponse.json(
      { message: err.message, fetchErrors: [err.message] },
      { status: 500 },
    );
  }
}
