
import {NextRequest, NextResponse} from 'next/server';

const protectedRoutes = ['/influencer-finder', '/dashboard'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  const sessionCookie = req.cookies.get('session');

  console.log(`MIDDLEWARE: Path: ${path}, Has Session: ${!!sessionCookie?.value}`);
  
  // If trying to access a protected route without a session, redirect to login
  if (isProtectedRoute && !sessionCookie?.value) {
    const absoluteLoginUrl = new URL('/login', req.nextUrl.origin);
    console.log(`MIDDLEWARE: Access denied to ${path}. Redirecting to ${absoluteLoginUrl.toString()}`);
    return NextResponse.redirect(absoluteLoginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
