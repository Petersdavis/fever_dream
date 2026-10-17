// Firebase Cloud Messaging (FCM) Web Push helpers.
//
// This module is imported ONLY by the authenticated Admin view. It registers
// the background service worker, obtains an FCM registration token for this
// device, and persists it to the `adminTokens` Firestore collection so the
// `onSiteMessageCreated` Cloud Function can push to every admin device — even
// when no tab is open and the device was asleep.
//
// Every entry point is a no-op during SSR / prerender (no `window`) and when
// the required VAPID key is not configured, so public pages and unconfigured
// builds are unaffected.

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
const SERVICE_WORKER_PATH = '/firebase-messaging-sw.js';
const ADMIN_TOKENS_COLLECTION = 'adminTokens';

/**
 * Whether FCM Web Push can run in this browser/context.
 * Returns false during SSR and on browsers without service-worker/messaging
 * support (e.g. older Safari, insecure origins).
 */
export async function isPushSupported() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

/**
 * Whether a VAPID key is configured. Without it, getToken() cannot run.
 */
export function isPushConfigured() {
  return Boolean(VAPID_KEY);
}

/**
 * Register the FCM background service worker at the site root.
 * Idempotent — the browser de-duplicates registrations by scope.
 */
async function registerServiceWorker() {
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
    scope: '/',
  });
  return registration;
}

/**
 * Request an FCM token for this device and persist it to Firestore so the
 * backend can push to it. MUST only be called after the admin auth gate passes.
 *
 * @param {string} adminEmail - the authenticated admin's email (for auditing).
 * @returns {Promise<{ token: string|null, error: string|null }>}
 */
export async function registerPushToken(adminEmail) {
  if (!isPushConfigured()) {
    return { token: null, error: 'Push is not configured (missing VITE_FIREBASE_VAPID_KEY).' };
  }
  if (!(await isPushSupported())) {
    return { token: null, error: 'Push notifications are not supported in this browser.' };
  }

  try {
    const registration = await registerServiceWorker();
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { token: null, error: 'No push token was returned. Check notification permission.' };
    }

    // Store the token keyed by the token itself so re-registration is idempotent
    // and the same device never creates duplicates.
    await setDoc(
      doc(db, ADMIN_TOKENS_COLLECTION, token),
      {
        token,
        email: adminEmail || null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return { token, error: null };
  } catch (err) {
    return { token: null, error: err?.message || 'Failed to register for push notifications.' };
  }
}

/**
 * Subscribe to foreground FCM messages (tab is open). Returns an unsubscribe
 * function, or null when unsupported. Background messages are handled by the
 * service worker instead.
 *
 * @param {(payload: object) => void} handler
 */
export async function onForegroundMessage(handler) {
  if (!(await isPushSupported())) return null;
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, handler);
  } catch {
    return null;
  }
}
