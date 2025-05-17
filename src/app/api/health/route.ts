import { NextResponse } from 'next/server';
import { z } from 'zod';

const HealthResponseSchema = z.object({ ok: z.boolean() });

export async function GET() {
  const body = HealthResponseSchema.parse({ ok: true });
  return NextResponse.json(body);
}
