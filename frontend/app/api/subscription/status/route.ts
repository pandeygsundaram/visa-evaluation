import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getSubscriptionDetails } from '@/lib/services/stripeService';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export const GET = withAuth(async (_req, { userId }) => {
  const sub = getSubscriptionDetails(userId);

  if (!sub) {
    const freePlan = getDb().prepare("SELECT * FROM plans WHERE tier = 'free' AND is_active = 1 LIMIT 1").get() as any;
    return NextResponse.json({
      success: true,
      data: {
        subscription: null,
        plan: freePlan ? { ...freePlan, features: JSON.parse(freePlan.features || '[]') } : null,
        isActive: false,
        onFreePlan: true,
      },
    });
  }

  const callsRemaining = sub.call_limit - sub.calls_used;

  return NextResponse.json({
    success: true,
    data: {
      subscription: {
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start),
        currentPeriodEnd: new Date(sub.current_period_end),
        cancelAtPeriodEnd: sub.cancel_at_period_end === 1,
        callsUsed: sub.calls_used,
        callsRemaining,
      },
      plan: {
        name: sub.plan_name,
        tier: sub.tier,
        callLimit: sub.call_limit,
        billingPeriod: sub.billing_period,
        price: sub.price,
        features: JSON.parse(sub.features || '[]'),
      },
      isActive: sub.status === 'active',
      onFreePlan: false,
    },
  });
});
