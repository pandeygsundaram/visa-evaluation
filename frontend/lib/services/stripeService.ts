import Stripe from 'stripe';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const STRIPE_CONFIG = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription/cancel`,
};

type UserRow = { id: string; email: string; name: string; stripe_customer_id: string | null };

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, stripe_customer_id FROM users WHERE id = ?').get(userId) as UserRow;
  if (!user) throw new Error('User not found');
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId } });
  db.prepare('UPDATE users SET stripe_customer_id = ?, updated_at = ? WHERE id = ?').run(customer.id, Date.now(), userId);
  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  planId: string,
  successUrl?: string,
  cancelUrl?: string
): Promise<Stripe.Checkout.Session> {
  const db = getDb();
  const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND is_active = 1').get(planId) as any;
  if (!plan || !plan.stripe_price_id) throw new Error('Invalid or inactive plan');

  const customerId = await getOrCreateStripeCustomer(userId);

  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: successUrl || STRIPE_CONFIG.successUrl,
    cancel_url: cancelUrl || STRIPE_CONFIG.cancelUrl,
    metadata: { userId, planId },
    subscription_data: { metadata: { userId, planId } },
  });
}

export async function createBillingPortalSession(userId: string, returnUrl?: string) {
  const db = getDb();
  const user = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(userId) as { stripe_customer_id: string | null };
  if (!user?.stripe_customer_id) throw new Error('User has no Stripe customer. Please subscribe first.');

  return stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription`,
  });
}

export async function cancelSubscription(userId: string) {
  const db = getDb();
  const sub = db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1")
    .get(userId) as any;
  if (!sub?.stripe_subscription_id) throw new Error('No active subscription found');

  await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
  db.prepare('UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = ? WHERE id = ?').run(Date.now(), sub.id);
}

export function getSubscriptionDetails(userId: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT s.*, p.name as plan_name, p.tier, p.call_limit, p.billing_period, p.price, p.features
       FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 1`
    )
    .get(userId) as any;
}

export function checkSubscriptionQuota(userId: string) {
  const db = getDb();
  const now = Date.now();

  const sub = db
    .prepare(
      `SELECT s.*, p.call_limit FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ? AND s.status = 'active' AND s.current_period_end >= ?
       ORDER BY s.created_at DESC LIMIT 1`
    )
    .get(userId, now) as any;

  if (sub) {
    const remaining = sub.call_limit - sub.calls_used;
    return { hasQuota: remaining > 0, subscription: sub, callsRemaining: Math.max(0, remaining) };
  }

  const freePlan = db.prepare("SELECT * FROM plans WHERE tier = 'free' AND is_active = 1 LIMIT 1").get() as any;
  const freeLimit = freePlan?.call_limit ?? 2;

  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const used = (db.prepare('SELECT COUNT(*) as cnt FROM evaluations WHERE user_id = ? AND created_at >= ?').get(userId, startOfMonth.getTime()) as any).cnt;

  return { hasQuota: used < freeLimit, subscription: null, plan: freePlan, callsRemaining: Math.max(0, freeLimit - used) };
}

// ── Webhook handlers ────────────────────────────────────────────────────────

export async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  const db = getDb();
  const userId = sub.metadata.userId;
  const planId = sub.metadata.planId;
  if (!userId || !planId) return;

  const existing = db.prepare('SELECT id FROM subscriptions WHERE stripe_subscription_id = ?').get(sub.id);
  if (existing) return;

  const s = sub as any;
  const periodStart = typeof s.current_period_start === 'number' ? s.current_period_start * 1000 : Date.now();
  const periodEnd = typeof s.current_period_end === 'number' ? s.current_period_end * 1000 : Date.now() + 30 * 86400000;

  const id = uuidv4();
  const now = Date.now();
  db.prepare(
    `INSERT INTO subscriptions (id, user_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end, cancel_at_period_end, calls_used, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`
  ).run(id, userId, planId, sub.customer as string, sub.id, sub.status, periodStart, periodEnd, now, now);
}

export async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = ?').get(sub.id) as any;
  if (!existing) return;

  const s = sub as any;
  const periodStart = (typeof s.current_period_start === 'number' ? s.current_period_start : 0) * 1000;
  const periodEnd = (typeof s.current_period_end === 'number' ? s.current_period_end : 0) * 1000;
  const periodRenewed = periodStart !== existing.current_period_start;

  let planId = existing.plan_id;
  const priceId = sub.items.data[0]?.price.id;
  if (priceId) {
    const plan = db.prepare('SELECT id FROM plans WHERE stripe_price_id = ?').get(priceId) as any;
    if (plan) planId = plan.id;
  }

  db.prepare(
    `UPDATE subscriptions SET plan_id = ?, status = ?, current_period_start = ?, current_period_end = ?,
     cancel_at_period_end = ?, canceled_at = ?, calls_used = ?, updated_at = ? WHERE id = ?`
  ).run(
    planId, sub.status, periodStart, periodEnd,
    sub.cancel_at_period_end ? 1 : 0,
    sub.canceled_at ? sub.canceled_at * 1000 : null,
    periodRenewed && sub.status === 'active' ? 0 : existing.calls_used,
    Date.now(), existing.id
  );
}

export async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const db = getDb();
  db.prepare('UPDATE subscriptions SET status = ?, canceled_at = ?, updated_at = ? WHERE stripe_subscription_id = ?')
    .run('canceled', Date.now(), Date.now(), sub.id);
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  if (!inv.subscription) return;
  const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription.id;
  if (inv.billing_reason === 'subscription_cycle') {
    getDb().prepare('UPDATE subscriptions SET calls_used = 0, updated_at = ? WHERE stripe_subscription_id = ?')
      .run(Date.now(), subId);
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  if (!inv.subscription) return;
  console.error(`Payment failed for subscription ${inv.subscription}, invoice ${invoice.id}`);
}
