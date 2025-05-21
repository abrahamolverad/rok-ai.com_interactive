import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getAccountAndPositions } from '@/lib/alpacaService'; // Assuming this path is correct from its original location
import dayjs from 'dayjs'; // Import dayjs

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  console.log("[API /api/alpaca/dashboard] Entry. Params:", searchParams.toString());

  // Correctly get startDate, endDate, and strategyKey from searchParams
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  // Use 'strategyKey' as sent by the client, default to 'all' if not present or handle as error
  const strategyKey = searchParams.get('strategyKey') ?? 'all'; 

  console.log(`[API /api/alpaca/dashboard] StrategyKey: ${strategyKey}, StartDateParam: ${startDateParam}, EndDateParam: ${endDateParam}`);

  // Validate and parse dates
  const start = startDateParam ? dayjs(startDateParam).startOf('day').toDate() : dayjs().subtract(30, 'days').startOf('day').toDate();
  const end = endDateParam ? dayjs(endDateParam).endOf('day').toDate() : dayjs().endOf('day').toDate();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error("[API /api/alpaca/dashboard] Invalid date parameters received.");
    return NextResponse.json(
      { message: 'Invalid or missing start/end date.', startDateParam, endDateParam },
      { status: 400 }
    );
  }
  console.log(`[API /api/alpaca/dashboard] Processing for Start: ${start.toISOString()}, End: ${end.toISOString()}`);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[API /api/alpaca/dashboard] ❌ MONGODB_URI is not defined.");
    return NextResponse.json({ message: 'Missing MONGODB_URI' }, { status: 500 });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("[API /api/alpaca/dashboard] MongoDB connected.");
    const db = client.db('rokai'); // Assuming 'rokai' is your DB name
    const col = db.collection('realized_trades');

    const query: any = { exit_time: { $gte: start, $lte: end } };
    if (strategyKey !== 'all') {
      query.strategy = strategyKey; // Use the strategyKey for filtering
    }
    console.log("[API /api/alpaca/dashboard] MongoDB query for realized_trades:", JSON.stringify(query));

    const realizedTrades = await col.find(query).sort({ exit_time: -1 }).toArray();
    console.log(`[API /api/alpaca/dashboard] Fetched ${realizedTrades.length} realized trades from MongoDB.`);
    if (realizedTrades.length > 0) {
      console.log("[API /api/alpaca/dashboard] First few realized trades from DB:", JSON.stringify(realizedTrades.slice(0, 3), null, 2));
    }
    
    // Ensure PNL is a number, default to 0 if null or undefined
    const totalRealizedPL = realizedTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    console.log(`[API /api/alpaca/dashboard] Calculated Total Realized P&L from DB: ${totalRealizedPL}`);

    // Fetch open positions (this part seemed to be working for unrealized P&L)
    // Note: getAccountAndPositions might use a default Alpaca client if one isn't passed.
    // If strategyKey should also determine API keys for open positions, this needs adjustment.
    // For now, assuming it uses a general/default key setup that works for open positions.
    const { positions, errors: openPositionsErrors } = await getAccountAndPositions(); 
    // Assuming getAccountAndPositions might return an errors array
    if (openPositionsErrors && openPositionsErrors.length > 0) {
        console.warn("[API /api/alpaca/dashboard] Errors fetching open positions:", openPositionsErrors);
    }

    const openPositionsMapped = positions.map((p: any) => ({
      Symbol: p.Symbol,
      Qty: p.Qty,
      'Avg Entry Price': p['Avg Entry Price'],
      'Current Price': p['Current Price'],
      'Market Value': p['Market Value'],
      'Unrealized P&L': p['Unrealized P&L'],
      Side: p.Side,
    }));
    console.log(`[API /api/alpaca/dashboard] Fetched ${openPositionsMapped.length} open positions for unrealized P&L.`);


    const unrealizedPL = openPositionsMapped.reduce((s, p) => s + (p['Unrealized P&L'] || 0), 0);
    const totalMarketValue = openPositionsMapped.reduce((s, p) => s + (p['Market Value'] || 0), 0);

    return NextResponse.json({
      openPositions: openPositionsMapped,
      unrealizedPL,
      totalMarketValue,
      totalRealizedPL,
      realizedTrades, // These now come from MongoDB
      // topWinners and topLosers logic was here, can be re-added if needed
      fetchErrors: openPositionsErrors || [], // Include any errors from fetching open positions
      dataTimestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API /api/alpaca/dashboard] General error:', err);
    return NextResponse.json({ message: err.message, fetchErrors: [err.message] }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
      console.log("[API /api/alpaca/dashboard] MongoDB connection closed.");
    }
  }
}