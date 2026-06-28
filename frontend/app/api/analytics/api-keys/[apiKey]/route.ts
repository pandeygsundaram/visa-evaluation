import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export function GET(req: Request, { params }: { params: Promise<{ apiKey: string }> }) {
  return withAuth(async (_req, { userId }) => {
    const { apiKey } = await params;
    const db = getDb();

    const key = db
      .prepare('SELECT * FROM api_keys WHERE key = ? AND user_id = ?')
      .get(apiKey, userId) as any;

    if (!key) {
      return NextResponse.json(
        { success: false, message: 'API key not found or does not belong to you' },
        { status: 403 }
      );
    }

    const evalCount = (
      db.prepare('SELECT COUNT(*) as cnt FROM evaluations WHERE user_id = ?').get(userId) as any
    ).cnt;

    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          key: key.key,
          name: key.name,
          createdAt: new Date(key.created_at),
          lastUsed: key.last_used ? new Date(key.last_used) : null,
        },
        usage: {
          totalCalls: evalCount,
          successfulCalls: evalCount,
          failedCalls: 0,
        },
      },
    });
  })(req);
}
