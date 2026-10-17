/**
 * tracking.js — Single source of truth for browser tracking events.
 *
 * See docs/tracking.md for the full governance contract.
 *
 * Design rules (do not violate):
 *  - Components MUST call these helpers instead of pushing to `window.dataLayer`
 *    or calling `fbq()` / `gtag()` directly. This prevents double-counting.
 *  - This module is SSR-safe and side-effect free at import time. It no-ops when
 *    `window`/`document` are undefined so the Vite prerender step is unaffected.
 *  - No PII (names, emails, phone numbers, message bodies) may be sent here.
 *  - Every push is enriched with Meta Pixel fields (see src/lib/metaPixel.js) so
 *    a single dataLayer push feeds both GA4 and Meta without double-counting.
 */

import { buildMetaFields, buildMetaPixelBootstrap } from './metaPixel.js';

/** Canonical event names. Keep in sync with docs/tracking.md §2.2. */
export const EVENTS = Object.freeze({
  PAGE_VIEW: 'page_view',
  VIEW_SHOW: 'view_show',
  TICKET_CLICK: 'ticket_click',
  TICKET_PURCHASE: 'ticket_purchase',
  CONTACT: 'contact',
  GENERATE_LEAD: 'generate_lead',
  SUBSCRIBE: 'subscribe',
});

/** Event categories. Keep in sync with docs/tracking.md §2.1. */
export const EVENT_CATEGORIES = Object.freeze({
  PAGE: 'page',
  ENGAGEMENT: 'engagement',
  LEAD: 'lead',
});

/** Maps each canonical event to its category. */
const EVENT_CATEGORY_MAP = Object.freeze({
  [EVENTS.PAGE_VIEW]: EVENT_CATEGORIES.PAGE,
  [EVENTS.VIEW_SHOW]: EVENT_CATEGORIES.ENGAGEMENT,
  [EVENTS.CONTACT]: EVENT_CATEGORIES.ENGAGEMENT,
  [EVENTS.TICKET_CLICK]: EVENT_CATEGORIES.LEAD,
  [EVENTS.TICKET_PURCHASE]: EVENT_CATEGORIES.LEAD,
  [EVENTS.GENERATE_LEAD]: EVENT_CATEGORIES.LEAD,
  [EVENTS.SUBSCRIBE]: EVENT_CATEGORIES.LEAD,
});

/** True when running in a browser with a usable dataLayer. */
function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/** True when debug logging is enabled via VITE_TRACKING_DEBUG. */
function isDebug() {
  try {
    return import.meta?.env?.VITE_TRACKING_DEBUG === 'true';
  } catch {
    return false;
  }
}

/**
 * Generate a unique, dedupe-friendly event id.
 * Format: `<event_name>.<epoch_ms>.<random>` (docs/tracking.md §4).
 * @param {string} eventName
 * @returns {string}
 */
export function createEventId(eventName) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${eventName}.${Date.now()}.${rand}`;
}

/**
 * Remove keys whose value is null or undefined so we never push empty fields
 * (docs/tracking.md §2.3).
 * @param {Record<string, unknown>} obj
 * @returns {Record<string, unknown>}
 */
function omitEmpty(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * Push a canonical event to the GTM dataLayer.
 *
 * @param {string} eventName - One of EVENTS.*
 * @param {Record<string, unknown>} [payload] - Extra event-specific fields.
 * @returns {Record<string, unknown> | null} The pushed object, or null when
 *   running outside the browser.
 */
export function track(eventName, payload = {}) {
  if (!eventName || typeof eventName !== 'string') {
    if (isDebug()) console.warn('[tracking] Ignored event with no name.');
    return null;
  }

  if (!isBrowser()) return null;

  const eventId = createEventId(eventName);

  const eventObject = omitEmpty({
    event: eventName,
    event_category: EVENT_CATEGORY_MAP[eventName] || EVENT_CATEGORIES.ENGAGEMENT,
    event_id: eventId,
    timestamp: new Date().toISOString(),
    page_path: window.location?.pathname,
    page_location: window.location?.href,
    page_title: document.title,
    ...payload,
    // Meta Pixel fields (meta_event_name, meta_event_id, meta_value, …). Merged
    // last so the canonical payload cannot accidentally clobber them. GTM's Meta
    // tags read these keys; a single push feeds both GA4 and Meta (§3).
    ...buildMetaFields(eventName, { ...payload, event_id: eventId }),
  });

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventObject);

  if (isDebug()) {
    console.info('[tracking]', eventObject);
  }

  return eventObject;
}

/**
 * Publish the Meta Pixel id to the dataLayer so GTM can load the pixel without
 * hard-coding the id in the container (docs/tracking.md §8).
 *
 * Call once at app startup, BEFORE the first `trackPageView`, so the base code
 * and the initial `PageView` fire in the correct order. No-ops when
 * `VITE_META_PIXEL_ID` is unset or when running outside the browser.
 *
 * @returns {Record<string, unknown> | null} The pushed object, or null.
 */
export function initMetaPixel() {
  if (!isBrowser()) return null;

  const bootstrap = buildMetaPixelBootstrap();
  if (!bootstrap) {
    if (isDebug()) {
      console.info('[tracking] Meta Pixel disabled — VITE_META_PIXEL_ID is unset.');
    }
    return null;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(bootstrap);

  if (isDebug()) {
    console.info('[tracking]', bootstrap);
  }

  return bootstrap;
}

/** Track a page view. Call once per route change. */
export function trackPageView(extra = {}) {
  return track(EVENTS.PAGE_VIEW, extra);
}

/** Track a show detail view (high-intent engagement). */
export function trackViewShow({ showId, showTitle, venueCity, priceFrom } = {}) {
  return track(EVENTS.VIEW_SHOW, {
    show_id: showId,
    show_title: showTitle,
    venue_city: venueCity,
    price_from: priceFrom,
  });
}

/**
 * Track an outbound ticket click.
 * @param {object} params
 * @param {'card'|'detail'|'embed'} params.placement
 */
export function trackTicketClick({
  showId,
  showTitle,
  venueCity,
  ticketUrl,
  placement,
} = {}) {
  return track(EVENTS.TICKET_CLICK, {
    show_id: showId,
    show_title: showTitle,
    venue_city: venueCity,
    ticket_url: ticketUrl,
    placement,
  });
}

/**
 * Track a completed Eventbrite ticket sale (Meta: Purchase).
 *
 * Fired when the embedded checkout reports a completed order. Because the
 * checkout runs in a cross-origin iframe we cannot read the order directly;
 * the component fires this from Eventbrite's `orderComplete` widget callback
 * (or, for the plain-iframe fallback, when the visitor returns from a
 * successful checkout via the `?checkout=complete` return URL).
 *
 * @param {object} params
 * @param {string} [params.showId]
 * @param {string} [params.showTitle]
 * @param {string} [params.venueCity]
 * @param {number|string} [params.value] - Order total in major units.
 * @param {string} [params.currency] - ISO currency code, defaults to CAD.
 * @param {string} [params.orderId] - Eventbrite order id (non-PII).
 * @param {number} [params.quantity] - Number of tickets purchased.
 * @param {'embed'|'return_url'} [params.source] - How completion was detected.
 */
export function trackTicketPurchase({
  showId,
  showTitle,
  venueCity,
  value,
  currency,
  orderId,
  quantity,
  source,
} = {}) {
  return track(EVENTS.TICKET_PURCHASE, {
    show_id: showId,
    show_title: showTitle,
    venue_city: venueCity,
    value,
    currency: currency || 'CAD',
    order_id: orderId,
    quantity,
    source,
  });
}

/** Track contact/inquiry intent (e.g. booking form viewed). */
export function trackContact({ formLocation } = {}) {
  return track(EVENTS.CONTACT, { form_location: formLocation });
}

/** Track a completed booking inquiry (primary lead conversion). */
export function trackGenerateLead({ leadType = 'booking_inquiry', eventType } = {}) {
  return track(EVENTS.GENERATE_LEAD, {
    lead_type: leadType,
    event_type: eventType,
  });
}

/** Track a newsletter/subscribe conversion. */
export function trackSubscribe({ source, locationConsent } = {}) {
  return track(EVENTS.SUBSCRIBE, {
    source,
    location_consent: typeof locationConsent === 'boolean' ? locationConsent : undefined,
  });
}

export default {
  EVENTS,
  EVENT_CATEGORIES,
  createEventId,
  initMetaPixel,
  track,
  trackPageView,
  trackViewShow,
  trackTicketClick,
  trackTicketPurchase,
  trackContact,
  trackGenerateLead,
  trackSubscribe,
};
