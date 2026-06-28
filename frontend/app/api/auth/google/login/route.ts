import { NextResponse } from 'next/server';
import { getGoogleClient } from '@/lib/utils/googleOAuth';

export const runtime = 'nodejs';

export async function GET() {
  const client = getGoogleClient();
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google`;

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    redirect_uri: redirectUri,
  });

  return NextResponse.redirect(authUrl);
}
