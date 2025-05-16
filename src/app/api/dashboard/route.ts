import { NextRequest, NextResponse } from 'next/server';

/**
 * Placeholder endpoint so the dashboard loads.
 * Replace the mock numbers with your real DB query later.
 *
 * URL example:
 * /api/dashboard?from=2025-04-16&to=2025-05-16&strategy=Swing&symbol=ALL
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  /* You can keep these lines for logging / future validation */
  const from      = searchParams.get('from')      ?? '';
  const to        = searchParams.get('to')        ?? '';
  const strategy  = searchParams.get('strategy')  ?? '';
  const symbol    = searchParams.get('symbol')    ?? 'ALL';

  /* ---- MOCK DATA (replace later) --------------------------------------- */
  const summary = { realized: 0, unrealized: 283.01, marketValue: 88864.34 };

  const equityCurve = [
    { date: from || '2025-04-16', pnl: 0 },
    { date:  to  || '2025-05-16', pnl: 283.01 },
  ];

  const positions: any[] = [];   // empty list for now
  /* ---------------------------------------------------------------------- */

  return NextResponse.json({ summary, equityCurve, positions });
}
