import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'doctors-directory-web',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace newline characters which might get escaped in env vars
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = admin.firestore();
export const adminMessaging = admin.messaging();
