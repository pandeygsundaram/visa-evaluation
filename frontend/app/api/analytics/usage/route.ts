import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const db = getDb();
  let query = 'SELECT * FROM evaluations WHERE user_id = ?';
  const args: any[] = [userId];

  if (startDate) { query += ' AND created_at >= ?'; args.push(new Date(startDate).getTime()); }
  if (endDate) { query += ' AND created_at <= ?'; args.push(new Date(endDate).getTime()); }

  const evaluations = db.prepare(`${query} ORDER BY created_at DESC LIMIT 1000`).all(...args) as any[];

  const totalCalls = evaluations.length;
  const successfulCalls = evaluations.filter((e) => e.status === 'completed').length;
  const failedCalls = totalCalls - successfulCalls;

  const callsByDate: Record<string, number> = {};
  evaluations.forEach((e) => {
    const date = new Date(e.created_at).toISOString().split('T')[0];
    callsByDate[date] = (callsByDate[date] || 0) + 1;
  });

  const callsByStatus: Record<number, number> = { 200: successfulCalls, 500: failedCalls };

  const recentCalls = evaluations.slice(0, 50).map((e) => ({
    timestamp: new Date(e.created_at),
    endpoint: '/api/evaluations',
    method: 'POST',
    statusCode: e.status === 'completed' ? 200 : e.status === 'failed' ? 500 : 202,
    success: e.status === 'completed',
  }));

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: totalCalls > 0 ? `${((successfulCalls / totalCalls) * 100).toFixed(2)}%` : '0%',
        averageResponseTime: 'N/A',
      },
      charts: {
        callsByDate,
        callsByEndpoint: { Evaluations: totalCalls },
        callsByStatus,
      },
      recentCalls,
    },
  });
});
