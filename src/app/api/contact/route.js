import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: "Contact form submission placeholder" });
}