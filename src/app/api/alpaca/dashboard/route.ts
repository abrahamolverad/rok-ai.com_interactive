import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return mock dashboard data
    return NextResponse.json({
      account: {
        cash: 10000.00,
        equity: 12500.00,
        buying_power: 25000.00,
        daytrading_buying_power: 40000.00,
        portfolio_value: 12500.00,
        initial_margin: 0.00,
        maintenance_margin: 0.00,
        last_equity: 12350.00,
        last_maintenance_margin: 0.00
      },
      positions: [
        {
          symbol: "AAPL",
          qty: 10,
          market_value: 1750.00,
          cost_basis: 1500.00,
          unrealized_pl: 250.00,
          unrealized_plpc: 0.1667,
          current_price: 175.00,
          lastday_price: 172.50,
          change_today: 0.0145
        },
        {
          symbol: "MSFT",
          qty: 5,
          market_value: 1500.00,
          cost_basis: 1350.00,
          unrealized_pl: 150.00,
          unrealized_plpc: 0.1111,
          current_price: 300.00,
          lastday_price: 298.75,
          change_today: 0.0042
        }
      ],
      watchlist: [
        { symbol: "SPY", last_price: 451.20, change_percent: 0.0021 },
        { symbol: "QQQ", last_price: 392.15, change_percent: 0.0034 },
        { symbol: "TSLA", last_price: 242.85, change_percent: -0.0012 },
        { symbol: "NVDA", last_price: 824.30, change_percent: 0.0162 },
        { symbol: "AMZN", last_price: 178.25, change_percent: 0.0085 }
      ]
    });
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}