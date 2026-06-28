import jwt, { SignOptions } from 'jsonwebtoken';
import { getDb } from './db';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as string;

export function signToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): { id: string; email: string } {
  return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
}

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export type AuthContext = { userId: string; email: string };
export type AuthHandler = (req: Request, ctx: AuthContext) => Promise<Response>;

/** JWT-protected route wrapper */
export function withAuth(handler: AuthHandler) {
  return async (req: Request): Promise<Response> => {
    const header = req.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) return unauthorized('No token provided');

    try {
      const payload = verifyToken(header.slice(7));
      const db = getDb();
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.id);
      if (!user) return unauthorized('User no longer exists');
      return handler(req, { userId: payload.id, email: payload.email });
    } catch {
      return unauthorized('Invalid or expired token');
    }
  };
}

/** Accepts JWT or x-api-key header */
export function withApiKeyOrAuth(handler: AuthHandler) {
  return async (req: Request): Promise<Response> => {
    const db = getDb();
    const apiKey = req.headers.get('x-api-key');

    if (apiKey) {
      const row = db
        .prepare('SELECT user_id FROM api_keys WHERE key = ? AND is_active = 1')
        .get(apiKey) as { user_id: string } | undefined;
      if (!row) return unauthorized('Invalid or inactive API key');

      db.prepare('UPDATE api_keys SET last_used = ? WHERE key = ?').run(Date.now(), apiKey);

      const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(row.user_id) as
        | { id: string; email: string }
        | undefined;
      if (!user) return unauthorized('User not found');

      return handler(req, { userId: user.id, email: user.email });
    }

    const header = req.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      return unauthorized('Provide Authorization header or x-api-key');
    }

    try {
      const payload = verifyToken(header.slice(7));
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.id);
      if (!user) return unauthorized('User no longer exists');
      return handler(req, { userId: payload.id, email: payload.email });
    } catch {
      return unauthorized('Invalid or expired token');
    }
  };
}
