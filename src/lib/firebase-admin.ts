"use server";

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { User } from '@/types';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  logger.debug("SESSION API (POST): Received request.");

  const { idToken } = await request.json();

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    logger.debug("SESSION API (POST): Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    logger.debug("SESSION API (POST): ID token verified for UID:", { uid: decodedToken.uid });

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    logger.debug("SESSION API (POST): Session cookie created.");

    const userDocRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      logger.error('SESSION API (POST): User doc not found.', { uid: decodedToken.uid });
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    await userDocRef.update({ lastLogin: new Date() });

    const user = userDoc.data() as User;

    const response = NextResponse.json(user);

    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // ⚠️ maxAge is in SECONDS, not ms!
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    logger.debug("SESSION API (POST): Sending response with session cookie.");
    return response;

  } catch (error: any) {
    logger.error('SESSION API (POST): Error:', { message: error.message, code: error.code });
    return NextResponse.json(
      { status: 'error', message: 'Failed to create session.', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  logger.debug("SESSION API (GET): Received request.");

  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    logger.warn('SESSION API (GET): No session cookie.');
    return NextResponse.json({ error: 'Session cookie not found' }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    logger.debug("SESSION API (GET): Session cookie verified for UID:", { uid: decodedToken.uid });

    const userDocRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      logger.error('SESSION API (GET): User doc not found.', { uid: decodedToken.uid });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userDoc.data() as User;
    return NextResponse.json(user);

  } catch (error: any) {
    logger.error('SESSION API (GET): Session invalid.', { message: error.message, code: error.code });
    const response = NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    response.cookies.set('session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    return response;
  }
}

export async function DELETE() {
  logger.debug("SESSION API (DELETE): Clearing session.");
  const response = NextResponse.json({ status: 'success' });
  response.cookies.set('session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
  return response;
}
