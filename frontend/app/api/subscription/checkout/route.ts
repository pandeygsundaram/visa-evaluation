import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/services/stripeService';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export const POST = withAuth(async (req, { userId }) => {
  const { planId, successUrl, cancelUrl } = await req.json();
  if (!planId) {
    return NextResponse.json({ success: false, message: 'Plan ID is required' }, { status: 400 });
  }

  const db = getDb();
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId) as any;
  if (!plan) return NextResponse.json({ success: false, message: 'Plan not found' }, { status: 404 });
  if (plan.tier === 'free') {
    return NextResponse.json({ success: false, message: 'Cannot checkout free plan' }, { status: 400 });
  }

  const session = await createCheckoutSession(userId, planId, successUrl, cancelUrl);
  return NextResponse.json({ success: true, data: { sessionId: session.id, url: session.url } });
});
