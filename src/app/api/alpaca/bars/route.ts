// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import Alpaca from "@alpacahq/alpaca-trade-api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

// ────────────────────────────────────────────────────────────────
//  Day.js setup
// ────────────────────────────────────────────────────────────────
dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

type Creds = { keyId?: string; secretKey?: string };

const STRATEGY_KEYS: Record<string, Creds> = {
  day:    { keyId: process.env.ALPACA_DAY_KEY,    secretKey: process.env.ALPACA_DAY_SECRET },
  swing:  { keyId: process.env.ALPACA_SWING_KEY,  secretKey: process.env.ALPACA_SWING_SECRET },
  options:{ keyId: process.env.ALPACA_OPTIONS_KEY,secretKey: process.env.ALPACA_OPTIONS_SECRET },
};

// ────────────────────────────────────────────────────────────────
//  Handler
// ────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ----- read & validate query params -----
  const startRaw   = searchParams.get("start");
  const endRaw     = searchParams.get("end");
  const symbol     = searchParams.get("symbol")?.toUpperCase();
  const strategy   = (searchParams.get("strategy") || "swing").toLowerCase();

  if (!startRaw || !endRaw) {
    return NextResponse.json({ message: "Missing 'start' or 'end' query param." }, { status: 400 });
  }

  const startDate = dayjs(startRaw);
  const endDate   = dayjs(endRaw);

  if (!startDate.isValid() || !endDate.isValid()) {
    return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }
  if (endDate.isBefore(startDate)) {
    return NextResponse.json({ message: "'end' date must be on/after 'start' date." }, { status: 400 });
  }

  // ----- credentials -----
  const creds = STRATEGY_KEYS[strategy] || STRATEGY_KEYS.swing;
  if (!creds.keyId || !creds.secretKey) {
    return NextResponse.json({ message: `Server mis‑configured for strategy '${strategy}'.` }, { status: 500 });
  }

  // ----- Alpaca client -----
  let alpaca: any;
  try {
    alpaca = new Alpaca({ keyId: creds.keyId, secretKey: creds.secretKey, paper: true });
    await alpaca.getAccount(); // sanity check credentials
  } catch (err) {
    console.error("Alpaca init/account check failed", err);
    return NextResponse.json({ message: "Failed to authenticate with Alpaca." }, { status: 502 });
  }

  try {
    // ── positions ──
    const positionsResp = await alpaca.getPositions();
    const openPositions = positionsResp.map((p: any) => ({
      symbol: p.symbol,
      qty: Number(p.qty),
      avg_entry_price: Number(p.avg_entry_price),
      current_price: Number(p.current_price),
      market_value: Number(p.market_value),
      unrealized_pl: Number(p.unrealized_pl),
    }));

    // ── activities (fills) ──
    const acts = await alpaca.getActivities({
      activity_types: ["FILL"],
      direction: "desc",
      after: startDate.startOf("day").toISOString(),
      until: endDate.endOf("day").toISOString(),
    });

    const closedTrades = acts
      .filter((a: any) => (symbol ? a.symbol === symbol : true))
      .filter((a: any) => a.side === "sell") // simplistic realised filter
      .map((a: any) => ({
        symbol: a.symbol,
        qty: Number(a.qty),
        side: a.side,
        filled_avg_price: Number(a.price),
        realized_pl: Number(a.net_amount ?? 0), // placeholder; refine later
        filled_at: a.transaction_time,
      }));

    const totalRealized  = closedTrades.reduce((s, t) => s + t.realized_pl, 0);
    const totalUnreal    = openPositions.reduce((s, p) => s + p.unrealized_pl, 0);
    const marketValue    = openPositions.reduce((s, p) => s + p.market_value, 0);

    return NextResponse.json({
      openPositions,
      closedTrades,
      realized: totalRealized,
      unrealized: totalUnreal,
      marketValue,
      dataTimestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Alpaca data fetch failed", err);
    return NextResponse.json({ message: err.message || "Alpaca error" }, { status: 502 });
  }
}
