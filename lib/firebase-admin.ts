import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const firebaseAdminConfig = {
  projectId: "neurokhet-353c1",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize Firebase Admin SDK
function createFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  try {
    return initializeApp({
      credential: cert(firebaseAdminConfig),
      projectId: firebaseAdminConfig.projectId,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    
    // Fallback for development - use project ID only
    return initializeApp({
      projectId: firebaseAdminConfig.projectId,
    });
  }
}

const adminApp = createFirebaseAdminApp();
export const adminDB = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);

export default adminApp;
