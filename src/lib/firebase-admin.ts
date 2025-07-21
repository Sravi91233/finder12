
import admin from 'firebase-admin';

// This function ensures the Firebase Admin SDK is initialized only once.
const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key must have newlines correctly formatted.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Missing Firebase Admin SDK credentials. Check your environment variables.');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    // Throw the error to prevent the app from continuing with a misconfigured SDK.
    throw new Error(`Firebase admin initialization error: ${error.message}`);
  }

  return admin;
};

// Export instances from the initialized admin app.
// The SDK will be initialized on the first call to any of these.
export const adminAuth = getFirebaseAdmin().auth();
export const adminDb = getFirebaseAdmin().firestore();
