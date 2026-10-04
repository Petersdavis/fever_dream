import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'feverdream-3bafe',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBdVwV7GeXGWrHgTGYU9Nonjww4_w7GECM',
  authDomain: 'feverdream-3bafe.firebaseapp.com',
  storageBucket: 'feverdream-3bafe.firebasestorage.app',
  appId: '1:214591349114:web:27b66531f1a2af422176c3',
  messagingSenderId: '214591349114',
  measurementId: 'G-HXQD37BSN1',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

// In local dev with emulator enabled, connect to emulators
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch {
    // Already connected or hot-reloaded
  }
}
