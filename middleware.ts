import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Health check
  if (pathname === '/api/health') {
    return NextResponse.json({ ok: true });
  }

  // Dashboard data stub
  if (pathname === '/api/dashboard') {
    // You can pull start/end from searchParams if needed
    const start = searchParams.get('start') || '';
    const end   = searchParams.get('end')   || '';
    return NextResponse.json({
      dailyRealized: [
        { date: start, value: 120 },
        { date: end,   value: 75 }
      ],
      metrics: { unrealized: 4750, marketValue: 85200, realized: 1695 },
      openPositions: [
        { symbol: 'AAPL', qty: 10, avgPrice: 150, currentPrice: 155 }
      ]
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/health', '/api/dashboard'],
};
