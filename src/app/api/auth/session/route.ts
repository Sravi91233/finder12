
import {NextRequest, NextResponse} from 'next/server';
import {adminAuth} from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const {idToken} = await request.json();

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });
    
    const response = NextResponse.json({status: 'success'});
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('Session cookie creation error:', error);
    return NextResponse.json({status: 'error', error}, {status: 401});
  }
}

export async function DELETE() {
  const response = NextResponse.json({status: 'success'});
  response.cookies.set('session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
  return response;
}
