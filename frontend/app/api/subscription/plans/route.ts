import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const plans = db.prepare('SELECT * FROM plans WHERE is_active = 1 ORDER BY price ASC').all() as any[];

  return NextResponse.json({
    success: true,
    data: plans.map((p) => ({ ...p, features: JSON.parse(p.features || '[]') })),
  });
}
