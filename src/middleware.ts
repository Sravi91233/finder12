
import {NextRequest, NextResponse} from 'next/server';
import type {User} from '@/types';

// Theses are the protected routes
const protectedRoutes = ['/influencer-finder', '/dashboard'];

// These are the public routes
const publicRoutes = ['/login', '/signup', '/', '/pricing'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route =>
    path.startsWith(route)
  );

  // Get the session cookie
  const session = req.cookies.get('session');

  // If the user is trying to access a protected route without a session,
  // redirect them to the login page.
  if (isProtectedRoute && !session?.value) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
}

// We only want the middleware to run on the protected routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
