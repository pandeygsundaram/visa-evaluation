import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { success: false, message: 'API key name is required' },
      { status: 400 }
    );
  }

  const db = getDb();
  const id = uuidv4();
  const apiKey = `vsk_${uuidv4().replace(/-/g, '')}`;
  const now = Date.now();

  db.prepare(
    'INSERT INTO api_keys (id, user_id, key, name, created_at, is_active) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(id, userId, apiKey, name.trim(), now);

  return NextResponse.json(
    {
      success: true,
      message: 'API key generated successfully',
      data: {
        apiKey: {
          name: name.trim(),
          key: apiKey,
          createdAt: new Date(now),
          isActive: true,
        },
      },
    },
    { status: 201 }
  );
});
