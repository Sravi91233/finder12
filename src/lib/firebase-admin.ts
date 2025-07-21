
import admin from 'firebase-admin';

// This function ensures the Firebase Admin SDK is initialized only once.
const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  // Ensure all required environment variables are present.
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin SDK credentials. Check your environment variables.');
  }

  // Handle the private key formatting for different environments.
  // Vercel and other modern hosting platforms handle multi-line env vars correctly,
  // so the key might already contain newlines. Local .env files often escape them.
  if (!privateKey.includes('\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    throw new Error(`Firebase admin initialization error: ${error.message}`);
  }

  return admin;
};

// Export instances that will be initialized on their first use.
export const adminAuth = getFirebaseAdmin().auth();
export const adminDb = getFirebaseAdmin().firestore();
