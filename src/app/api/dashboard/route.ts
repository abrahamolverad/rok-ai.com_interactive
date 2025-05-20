import { NextResponse } from 'next/server';
import Alpaca from '@alpacahq/alpaca-trade-api';
import dayjs from 'dayjs';
import { fetchAndCalculatePnl, getOpenPositions } from '../../../../lib/alpacaService'; // Adjusted path

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  console.log("[API /api/dashboard] Entry. Params:", searchParams.toString());

  const startDateParam = searchParams.get('startDate') || searchParams.get('start');
  const endDateParam   = searchParams.get('endDate')   || searchParams.get('end');
  const strategy = searchParams.get('strategy') ?? 'Swing'; // Default to 'Swing' if not provided

  console.log(`[API /api/dashboard] Strategy: ${strategy}, StartDateParam: ${startDateParam}, EndDateParam: ${endDateParam}`);

  // Validate dates
  const startDate = startDateParam ? dayjs(startDateParam).startOf('day').toDate() : dayjs().subtract(30, 'days').startOf('day').toDate();
  const endDate   = endDateParam   ? dayjs(endDateParam).endOf('day').toDate()   : dayjs().endOf('day').toDate();

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error("[API /api/dashboard] Invalid date parameters received.");
    return NextResponse.json(
      { error: 'Invalid or missing start/end date.', startDateParam, endDateParam },
      { status: 400 }
    );
  }
  console.log(`[API /api/dashboard] Processing for Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);

  let alpaca: Alpaca;
  try {
    // IMPORTANT: Ensure these environment variables are correctly set for each strategy
    // and that the 'strategy' string from the client matches one of these cases.
    // The 'Default Strategy' from your UI screenshot needs to map here.
    // If 'Default Strategy' is meant to be 'Swing', it will fall into the default case.
    // If 'Default Strategy' is e.g. 'MyMainAccount' and it's not 'Day' or 'Options',
    // it will also use the 'Swing' (default) keys.
    // Double-check that the keys for the selected strategy are for the account
    // where your TSLA trades occurred.
    switch (strategy) {
      case 'Day':
        console.log("[API /api/dashboard] Using 'Day' strategy Alpaca keys.");
        alpaca = new Alpaca({
          keyId:     process.env.ALPACA_API_KEY!,
          secretKey: process.env.ALPACA_SECRET_KEY!,
          paper:     process.env.ALPACA_PAPER_TRADING === 'true' || true, // Default to paper if not set
        });
        break;
      case 'Options':
        console.log("[API /api/dashboard] Using 'Options' strategy Alpaca keys.");
        alpaca = new Alpaca({
          keyId:     process.env.ALPACA_SCALPINGSNIPER_KEY!,
          secretKey: process.env.ALPACA_SCALPINGSNIPER_SECRET_KEY!,
          paper:     process.env.ALPACA_PAPER_TRADING === 'true' || true,
        });
        break;
      case 'Swing': // Explicitly handle 'Swing' if it's a common strategy name
        console.log("[API /api/dashboard] Using 'Swing' strategy Alpaca keys.");
         alpaca = new Alpaca({
          keyId:     process.env.ALPACA_UNHOLY_KEY!, // Assuming these are for swing
          secretKey: process.env.ALPACA_UNHOLY_SECRET_KEY!,
          paper:     process.env.ALPACA_PAPER_TRADING === 'true' || true,
        });
        break;
      default:
        console.log(`[API /api/dashboard] Strategy '${strategy}' not explicitly mapped, using default/Swing Alpaca keys.`);
        alpaca = new Alpaca({ // Defaulting to 'Swing' keys as in original code
          keyId:     process.env.ALPACA_UNHOLY_KEY!,
          secretKey: process.env.ALPACA_UNHOLY_SECRET_KEY!,
          paper:     process.env.ALPACA_PAPER_TRADING === 'true' || true,
        });
    }
    // Test connection / key validity
    await alpaca.getAccount();
    console.log("[API /api/dashboard] Alpaca account connection successful.");

  } catch (e: any) {
    console.error("[API /api/dashboard] Error initializing Alpaca or fetching account:", e.message);
    console.error("[API /api/dashboard] Check strategy mapping and API key environment variables for strategy:", strategy);
    return NextResponse.json(
      { error: `Missing or invalid Alpaca API credentials for strategy: ${strategy}. ${e.message}` },
      { status: 500 }
    );
  }

  try {
    // Fetch open positions
    const { data: openPositionsData, total_upl, total_mv, error: openPositionsError } = await getOpenPositions(alpaca);
    if (openPositionsError) {
      console.warn("[API /api/dashboard] Error fetching open positions:", openPositionsError);
      // Decide if you want to return an error or continue with potentially empty positions
    }
    console.log(`[API /api/dashboard] Fetched ${openPositionsData.length} open positions.`);

    // Fetch and calculate realized P&L using the service function
    console.log(`[API /api/dashboard] Calling fetchAndCalculatePnl for ${strategy} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    const pnlData = await fetchAndCalculatePnl(alpaca, startDate, endDate);
    
    const realizedTrades = pnlData.data; // This is RealizedTradeOutput[]
    const fetchErrors = pnlData.fetchErrors;

    if (fetchErrors && fetchErrors.length > 0) {
        console.warn("[API /api/dashboard] Errors from fetchAndCalculatePnl:", fetchErrors);
    }
    console.log(`[API /api/dashboard] Calculated ${realizedTrades.length} realized trades from service.`);
    if (realizedTrades.length > 0) {
        console.log("[API /api/dashboard] First few realized trades from service:", JSON.stringify(realizedTrades.slice(0,3), null, 2));
    }


    const totalRealizedPL = realizedTrades.reduce((sum, trade) => sum + (trade.Pnl || 0), 0);
    console.log(`[API /api/dashboard] Total Realized P&L from service: ${totalRealizedPL}`);

    // Ensure structure matches what client expects
    // The openPositionsData from getOpenPositions already matches the client structure
    // The realizedTrades from fetchAndCalculatePnl also largely matches
    // { Symbol, Type, EntryTime, ExitTime, Qty, EntryPrice, ExitPrice, Pnl, ExitOrderID, ExitDate }

    return NextResponse.json({
      openPositions: openPositionsData,
      unrealizedPL: total_upl,
      totalMarketValue: total_mv,
      totalRealizedPL: totalRealizedPL,
      realizedTrades: realizedTrades,
      fetchErrors: fetchErrors || [], // Send back any errors from PnL calculation
      dataTimestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[API /api/dashboard] General error in GET handler:", error);
    return NextResponse.json(
      {
        error: error?.message || 'Unknown error in Alpaca API call or P&L processing.',
        stack: error?.stack, // Be cautious about sending full stack in production
        details: "Error occurred while fetching dashboard data.",
        inputParams: { startDate: startDate.toISOString(), endDate: endDate.toISOString(), strategy }
      },
      { status: 500 }
    );
  }
}