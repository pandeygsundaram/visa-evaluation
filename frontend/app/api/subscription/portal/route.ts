import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { createBillingPortalSession } from '@/lib/services/stripeService';

export const runtime = 'nodejs';

export const POST = withAuth(async (req, { userId }) => {
  const { returnUrl } = await req.json().catch(() => ({}));
  const session = await createBillingPortalSession(userId, returnUrl);
  return NextResponse.json({ success: true, data: { url: session.url } });
});
