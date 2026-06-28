import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export const GET = withAuth(async (_req, { userId }) => {
  const db = getDb();
  const now = Date.now();

  const sub = db
    .prepare(
      `SELECT s.*, p.call_limit, p.name as plan_name, p.tier, p.billing_period
       FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ? AND s.status = 'active' AND s.current_period_end >= ?
       ORDER BY s.created_at DESC LIMIT 1`
    )
    .get(userId, now) as any;

  if (sub) {
    const limit = sub.call_limit;
    const used = sub.calls_used;
    return NextResponse.json({
      success: true,
      data: {
        plan: { name: sub.plan_name, tier: sub.tier, billingPeriod: sub.billing_period },
        quota: {
          limit,
          used,
          remaining: limit - used,
          percentage: parseFloat(((used / limit) * 100).toFixed(1)),
        },
        billingPeriod: {
          start: new Date(sub.current_period_start),
          end: new Date(sub.current_period_end),
          daysRemaining: Math.ceil((sub.current_period_end - now) / 86400000),
        },
        status: sub.status,
      },
    });
  }

  // Free plan
  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  const freePlan = db.prepare("SELECT * FROM plans WHERE tier = 'free' AND is_active = 1 LIMIT 1").get() as any;
  const freeLimit = freePlan?.call_limit ?? 2;
  const used = (db.prepare('SELECT COUNT(*) as cnt FROM evaluations WHERE user_id = ? AND created_at >= ?').get(userId, startOfMonth.getTime()) as any).cnt;

  return NextResponse.json({
    success: true,
    data: {
      plan: { name: 'Free', tier: 'free', billingPeriod: 'monthly' },
      quota: {
        limit: freeLimit,
        used,
        remaining: Math.max(0, freeLimit - used),
        percentage: parseFloat(((used / freeLimit) * 100).toFixed(1)),
      },
      billingPeriod: {
        start: startOfMonth,
        end: endOfMonth,
        daysRemaining: Math.ceil((endOfMonth.getTime() - now) / 86400000),
      },
      status: 'free',
    },
  });
});
