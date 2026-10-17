// Browser notification helpers for the admin dashboard.
//
// IMPORTANT: nothing in this module runs on public pages. It is only imported
// by the authenticated Admin view, and every entry point is a no-op when the
// browser Notification API is unavailable (SSR, unsupported browsers, or a
// non-secure context). This guarantees unauthenticated visitors are never
// prompted for notification permission.

/**
 * Whether the browser supports the Notification API in this context.
 * Returns false during SSR / prerender (no `window`) and on insecure origins.
 */
export function isNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.Notification !== 'undefined'
  );
}

/**
 * Current permission state: 'default' | 'granted' | 'denied' | 'unsupported'.
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return window.Notification.permission;
}

/**
 * Request notification permission. MUST only be called after the admin auth
 * gate has passed. Resolves to the resulting permission string.
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  if (window.Notification.permission === 'granted') return 'granted';
  if (window.Notification.permission === 'denied') return 'denied';
  try {
    return await window.Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Show a desktop notification. Silently no-ops unless permission is granted.
 * @param {{ title: string, body?: string, tag?: string, onClick?: () => void }} opts
 */
export function showNotification({ title, body, tag, onClick } = {}) {
  if (!isNotificationSupported() || window.Notification.permission !== 'granted') {
    return null;
  }
  try {
    const notification = new window.Notification(title || 'Fever Dream', {
      body: body || '',
      tag,
      icon: '/vite.svg',
    });
    if (typeof onClick === 'function') {
      notification.onclick = () => {
        try {
          window.focus();
        } catch {
          // window.focus may be blocked; ignore.
        }
        onClick();
        notification.close();
      };
    }
    return notification;
  } catch {
    return null;
  }
}

/**
 * Fire a test notification so an authenticated admin can verify the delivery
 * path end-to-end without waiting for a real inquiry.
 */
export function showTestNotification() {
  return showNotification({
    title: 'Test notification',
    body: 'If you can see this, admin notifications are working.',
    tag: 'fever-dream-test',
  });
}
