import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';

const protectedRoutes = ['/influencer-finder', '/dashboard'];
const authRoutes = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.includes(path);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (isProtectedRoute && !sessionCookie?.value) {
    const absoluteLoginUrl = new URL('/login', req.nextUrl.origin);
    return NextResponse.redirect(absoluteLoginUrl);
  }

  if (isAuthRoute && sessionCookie?.value) {
    const absoluteFinderUrl = new URL('/influencer-finder', req.nextUrl.origin);
    return NextResponse.redirect(absoluteFinderUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
