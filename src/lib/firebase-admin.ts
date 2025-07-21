
import admin from 'firebase-admin';
import type { User } from '@/types';
import { cookies } from 'next/headers';
import { config } from 'dotenv';

config();

// This is the correct way to initialize the Firebase Admin SDK.
// It ensures that it's only initialized once and that the private key
// is parsed correctly.
if (!admin.apps.length) {
  try {
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error("Missing Firebase Admin credentials. Please check your .env file.");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();


/**
 * Gets the authenticated user from the session cookie.
 * This function is for use in server-side code (Server Actions, API Routes).
 * It verifies the session cookie with Firebase Admin and fetches user data from Firestore.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
    const sessionCookieValue = cookies().get('session')?.value;
    if (!sessionCookieValue) {
        return null;
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookieValue, true);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists) {
            return null;
        }

        return userDoc.data() as User;
    } catch (error) {
        // This is expected if the cookie is invalid or expired.
        return null;
    }
}
