/* eslint-disable no-undef */
// Firebase Cloud Messaging background service worker.
//
// This file MUST live at the site root (public/firebase-messaging-sw.js) so the
// browser can register it at scope "/". It runs in the background — with no tab
// open and even when the device was asleep — and is what actually displays push
// notifications delivered by FCM.
//
// It uses the Firebase compat SDK because service workers cannot use bare ES
// module imports without a bundler. The config is duplicated here (it is public
// data, identical to src/lib/firebase.js) because the SW has no access to Vite's
// import.meta.env at runtime.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: 'feverdream-3bafe',
  apiKey: 'AIzaSyBdVwV7GeXGWrHgTGYU9Nonjww4_w7GECM',
  authDomain: 'feverdream-3bafe.firebaseapp.com',
  storageBucket: 'feverdream-3bafe.firebasestorage.app',
  appId: '1:214591349114:web:27b66531f1a2af422176c3',
  messagingSenderId: '214591349114',
});

const messaging = firebase.messaging();

// Handle data-only / background messages. When the payload includes a
// `notification` block FCM auto-displays it; this handler covers data-only
// messages and lets us control click behaviour.
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};

  const title = notification.title || data.title || 'New site message';
  const options = {
    body: notification.body || data.body || '',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: data.tag || data.sourceId || 'fever-dream-site-message',
    data: { link: data.link || '/admin' },
  };

  self.registration.showNotification(title, options);
});

// Focus an existing tab (or open a new one) at the notification's deep link.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
      return undefined;
    }),
  );
});
