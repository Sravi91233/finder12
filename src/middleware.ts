
import {NextRequest, NextResponse} from 'next/server';
import { logger } from '@/lib/logger';

const protectedRoutes = ['/influencer-finder', '/dashboard'];
const authRoutes = ['/login', '/signup'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.includes(path);
  
  const sessionCookie = req.cookies.get('session');
  logger.debug(`MIDDLEWARE: Path: ${path}, Has Session: ${!!sessionCookie?.value}`);
  
  // If trying to access a protected route without a session, redirect to login
  if (isProtectedRoute && !sessionCookie?.value) {
    const absoluteLoginUrl = new URL('/login', req.nextUrl.origin);
    logger.debug(`MIDDLEWARE: Access denied to ${path}. Redirecting to ${absoluteLoginUrl.toString()}`);
    return NextResponse.redirect(absoluteLoginUrl);
  }

  // If the user is logged in and tries to access an auth route, redirect them to the influencer finder
  if (isAuthRoute && sessionCookie?.value) {
    const absoluteFinderUrl = new URL('/influencer-finder', req.nextUrl.origin);
    logger.debug(`MIDDLEWARE: Logged in user on auth route. Redirecting to ${absoluteFinderUrl.toString()}`);
    return NextResponse.redirect(absoluteFinderUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
