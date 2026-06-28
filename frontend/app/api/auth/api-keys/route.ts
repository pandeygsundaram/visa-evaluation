import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export const GET = withAuth(async (_req, { userId }) => {
  const db = getDb();
  const keys = db
    .prepare('SELECT name, key, created_at, last_used, is_active FROM api_keys WHERE user_id = ?')
    .all(userId) as any[];

  return NextResponse.json({
    success: true,
    data: {
      apiKeys: keys.map((k) => ({
        name: k.name,
        key: k.key,
        createdAt: new Date(k.created_at),
        lastUsed: k.last_used ? new Date(k.last_used) : null,
        isActive: k.is_active === 1,
      })),
    },
  });
});
