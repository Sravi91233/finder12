
import {NextRequest, NextResponse} from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { User } from '@/types';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const sessionCookieValue = cookies().get('session')?.value;
  
  if (!sessionCookieValue) {
    logger.warn('User data requested without session cookie.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookieValue, true);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      logger.error('User document not found for authenticated user.', { uid: decodedToken.uid });
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const user = userDoc.data() as User;
    return NextResponse.json(user);

  } catch (error) {
    logger.error('Error fetching user data by session cookie', { error });
    // This could happen if the cookie is expired or invalid
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
