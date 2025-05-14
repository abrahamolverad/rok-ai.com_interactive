// src/lib/alpacaService.ts
import Alpaca from '@alpacahq/alpaca-trade-api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween'; // Needed for market hours check

dayjs.extend(utc);
dayjs.extend(isBetween);


// --- Interfaces ---
// Interface for Open Position Data
interface PositionInfo {
    Symbol: string;
    Qty: number;
    'Avg Entry Price': number;
    'Current Price': number;
    'Market Value': number;
    'Unrealized P&L': number;
    'Unrealized P&L %': number;
    Side: 'long' | 'short';
}
interface PositionData {
    data: PositionInfo[];
    total_upl: number;
    total_mv: number;
    error?: string;
}

// Internal fill structure for FIFO function
interface FifoFill {
    side: 'buy' | 'sell';
    qty: number;
    price: number;
    timestamp: Date;
    order_id: string; // Order ID associated with the fill
}

// Internal realized trade structure (used during calculation)
interface RealizedTradeInternal {
    Symbol: string;
    Type: 'Long' | 'Short';
    EntryTime: Date;
    ExitTime: Date;
    Qty: number;
    EntryPrice: number;
    ExitPrice: number;
    Pnl: number;
    ExitOrderID: string; // Order ID of the closing fill
}

// Output realized trade structure (returned by the service)
interface RealizedTradeOutput {
    Symbol: string;
    Type: 'Long' | 'Short';
    EntryTime: string; // ISO String
    ExitTime: string; // ISO String
    Qty: number;
    EntryPrice: number;
    ExitPrice: number;
    Pnl: number;
    ExitOrderID: string; // Order ID of the closing fill
    ExitDate?: string; // YYYY-MM-DD format
}

// Interface for the overall P&L data returned
interface PnlData {
    data: RealizedTradeOutput[];
    fetchErrors: string[];
    metrics?: any; // Placeholder for future metrics
}


// --- Get Open Positions Function ---
export async function getOpenPositions(alpaca: Alpaca): Promise<PositionData> {
    console.log("Fetching open positions via Node SDK...");
    let openPositionsData: PositionInfo[] = [];
    let total_unrealized_pnl = 0.0;
    let total_market_value = 0.0;
    try {
        // Fetch positions using the Alpaca SDK
        const positions: any[] = await alpaca.getPositions();
        console.log(`Fetched ${positions.length} open positions.`);

        // Process each position
        positions.forEach(pos => {
            try {
                // Parse numeric values safely
                const qty = parseFloat(pos.qty);
                const avg_entry_price = parseFloat(pos.avg_entry_price);
                const current_price = parseFloat(pos.current_price);
                const market_value = parseFloat(pos.market_value);
                const unrealized_pl = parseFloat(pos.unrealized_pl);
                const unrealized_plpc = parseFloat(pos.unrealized_plpc) * 100; // Convert percentage

                // Add processed data to the array
                openPositionsData.push({
                    Symbol: pos.symbol, Qty: qty, 'Avg Entry Price': avg_entry_price,
                    'Current Price': current_price, 'Market Value': market_value,
                    'Unrealized P&L': unrealized_pl, 'Unrealized P&L %': unrealized_plpc, Side: pos.side,
                });
                // Accumulate totals
                total_unrealized_pnl += unrealized_pl;
                total_market_value += market_value;
            } catch (e) {
                // Log warning if processing a single position fails
                console.warn(`Error processing position for ${pos.symbol}:`, e);
            }
        });
        // Return the processed data and totals
        return { data: openPositionsData, total_upl: total_unrealized_pnl, total_mv: total_market_value };
    } catch (error: any) {
        // Handle errors during the API call
        console.error("API Error fetching open positions:", error);
        const errorMessage = error.response?.data?.message || error.message || error;
        return { data: [], total_upl: 0, total_mv: 0, error: `API Error fetching positions: ${errorMessage}` };
    }
}


/**
 * Calculates FIFO P&L for a single symbol's fills.
 * Handles both long and short trades using simple array queues.
 * Captures the Exit Order ID.
 */
function calculateFifoPnlForSymbol(symbol: string, fills: FifoFill[]): RealizedTradeInternal[] {
    const realizedTrades: RealizedTradeInternal[] = [];
    // Use simple arrays as queues: [qty, price, entry_timestamp]
    const longQueue: [number, number, Date][] = [];
    const shortQueue: [number, number, Date][] = [];

    // Sort fills chronologically (essential for FIFO)
    fills.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const tolerance = 0.00001; // For floating point comparisons

    // Process each fill chronologically
    for (const fill of fills) { // 'fill' here represents the potential EXIT fill
        let qtyToProcess = fill.qty;

        if (fill.side === 'buy') {
            // --- BUY FILL --- Potentially closes short positions first
            while (qtyToProcess > tolerance && shortQueue.length > 0) {
                const shortLot = shortQueue[0]; // Get the oldest short lot (FIFO)
                const [shortQty, shortPrice, entryTime] = shortLot;
                const matchQty = Math.min(qtyToProcess, shortQty); // Determine quantity to match

                // Calculate P&L for the matched short position
                const pnl = (shortPrice - fill.price) * matchQty;
                // Record the realized trade
                realizedTrades.push({
                    Symbol: symbol, Type: "Short", EntryTime: entryTime, ExitTime: fill.timestamp,
                    Qty: matchQty, EntryPrice: shortPrice, ExitPrice: fill.price, Pnl: pnl,
                    ExitOrderID: fill.order_id // Store the order ID of the closing (buy) fill
                });

                qtyToProcess -= matchQty; // Decrease remaining quantity of the current fill
                shortLot[0] -= matchQty; // Decrease quantity in the matched short lot

                // If the short lot is fully closed, remove it from the queue
                if (shortLot[0] < tolerance) {
                    shortQueue.shift();
                }
            }
            // If any quantity of the buy fill remains, it opens/increases a long position
            if (qtyToProcess > tolerance) {
                longQueue.push([qtyToProcess, fill.price, fill.timestamp]);
            }
        } else { // fill.side === 'sell'
            // --- SELL FILL --- Potentially closes long positions first
            while (qtyToProcess > tolerance && longQueue.length > 0) {
                const longLot = longQueue[0]; // Get the oldest long lot (FIFO)
                const [longQty, longPrice, entryTime] = longLot;
                const matchQty = Math.min(qtyToProcess, longQty); // Determine quantity to match

                // Calculate P&L for the matched long position
                const pnl = (fill.price - longPrice) * matchQty;
                // Record the realized trade
                realizedTrades.push({
                    Symbol: symbol, Type: "Long", EntryTime: entryTime, ExitTime: fill.timestamp,
                    Qty: matchQty, EntryPrice: longPrice, ExitPrice: fill.price, Pnl: pnl,
                    ExitOrderID: fill.order_id // Store the order ID of the closing (sell) fill
                });

                qtyToProcess -= matchQty; // Decrease remaining quantity of the current fill
                longLot[0] -= matchQty; // Decrease quantity in the matched long lot

                // If the long lot is fully closed, remove it from the queue
                if (longLot[0] < tolerance) {
                    longQueue.shift();
                }
            }
            // If any quantity of the sell fill remains, it opens/increases a short position
            if (qtyToProcess > tolerance) {
                shortQueue.push([qtyToProcess, fill.price, fill.timestamp]);
            }
        }
    } // end for loop over fills

    return realizedTrades;
}

// Helper function for delays used in retry logic
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches fill activities with retry logic and calculates realized P&L.
 */
export async function fetchAndCalculatePnl(
    alpaca: Alpaca,
    startDate: Date,
    endDate: Date
): Promise<PnlData> {
    console.log(`Fetching fills from ${startDate.toISOString()} to ${endDate.toISOString()} with pagination...`);
    const allActivities: any[] = [];
    const fetchErrors: string[] = [];
    const MAX_PAGES = 100;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;
    let pageCount = 0;
    let currentAfterISO = startDate.toISOString();
    const fetchUntilISO = endDate.toISOString();
    const pageSize = 100; // Define page size here for reuse

    try {
        while (pageCount < MAX_PAGES) {
            pageCount++;
            let retries = 0;
            let success = false;
            let activityPage: any[] = [];
            const params = { activity_types: ['FILL'], direction: 'asc', after: currentAfterISO, until: fetchUntilISO, page_size: pageSize };

            while (retries < MAX_RETRIES && !success) {
                try {
                    activityPage = await alpaca.getAccountActivities(params);
                    success = true;
                } catch (api_e: any) {
                    retries++;
                    const errorCode = api_e?.code;
                    const errorMessage = api_e?.message || String(api_e);
                    console.warn(`API Error page ${pageCount}, attempt ${retries}/${MAX_RETRIES}: Code=${errorCode}, Msg=${errorMessage}`);
                    if ((errorCode === 'ECONNRESET' || errorMessage.includes('socket hang up') || errorCode === 429 || errorMessage.includes('rate limit')) && retries < MAX_RETRIES) {
                        await delay(RETRY_DELAY);
                    } else {
                         const error_msg = `API Error page ${pageCount}: ${errorMessage}`;
                         fetchErrors.push(error_msg);
                         console.error(`Failed to fetch page ${pageCount} after ${retries} attempts.`);
                         success = true; // Stop retrying this page
                         activityPage = [];
                         if (errorMessage.includes("after is in an invalid format") || errorCode === 422) {
                             console.log("Stopping pagination due to invalid timestamp or 422 error.");
                             break; // Break retry loop
                         }
                    }
                }
            } // End retry while loop

            if (!activityPage || activityPage.length === 0) {
                 if (success) console.log(`Page ${pageCount} empty or pagination stopped.`);
                 break; // Break page loop
            }

            allActivities.push(...activityPage);

            const lastActivity = activityPage[activityPage.length - 1];
            const lastActivityTimeObj = lastActivity?.transaction_time || lastActivity?.timestamp;
            if (lastActivityTimeObj) {
                try {
                    const lastTsAware = dayjs(lastActivityTimeObj).utc().toDate();
                    const nextAfterTs = dayjs(lastTsAware).add(1, 'millisecond').toDate();
                    currentAfterISO = nextAfterTs.toISOString();
                } catch (ts_e) { fetchErrors.push(`Timestamp parse error: ${ts_e}`); console.error(`TS parse error: ${ts_e}. Stopping.`); break; }
            } else { console.warn("Last activity no timestamp. Stopping pagination."); break; }

            if (activityPage.length < pageSize) {
                console.log("Received less than page size, assuming end of activities.");
                break; // Break page loop
            }
            await delay(200);
        } // End page while loop

        console.log(`Fetched ${allActivities.length} total fill activities across ${pageCount} page(s).`);
        if (pageCount >= MAX_PAGES) fetchErrors.push("Reached max pagination limit.");

        // --- Process Fills ---
        console.log("Processing fills...");
        const fillsBySymbol: { [key: string]: FifoFill[] } = {};
        let parseErrors = 0;
        allActivities.forEach(act => {
            try {
                if (String(act.activity_type).toUpperCase() === 'FILL' && act.symbol && act.qty && act.price && act.transaction_time && act.side && act.order_id) {
                    const symbol = act.symbol;
                    if (!fillsBySymbol[symbol]) fillsBySymbol[symbol] = [];
                    fillsBySymbol[symbol].push({
                        timestamp: dayjs(act.transaction_time).utc().toDate(),
                        side: act.side as 'buy' | 'sell',
                        qty: parseFloat(act.qty),
                        price: parseFloat(act.price),
                        order_id: act.order_id
                    });
                } else if (String(act.activity_type).toUpperCase() === 'FILL' && !act.order_id) {
                     console.warn(`Fill activity missing order_id: ${act.id}, Symbol: ${act.symbol}`);
                }
            } catch (e) { parseErrors++; }
        });
        if (parseErrors > 0) fetchErrors.push(`Encountered ${parseErrors} errors parsing fill activities.`);

        // --- FIFO Calculation ---
        console.log("--- Starting FIFO Calculation (Using calculateFifoPnlForSymbol) ---");
        const allRealizedTradesInternal: RealizedTradeInternal[] = [];
        for (const symbol in fillsBySymbol) {
            const symbolFills = fillsBySymbol[symbol];
            const symbolRealizedTrades = calculateFifoPnlForSymbol(symbol, symbolFills);
            allRealizedTradesInternal.push(...symbolRealizedTrades);
        }
        console.log("--- Finished FIFO Calculation ---");
        console.log(`Calculated ${allRealizedTradesInternal.length} total realized trades across all symbols.`);

        // --- Format Output ---
        const formattedTrades: RealizedTradeOutput[] = allRealizedTradesInternal.map(t => ({
            Symbol: t.Symbol, Type: t.Type, EntryTime: t.EntryTime.toISOString(),
            ExitTime: t.ExitTime.toISOString(), Qty: t.Qty, EntryPrice: t.EntryPrice,
            ExitPrice: t.ExitPrice, Pnl: t.Pnl, ExitOrderID: t.ExitOrderID,
            ExitDate: dayjs(t.ExitTime).utc().format('YYYY-MM-DD')
        }));

        return { data: formattedTrades, fetchErrors };

    } catch (error: any) {
        console.error("Unhandled Error in fetchAndCalculatePnl:", error);
        fetchErrors.push(`Fatal Processing Error: ${error.message || error}`);
        return { data: [], fetchErrors };
    }
}
