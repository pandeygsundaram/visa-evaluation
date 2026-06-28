import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDb } from './helpers/db';
import { signToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

let testDb: ReturnType<typeof createTestDb>;

vi.mock('@/lib/db', () => ({ getDb: () => testDb }));

// Mock heavy external services
vi.mock('@/lib/utils/r2Storage', () => ({
  validateR2Config: () => true,
  uploadToR2: async (_buf: any, name: string) => ({ key: `visa-docs/test/${name}` }),
  generateSignedUrlsForDocuments: async (docs: any[]) =>
    docs.map((d) => ({ ...d, signedUrl: `https://r2.test/${d.r2Key}` })),
}));

vi.mock('@/lib/services/openaiService', () => ({
  validateOpenAIConfig: () => true,
  analyzeDocument: async () => ({
    isMalicious: false,
    score: 85,
    summary: 'Good application',
    checkpoints: [],
    suggestions: ['Improve cover letter'],
    strengths: ['Strong experience'],
    weaknesses: [],
    rawResponse: '{}',
  }),
}));

vi.mock('@/lib/utils/documentExtractor', () => ({
  isSupportedFileType: (type: string) => ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type),
  getFileExtension: () => 'pdf',
  extractDocumentText: async () => ({ text: 'Sample document text', metadata: { wordCount: 3 } }),
}));

const { GET: listEvals, POST: createEval } = await import('@/app/api/evaluations/route');
const { GET: getEval, DELETE: deleteEval } = await import('@/app/api/evaluations/[id]/route');

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function makeRequest(method: string, headers?: Record<string, string>, body?: BodyInit) {
  return new Request('http://localhost/api/evaluations', { method, headers, body });
}

function makeFormData(country = 'IE', visaType = 'CSEP') {
  const fd = new FormData();
  fd.append('country', country);
  fd.append('visaType', visaType);
  fd.append('files', new File(['%PDF-1.4 fake'], 'resume.pdf', { type: 'application/pdf' }));
  return fd;
}

let userId: string;
let token: string;

beforeEach(() => {
  testDb = createTestDb();
  userId = uuidv4();
  token = signToken(userId, 'eval@test.com');
  const now = Date.now();
  testDb.prepare(
    `INSERT INTO users (id, name, email, password, provider, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'credentials', ?, ?)`
  ).run(userId, 'Eval User', 'eval@test.com', bcrypt.hashSync('pass123', 10), now, now);
});

describe('GET /api/evaluations', () => {
  it('returns empty list for new user', async () => {
    const res = await listEvals(makeRequest('GET', authHeader(token)));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.evaluations).toHaveLength(0);
    expect(json.data.pagination.total).toBe(0);
  });

  it('returns 401 without token', async () => {
    const res = await listEvals(makeRequest('GET'));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/evaluations', () => {
  it('creates an evaluation successfully', async () => {
    const req = new Request('http://localhost/api/evaluations', {
      method: 'POST',
      headers: authHeader(token),
      body: makeFormData(),
    });
    const res = await createEval(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.evaluationId).toBeDefined();
    expect(json.data.status).toBe('completed');
    expect(json.data.result.score).toBe(85);
  });

  it('returns 400 without country/visaType', async () => {
    const fd = new FormData();
    fd.append('files', new File(['test'], 'f.pdf', { type: 'application/pdf' }));
    const res = await createEval(
      new Request('http://localhost', { method: 'POST', headers: authHeader(token), body: fd })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 without files', async () => {
    const fd = new FormData();
    fd.append('country', 'IE');
    fd.append('visaType', 'CSEP');
    const res = await createEval(
      new Request('http://localhost', { method: 'POST', headers: authHeader(token), body: fd })
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown visa type', async () => {
    const fd = new FormData();
    fd.append('country', 'IE');
    fd.append('visaType', 'UNKNOWN_VISA');
    fd.append('files', new File(['test'], 'f.pdf', { type: 'application/pdf' }));
    const res = await createEval(
      new Request('http://localhost', { method: 'POST', headers: authHeader(token), body: fd })
    );
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await createEval(
      new Request('http://localhost', { method: 'POST', body: makeFormData() })
    );
    expect(res.status).toBe(401);
  });
});

describe('GET /api/evaluations/[id]', () => {
  it('fetches an evaluation by id', async () => {
    const createReq = new Request('http://localhost/api/evaluations', {
      method: 'POST',
      headers: authHeader(token),
      body: makeFormData(),
    });
    const createRes = await createEval(createReq);
    const { data } = await createRes.json();
    const id = data.evaluationId;

    const res = await getEval(makeRequest('GET', authHeader(token)), { params: Promise.resolve({ id }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.id).toBe(id);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await getEval(
      makeRequest('GET', authHeader(token)),
      { params: Promise.resolve({ id: 'nonexistent' }) }
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/evaluations/[id]', () => {
  it('deletes an evaluation', async () => {
    const createRes = await createEval(
      new Request('http://localhost', { method: 'POST', headers: authHeader(token), body: makeFormData() })
    );
    const { data } = await createRes.json();
    const id = data.evaluationId;

    const res = await deleteEval(makeRequest('DELETE', authHeader(token)), { params: Promise.resolve({ id }) });
    expect(res.status).toBe(200);

    const getRes = await getEval(makeRequest('GET', authHeader(token)), { params: Promise.resolve({ id }) });
    expect(getRes.status).toBe(404);
  });
});
