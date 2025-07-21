
import {NextRequest, NextResponse} from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { User } from '@/types';
import { cookies } from 'next/headers';

// This endpoint creates a session cookie and returns user data.
export async function POST(request: NextRequest) {
  logger.debug("SESSION API (POST): Received request.");
  const {idToken} = await request.json();

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    logger.debug("SESSION API (POST): Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    logger.debug("SESSION API (POST): ID token verified successfully for UID:", {uid: decodedToken.uid});
    
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    logger.debug("SESSION API (POST): Session cookie created.");

    const userDocRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        logger.error('SESSION API (POST): User document not found for authenticated user.', { uid: decodedToken.uid });
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    // Update last login time
    await userDocRef.update({ lastLogin: new Date() });
    
    const user = userDoc.data() as User;
    logger.debug("SESSION API (POST): Fetched user data from Firestore:", {email: user.email});

    const response = NextResponse.json(user);

    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true, 
      path: '/',
      sameSite: 'lax',
    });

    logger.debug("SESSION API (POST): Sending response with session cookie and user data.");
    return response;

  } catch (error: any) {
    logger.error('SESSION API (POST): Session cookie creation error:', { message: error.message, code: error.code });
    return NextResponse.json(
      { status: 'error', message: 'Failed to create session.', error: error.message }, 
      { status: 500 }
    );
  }
}

// This endpoint verifies an existing session cookie and returns user data.
export async function GET() {
    logger.debug("SESSION API (GET): Received request.");
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        logger.warn('SESSION API (GET): Session verify request without cookie.');
        return NextResponse.json({ error: 'Session cookie not found' }, { status: 401 });
    }

    try {
        logger.debug('SESSION API (GET): Verifying session cookie...');
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        logger.debug("SESSION API (GET): Session cookie verified for UID:", {uid: decodedToken.uid});

        const userDocRef = adminDb.collection('users').doc(decodedToken.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            logger.error('SESSION API (GET): User document not found for authenticated user.', { uid: decodedToken.uid });
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }
        
        const user = userDoc.data() as User;
        return NextResponse.json(user);

    } catch (error: any) {
        logger.error('SESSION API (GET): Session verification failed', { message: error.message, code: error.code });
        // Clear the invalid cookie
        const response = NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
        response.cookies.set('session', '', { maxAge: 0 });
        return response;
    }
}


// This endpoint clears the session cookie when a user logs out.
export async function DELETE() {
  logger.debug("SESSION API (DELETE): Received request to clear session.");
  const response = NextResponse.json({status: 'success'});
  response.cookies.set('session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'lax',
  });
  return response;
}

