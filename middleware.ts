import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.json({ ok: true });
  }
  // let everything else proceed as normal
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/health'],
};
