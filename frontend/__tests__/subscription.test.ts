import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDb } from './helpers/db';
import { signToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

let testDb: ReturnType<typeof createTestDb>;
vi.mock('@/lib/db', () => ({ getDb: () => testDb }));
vi.mock('@/lib/services/stripeService', () => ({
  stripe: {},
  createCheckoutSession: vi.fn(async () => ({ id: 'cs_test_123', url: 'https://checkout.stripe.com/test' })),
  createBillingPortalSession: vi.fn(async () => ({ url: 'https://billing.stripe.com/test' })),
  cancelSubscription: vi.fn(async () => {}),
  getSubscriptionDetails: vi.fn(() => null),
  checkSubscriptionQuota: vi.fn(() => ({ hasQuota: true, subscription: null, callsRemaining: 2 })),
}));

const { GET: getPlans } = await import('@/app/api/subscription/plans/route');
const { POST: createCheckout } = await import('@/app/api/subscription/checkout/route');
const { GET: getStatus } = await import('@/app/api/subscription/status/route');
const { GET: getUsage } = await import('@/app/api/subscription/usage/route');

let userId: string;
let token: string;
let planId: string;

beforeEach(() => {
  testDb = createTestDb();
  userId = uuidv4();
  token = signToken(userId, 'sub@test.com');
  planId = uuidv4();
  const now = Date.now();

  testDb.prepare(
    `INSERT INTO users (id, name, email, password, provider, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'credentials', ?, ?)`
  ).run(userId, 'Sub User', 'sub@test.com', bcrypt.hashSync('pass', 10), now, now);

  testDb.prepare(
    `INSERT INTO plans (id, name, tier, price, billing_period, call_limit, features, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(uuidv4(), 'Free', 'free', 0, 'monthly', 2, '[]', now, now);

  testDb.prepare(
    `INSERT INTO plans (id, name, tier, price, billing_period, call_limit, features, stripe_price_id, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(planId, 'Pro', 'pro', 2900, 'monthly', 50, '["Feature 1"]', 'price_test_123', now, now);
});

function auth() {
  return { Authorization: `Bearer ${token}` };
}

describe('GET /api/subscription/plans', () => {
  it('lists all active plans', async () => {
    const res = await getPlans();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.length).toBeGreaterThanOrEqual(2);
  });

  it('returns features as array', async () => {
    const res = await getPlans();
    const json = await res.json();
    for (const p of json.data) {
      expect(Array.isArray(p.features)).toBe(true);
    }
  });
});

describe('POST /api/subscription/checkout', () => {
  it('creates a checkout session for a paid plan', async () => {
    const res = await createCheckout(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ planId }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.url).toContain('stripe.com');
  });

  it('returns 400 when planId is missing', async () => {
    const res = await createCheckout(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for free plan checkout', async () => {
    const freePlan = testDb.prepare("SELECT id FROM plans WHERE tier = 'free'").get() as any;
    const res = await createCheckout(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ planId: freePlan.id }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await createCheckout(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
    );
    expect(res.status).toBe(401);
  });
});

describe('GET /api/subscription/status', () => {
  it('returns free plan status when no subscription', async () => {
    const res = await getStatus(new Request('http://localhost', { headers: auth() }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.onFreePlan).toBe(true);
    expect(json.data.subscription).toBeNull();
  });

  it('returns 401 without token', async () => {
    const res = await getStatus(new Request('http://localhost'));
    expect(res.status).toBe(401);
  });
});

describe('GET /api/subscription/usage', () => {
  it('returns usage data', async () => {
    const res = await getUsage(new Request('http://localhost', { headers: auth() }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data).toHaveProperty('callsUsed');
    expect(json.data).toHaveProperty('callsLimit');
    expect(json.data).toHaveProperty('callsRemaining');
  });
});
