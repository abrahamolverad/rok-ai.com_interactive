import type { NextApiRequest, NextApiResponse } from 'next';

type DashboardData = {
  dailyRealized: { date: string; value: number }[];
  metrics: { unrealized: number; marketValue: number; realized: number };
  openPositions: { symbol: string; qty: number; avgPrice: number; currentPrice: number }[];
};

export default function handler(req: NextApiRequest, res: NextApiResponse<DashboardData>) {
  const { start, end } = req.query;

  // Stub: return fixed data regardless of start/end for now
  res.status(200).json({
    dailyRealized: [
      { date: '2025-05-10', value: 120 },
      { date: '2025-05-11', value: 75 },
      { date: '2025-05-12', value: 25 },
      { date: '2025-05-13', value: 30 },
      { date: '2025-05-14', value: 230 }
    ],
    metrics: {
      unrealized: 4750,
      marketValue: 85200,
      realized: 1695
    },
    openPositions: [
      { symbol: 'AAPL', qty: 10, avgPrice: 150, currentPrice: 155 },
      { symbol: 'TSLA', qty: 5, avgPrice: 600, currentPrice: 610 }
    ]
  });
}
