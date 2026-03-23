import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'ko'],
  defaultLocale: 'ko',
  localeDetection: true,
});

const protectedRoutes = ['/browse', '/me', '/requests', '/dashboard', '/leaderboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle auth session refresh
  const response = await updateSession(request);

  // Check protected routes
  const isProtected = protectedRoutes.some(route => pathname.includes(route));
  if (isProtected) {
    const sessionCookie = request.cookies.get('sb-access-token') ||
      request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`);

    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
