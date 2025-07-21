
import {NextRequest, NextResponse} from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { User } from '@/types';
import { cookies } from 'next/headers';

// This endpoint creates a session cookie and returns user data.
export async function POST(request: NextRequest) {
  console.log("SESSION API: Received POST request.");
  const {idToken} = await request.json();

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    console.log("SESSION API: Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("SESSION API: ID token verified successfully for UID:", decodedToken.uid);
    
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log("SESSION API: Session cookie created.");

    const userDocRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        logger.error('User document not found for authenticated user.', { uid: decodedToken.uid });
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    // Update last login time
    await userDocRef.update({ lastLogin: new Date() });
    
    const user = userDoc.data() as User;
    console.log("SESSION API: Fetched user data from Firestore:", user.email);

    const response = NextResponse.json(user);

    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true, // Use secure cookies as the environment is HTTPS
      path: '/',
      sameSite: 'lax',
    });

    console.log("SESSION API: Sending response with session cookie and user data.");
    return response;

  } catch (error: any) {
    logger.error('Session cookie creation error:', { message: error.message, code: error.code });
    console.error("SESSION API: Error during session creation:", error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to create session.', error: error.message }, 
      { status: 500 }
    );
  }
}

// This endpoint clears the session cookie when a user logs out.
export async function DELETE() {
  console.log("SESSION API: Received DELETE request to clear session.");
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
