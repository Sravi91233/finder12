import admin from 'firebase-admin';

export const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin SDK credentials.');
  }

  if (!privateKey.includes('\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log('✅ Firebase Admin initialized');
  return admin;
};

export const adminAuth = getFirebaseAdmin().auth();
export const adminDb = getFirebaseAdmin().firestore();
