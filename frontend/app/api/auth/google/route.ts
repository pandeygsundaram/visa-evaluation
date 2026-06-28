import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getGoogleClient } from '@/lib/utils/googleOAuth';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export const runtime = 'nodejs';

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${FRONTEND_URL}/login?error=no_code`);
  }

  try {
    const client = getGoogleClient();
    const redirectUri = `${FRONTEND_URL}/api/auth/google`;

    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
    if (!tokens.id_token) {
      return NextResponse.redirect(`${FRONTEND_URL}/login?error=no_token`);
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return NextResponse.redirect(`${FRONTEND_URL}/login?error=invalid_token`);
    }

    const { sub: googleId, email, name } = payload;
    const db = getDb();
    const now = Date.now();

    let user = db
      .prepare('SELECT id, email FROM users WHERE email = ?')
      .get(email.toLowerCase()) as { id: string; email: string } | undefined;

    if (!user) {
      const id = uuidv4();
      db.prepare(
        `INSERT INTO users (id, name, email, provider, google_id, created_at, updated_at)
         VALUES (?, ?, ?, 'google', ?, ?, ?)`
      ).run(id, name || 'Google User', email.toLowerCase(), googleId, now, now);
      user = { id, email: email.toLowerCase() };
    } else {
      db.prepare(
        'UPDATE users SET google_id = ?, provider = ?, updated_at = ? WHERE id = ? AND google_id IS NULL'
      ).run(googleId, 'google', now, user.id);
    }

    const token = signToken(user.id, user.email);
    return NextResponse.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
}
