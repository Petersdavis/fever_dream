import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'feverdream-3bafe',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'feverdream-3bafe'}.firebaseapp.com`,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'feverdream-3bafe'}.firebasestorage.app`,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// In local dev with emulator enabled, connect to localhost:8080
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch {
    // Already connected or hot-reloaded
  }
}
