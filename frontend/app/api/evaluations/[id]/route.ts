import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { generateSignedUrlsForDocuments } from '@/lib/utils/r2Storage';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export function GET(req: Request, ctx: Ctx) {
  return withAuth(async (_req, { userId }) => {
    const { id } = await ctx.params;
    const db = getDb();

    const row = db
      .prepare('SELECT * FROM evaluations WHERE id = ? AND user_id = ?')
      .get(id, userId) as any;

    if (!row) {
      return NextResponse.json({ success: false, message: 'Evaluation not found' }, { status: 404 });
    }

    const documents = JSON.parse(row.documents || '[]');
    const documentsWithUrls = await generateSignedUrlsForDocuments(documents, 3600);

    return NextResponse.json({
      success: true,
      data: {
        ...row,
        documents: documentsWithUrls,
        evaluationResult: row.evaluation_result ? JSON.parse(row.evaluation_result) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        processedAt: row.processed_at ? new Date(row.processed_at) : null,
      },
    });
  })(req);
}

export function DELETE(req: Request, ctx: Ctx) {
  return withAuth(async (_req, { userId }) => {
    const { id } = await ctx.params;
    const db = getDb();

    const row = db
      .prepare('SELECT id FROM evaluations WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!row) {
      return NextResponse.json({ success: false, message: 'Evaluation not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM evaluations WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'Evaluation deleted successfully' });
  })(req);
}
