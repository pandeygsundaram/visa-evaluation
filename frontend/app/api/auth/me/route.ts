import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export const GET = withAuth(async (_req, { userId }) => {
  const db = getDb();

  const user = db
    .prepare('SELECT id, name, email, stripe_customer_id, created_at, updated_at FROM users WHERE id = ?')
    .get(userId) as any;

  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  const apiKeys = db
    .prepare('SELECT name, key, created_at, last_used, is_active FROM api_keys WHERE user_id = ?')
    .all(userId) as any[];

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        apiKeys: apiKeys.map((k) => ({
          name: k.name,
          key: k.key,
          createdAt: new Date(k.created_at),
          lastUsed: k.last_used ? new Date(k.last_used) : null,
          isActive: k.is_active === 1,
        })),
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      },
    },
  });
});
