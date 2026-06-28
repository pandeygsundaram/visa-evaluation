import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { cancelSubscription } from '@/lib/services/stripeService';

export const runtime = 'nodejs';

export const POST = withAuth(async (_req, { userId }) => {
  await cancelSubscription(userId);
  return NextResponse.json({
    success: true,
    message: 'Subscription will be cancelled at the end of the billing period',
  });
});
