import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export function DELETE(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  return withAuth(async (_req, { userId }) => {
    const { key } = await params;
    const db = getDb();

    const existing = db
      .prepare('SELECT id FROM api_keys WHERE key = ? AND user_id = ?')
      .get(key, userId);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'API key not found' },
        { status: 404 }
      );
    }

    db.prepare('UPDATE api_keys SET is_active = 0 WHERE key = ? AND user_id = ?').run(
      key,
      userId
    );

    return NextResponse.json({ success: true, message: 'API key deactivated successfully' });
  })(req);
}
