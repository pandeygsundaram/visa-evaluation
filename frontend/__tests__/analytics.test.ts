import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDb } from './helpers/db';
import { signToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

let testDb: ReturnType<typeof createTestDb>;
vi.mock('@/lib/db', () => ({ getDb: () => testDb }));

const { GET: getUsage } = await import('@/app/api/analytics/usage/route');
const { GET: getSummary } = await import('@/app/api/analytics/summary/route');

let userId: string;
let token: string;

beforeEach(() => {
  testDb = createTestDb();
  userId = uuidv4();
  token = signToken(userId, 'analytics@test.com');
  const now = Date.now();
  testDb.prepare(
    `INSERT INTO users (id, name, email, password, provider, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'credentials', ?, ?)`
  ).run(userId, 'Analytics User', 'analytics@test.com', bcrypt.hashSync('pass', 10), now, now);

  testDb.prepare(
    `INSERT INTO plans (id, name, tier, price, billing_period, call_limit, features, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(uuidv4(), 'Free', 'free', 0, 'monthly', 2, '[]', now, now);
});

function auth() {
  return { Authorization: `Bearer ${token}` };
}

function seedEval(status = 'completed') {
  const now = Date.now();
  testDb.prepare(
    `INSERT INTO evaluations (id, user_id, country, visa_type, status, documents, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '[]', ?, ?)`
  ).run(uuidv4(), userId, 'IE', 'CSEP', status, now, now);
}

describe('GET /api/analytics/usage', () => {
  it('returns empty summary for new user', async () => {
    const res = await getUsage(new Request('http://localhost', { headers: auth() }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.summary.totalCalls).toBe(0);
    expect(json.data.summary.successRate).toBe('0%');
  });

  it('counts evaluations correctly', async () => {
    seedEval('completed');
    seedEval('completed');
    seedEval('failed');

    const res = await getUsage(new Request('http://localhost', { headers: auth() }));
    const json = await res.json();
    expect(json.data.summary.totalCalls).toBe(3);
    expect(json.data.summary.successfulCalls).toBe(2);
    expect(json.data.summary.failedCalls).toBe(1);
  });

  it('returns 401 without token', async () => {
    const res = await getUsage(new Request('http://localhost'));
    expect(res.status).toBe(401);
  });

  it('filters by date range', async () => {
    seedEval();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const res = await getUsage(
      new Request(`http://localhost?endDate=${new Date(Date.now() - 86400000).toISOString()}`, { headers: auth() })
    );
    const json = await res.json();
    expect(json.data.summary.totalCalls).toBe(0);
  });
});

describe('GET /api/analytics/summary', () => {
  it('returns free plan summary for new user', async () => {
    const res = await getSummary(new Request('http://localhost', { headers: auth() }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.plan.tier).toBe('free');
    expect(json.data.quota.limit).toBe(2);
  });

  it('returns 401 without token', async () => {
    const res = await getSummary(new Request('http://localhost'));
    expect(res.status).toBe(401);
  });
});
