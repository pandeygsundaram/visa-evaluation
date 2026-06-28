import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { checkSubscriptionQuota } from '@/lib/services/stripeService';

export const runtime = 'nodejs';

export const GET = withAuth(async (_req, { userId }) => {
  const quota = checkSubscriptionQuota(userId);

  if (!quota.subscription) {
    const plan = (quota as any).plan;
    const freeLimit = plan?.call_limit ?? 2;
    const used = freeLimit - quota.callsRemaining;
    return NextResponse.json({
      success: true,
      data: {
        callsUsed: used,
        callsLimit: freeLimit,
        callsRemaining: quota.callsRemaining,
        usagePercentage: Math.round((used / freeLimit) * 10000) / 100,
        plan,
      },
    });
  }

  const sub = quota.subscription as any;
  const limit = sub.call_limit;
  const used = sub.calls_used;
  return NextResponse.json({
    success: true,
    data: {
      callsUsed: used,
      callsLimit: limit,
      callsRemaining: quota.callsRemaining,
      usagePercentage: Math.round((used / limit) * 10000) / 100,
      currentPeriodEnd: new Date(sub.current_period_end),
    },
  });
});
