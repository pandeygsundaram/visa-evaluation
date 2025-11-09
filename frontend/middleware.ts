import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define protected paths
  const isProtectedPath = path.startsWith('/dashboard');
  const isAuthPath = path.startsWith('/login') || path.startsWith('/signup');

  // Get token from cookie or check localStorage (we'll use cookie for SSR)
  const token = request.cookies.get('auth_token')?.value;

  // Redirect to login if accessing protected route without token
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
