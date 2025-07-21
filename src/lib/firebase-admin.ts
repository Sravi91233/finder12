import admin from 'firebase-admin';
import type { User } from '@/types';
import { cookies } from 'next/headers';
import { config } from 'dotenv';

config();

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();


/**
 * Verifies the session cookie and returns the user's data from Firestore.
 * This is a server-side utility.
 * @returns {Promise<User | null>} The user object or null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
    const sessionCookieValue = cookies().get('session')?.value;
    if (!sessionCookieValue) {
        return null;
    }

    try {
        const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookieValue, true);
        const userDoc = await adminDb.collection('users').doc(decodedIdToken.uid).get();

        if (!userDoc.exists) {
            return null;
        }

        return userDoc.data() as User;
    } catch (error) {
        // Session cookie is invalid or expired.
        console.error("Error verifying session cookie", error);
        return null;
    }
}
