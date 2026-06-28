import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createTestDb } from './helpers/db';
import { signToken } from '@/lib/auth';

let testDb: ReturnType<typeof createTestDb>;

vi.mock('@/lib/db', () => ({
  getDb: () => testDb,
}));

const { GET: getMe } = await import('@/app/api/auth/me/route');
const { POST: generateApiKey } = await import('@/app/api/auth/generate-api-key/route');
const { GET: getApiKeys } = await import('@/app/api/auth/api-keys/route');
const { DELETE: deleteApiKey } = await import('@/app/api/auth/api-keys/[key]/route');

function makeRequest(method: string, headers?: Record<string, string>, body?: object) {
  return new Request('http://localhost/api/auth', {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

let userId: string;
let token: string;

beforeEach(() => {
  testDb = createTestDb();
  userId = uuidv4();
  token = signToken(userId, 'user@test.com');
  const now = Date.now();
  testDb.prepare(
    `INSERT INTO users (id, name, email, provider, google_id, created_at, updated_at)
     VALUES (?, ?, ?, 'google', ?, ?, ?)`
  ).run(userId, 'Test User', 'user@test.com', 'google_sub_123', now, now);
});

// ── ME ─────────────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const res = await getMe(makeRequest('GET', authHeader(token)));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.user.email).toBe('user@test.com');
  });

  it('returns 401 without token', async () => {
    const res = await getMe(makeRequest('GET'));
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await getMe(makeRequest('GET', { Authorization: 'Bearer bad.token' }));
    expect(res.status).toBe(401);
  });
});

// ── API KEYS ───────────────────────────────────────────────────────────────
describe('API key endpoints', () => {
  it('generates an API key', async () => {
    const res = await generateApiKey(makeRequest('POST', authHeader(token), { name: 'My Key' }));
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.apiKey.key).toMatch(/^vsk_/);
    expect(json.data.apiKey.name).toBe('My Key');
  });

  it('returns 400 when name is missing', async () => {
    const res = await generateApiKey(makeRequest('POST', authHeader(token), {}));
    expect(res.status).toBe(400);
  });

  it('lists API keys', async () => {
    await generateApiKey(makeRequest('POST', authHeader(token), { name: 'Key 1' }));
    await generateApiKey(makeRequest('POST', authHeader(token), { name: 'Key 2' }));

    const res = await getApiKeys(makeRequest('GET', authHeader(token)));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.apiKeys).toHaveLength(2);
  });

  it('deactivates an API key', async () => {
    const genRes = await generateApiKey(makeRequest('POST', authHeader(token), { name: 'To Delete' }));
    const { data } = await genRes.json();
    const key = data.apiKey.key;

    const res = await deleteApiKey(
      makeRequest('DELETE', authHeader(token)),
      { params: Promise.resolve({ key }) }
    );
    expect(res.status).toBe(200);

    const listRes = await getApiKeys(makeRequest('GET', authHeader(token)));
    const listJson = await listRes.json();
    const found = listJson.data.apiKeys.find((k: any) => k.key === key);
    expect(found?.isActive).toBe(false);
  });

  it('returns 404 when deleting a non-existent key', async () => {
    const res = await deleteApiKey(
      makeRequest('DELETE', authHeader(token)),
      { params: Promise.resolve({ key: 'vsk_nonexistent' }) }
    );
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await getApiKeys(makeRequest('GET'));
    expect(res.status).toBe(401);
  });
});

// ── Google OAuth routes exist and redirect ─────────────────────────────────
describe('GET /api/auth/google/login', () => {
  it('redirects to Google OAuth URL', async () => {
    const { GET: googleLogin } = await import('@/app/api/auth/google/login/route');
    const res = await googleLogin();
    expect([301, 302, 307, 308]).toContain(res.status);
    expect(res.headers.get('location')).toContain('accounts.google.com');
  });
});
