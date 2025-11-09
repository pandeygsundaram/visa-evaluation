import { OAuth2Client } from 'google-auth-library';

let googleClientInstance: OAuth2Client | null = null;

export const getGoogleOAuthClient = (): OAuth2Client => {
  if (!googleClientInstance) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials are not configured in environment variables');
    }

    googleClientInstance = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    console.log('✅ Google OAuth2Client initialized');
  }

  return googleClientInstance;
};