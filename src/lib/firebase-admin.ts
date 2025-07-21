
import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

function parsePrivateKey(key: string | undefined): string {
  if (!key) {
    return '';
  }
  // Vercel escapes the newlines, so we try to parse it as a JSON string
  // which will un-escape the newlines. If it's not a JSON string,
  // we'll just use the raw key.
  try {
    return JSON.parse(`"${key}"`);
  } catch (e) {
    return key;
  }
}

// This is the correct way to initialize the Firebase Admin SDK.
// It ensures that it's only initialized once and that the private key
// is parsed correctly.
if (!admin.apps.length) {
  try {
    const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        throw new Error("Missing Firebase credential: NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error("Missing Firebase credential: FIREBASE_CLIENT_EMAIL");
    }
    if (!privateKey) {
        throw new Error("Missing Firebase credential: FIREBASE_PRIVATE_KEY");
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
