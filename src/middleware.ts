
import {NextRequest, NextResponse} from 'next/server';

const protectedRoutes = ['/influencer-finder', '/dashboard'];
const publicRoutes = ['/login', '/signup', '/', '/pricing'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  const sessionCookie = req.cookies.get('session');

  console.log(`MIDDLEWARE: Path: ${path}, Has Session: ${!!sessionCookie?.value}`);
  
  // If trying to access a protected route without a session, redirect to login
  if (isProtectedRoute && !sessionCookie?.value) {
    console.log(`MIDDLEWARE: Access denied to ${path}. Redirecting to /login.`);
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  // If logged in and trying to access login/signup, redirect to the app's main page
  if (sessionCookie?.value && (path === '/login' || path === '/signup')) {
    console.log(`MIDDLEWARE: Already logged in. Redirecting from ${path} to /influencer-finder.`);
    return NextResponse.redirect(new URL('/influencer-finder', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
