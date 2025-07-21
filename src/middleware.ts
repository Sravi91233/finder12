
import {NextRequest, NextResponse} from 'next/server';

const protectedRoutes = ['/influencer-finder', '/dashboard'];
const publicRoutes = ['/login', '/signup', '/', '/pricing'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path) || path.startsWith('/api');

  const session = req.cookies.get('session');

  // If trying to access a protected route without a session, redirect to login
  if (isProtectedRoute && !session?.value) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  // If logged in and trying to access login/signup, redirect to the app
  if (session?.value && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/influencer-finder', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
