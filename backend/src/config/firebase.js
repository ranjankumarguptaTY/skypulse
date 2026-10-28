import admin from 'firebase-admin';

export const initFirebase = () => {
  if (process.env.FIREBASE_PROJECT_ID) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      console.log('Firebase Admin initialized');
    } catch (error) {
      console.warn('Firebase initialization failed:', error.message);
    }
  } else {
    console.warn('Firebase not configured — push notifications disabled');
  }
};

export default admin;
