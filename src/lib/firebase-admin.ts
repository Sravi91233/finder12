
import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

// This is the correct way to initialize the Firebase Admin SDK.
// It ensures that it's only initialized once and that the private key
// is parsed correctly.
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error("Missing Firebase Admin credentials. Please check your .env file or Vercel environment variables.");
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
