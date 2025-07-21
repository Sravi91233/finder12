
import {NextRequest, NextResponse} from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// This endpoint creates a session cookie when a user logs in.
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

  } catch (error: any) {
    logger.error('Session cookie creation error:', { message: error.message, code: error.code });
    return NextResponse.json(
      { status: 'error', message: 'Failed to create session cookie.', error: error.message }, 
      { status: 500 }
    );
  }
}

// This endpoint clears the session cookie when a user logs out.
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
