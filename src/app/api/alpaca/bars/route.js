import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json([
    { t: new Date().toISOString(), o: 450.25, h: 452.30, l: 448.75, c: 451.20, v: 65321456 },
    { t: new Date(Date.now() - 86400000).toISOString(), o: 451.50, h: 453.75, l: 449.80, c: 450.25, v: 72145632 }
  ]);
}