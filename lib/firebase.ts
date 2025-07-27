import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "GEMINI_API_KEY",
  authDomain: "neurokhet-353c1.firebaseapp.com",
  projectId: "neurokhet-353c1",
  storageBucket: "neurokhet-353c1.firebasestorage.app",
  messagingSenderId: "540244406758",
  appId: "1:540244406758:web:e041b9228424e0f3a56627",
  measurementId: "G-ZVSJXQZQS6"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback initialization
  app = initializeApp(firebaseConfig, 'neurokhet-app');
}

// Initialize Firebase services with error handling
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set auth persistence to maintain login state across browser sessions
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
  });
}

// Set auth language
auth.languageCode = 'en';

// Only connect to emulators in development and if not already connected
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Check if already connected to avoid multiple connection attempts
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch {
      // Firestore emulator already connected
    }
    if (!((storage as { _host?: string })._host?.includes('localhost'))) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  } catch (error) {
    // Emulators already connected or not available
    console.log('Firebase emulators connection skipped:', error);
  }
}

export default app;
