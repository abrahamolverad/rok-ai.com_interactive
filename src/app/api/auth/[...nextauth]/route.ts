import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ message: "Auth API placeholder" });
}

export async function POST() {
  return NextResponse.json({ message: "Auth API placeholder" });
}