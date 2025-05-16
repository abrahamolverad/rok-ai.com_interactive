import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getAccountAndPositions } from '@/lib/alpacaService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = new Date(searchParams.get('startDate') ?? '1970-01-01');
  const end   = new Date(searchParams.get('endDate') ?? Date.now());
  const strategy = searchParams.get('strategy') ?? 'all';

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined.");
    return NextResponse.json({ message: 'Missing MONGODB_URI' }, { status: 500 });
  }

  const client = new MongoClient(uri);

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
      Symbol: p.Symbol,
      Qty: p.Qty,
      'Avg Entry Price': p['Avg Entry Price'],
      'Current Price': p['Current Price'],
      'Market Value': p['Market Value'],
      'Unrealized P&L': p['Unrealized P&L'],
      Side: p.Side,
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
    return NextResponse.json({ message: err.message, fetchErrors: [err.message] }, { status: 500 });
  } finally {
    await client.close();
  }
}