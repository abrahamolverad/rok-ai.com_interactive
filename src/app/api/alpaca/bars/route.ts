import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Parse URL to get search parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'SPY';
    const timeframe = searchParams.get('timeframe') || '1Day';
    
    // Return mock data
    return NextResponse.json([
      { t: new Date().toISOString(), o: 450.25, h: 452.30, l: 448.75, c: 451.20, v: 65321456 },
      { t: new Date(Date.now() - 86400000).toISOString(), o: 451.50, h: 453.75, l: 449.80, c: 450.25, v: 72145632 },
      { t: new Date(Date.now() - 172800000).toISOString(), o: 447.80, h: 452.15, l: 447.30, c: 451.50, v: 68452137 },
      { t: new Date(Date.now() - 259200000).toISOString(), o: 445.25, h: 448.60, l: 444.75, c: 447.80, v: 59876321 },
      { t: new Date(Date.now() - 345600000).toISOString(), o: 446.50, h: 447.25, l: 443.80, c: 445.25, v: 62347895 }
    ]);
  } catch (error) {
    console.error('Error in bars API:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}