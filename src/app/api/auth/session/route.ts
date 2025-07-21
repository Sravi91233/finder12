
import {NextRequest, NextResponse} from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import type { User } from '@/types';

// This endpoint creates a session cookie and returns user data.
export async function POST(request: NextRequest) {
  const {idToken} = await request.json();

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });
    
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
        logger.error('User document not found for authenticated user.', { uid: decodedToken.uid });
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    const user = userDoc.data() as User;

    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json(user);

  } catch (error: any) {
    logger.error('Session cookie creation error:', { message: error.message, code: error.code });
    return NextResponse.json(
      { status: 'error', message: 'Failed to create session.', error: error.message }, 
      { status: 500 }
    );
  }
}

// This endpoint clears the session cookie when a user logs out.
export async function DELETE() {
  cookies().set('session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
  return NextResponse.json({status: 'success'});
}
