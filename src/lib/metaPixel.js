/**
 * metaPixel.js — Meta Pixel configuration & canonical→Meta event mapping.
 *
 * See docs/tracking.md §8 for the full Meta Pixel contract.
 *
 * Design rules (do not violate):
 *  - GTM is the ONLY tag loader (docs/tracking.md §3). This module NEVER injects
 *    the Meta base code and NEVER calls `fbq()` directly. It only *describes*
 *    the pixel and maps our canonical events to Meta's standard events so the
 *    GTM tags can be configured against a single, testable source of truth.
 *  - The pixel id is configurable through the `VITE_META_PIXEL_ID` environment
 *    variable. When unset, every helper returns an empty/neutral value so local
 *    development and CI builds without a pixel simply no-op.
 *  - This module is SSR-safe and side-effect free at import time. It only builds
 *    plain objects/strings; it never touches `window`/`document`. The Vite
 *    prerender step (scripts/prerender.mjs) therefore remains unaffected.
 *  - No PII (names, emails, phone numbers, message bodies) may be sent to Meta
 *    (docs/tracking.md §2.3). Only non-identifying descriptors are forwarded.
 */

/**
 * Canonical event names, duplicated here as string literals to avoid a circular
 * import with `src/lib/tracking.js` (which imports this module). These MUST stay
 * in sync with `EVENTS` in `src/lib/tracking.js` and docs/tracking.md §2.2.
 * @type {Readonly<Record<string, string>>}
 */
const CANONICAL_EVENTS = Object.freeze({
  PAGE_VIEW: 'page_view',
  VIEW_SHOW: 'view_show',
  TICKET_CLICK: 'ticket_click',
  CONTACT: 'contact',
  GENERATE_LEAD: 'generate_lead',
  SUBSCRIBE: 'subscribe',
});

/**
 * Read an env var from either the Vite build context (`import.meta.env`) or a
 * plain Node script context (`process.env`). This lets the same module power the
 * browser app *and* the Node-based verification scripts.
 * @param {string} key
 * @returns {string}
 */
function readEnv(key) {
  try {
    const viteValue = import.meta?.env?.[key];
    if (typeof viteValue === 'string' && viteValue.trim()) return viteValue.trim();
  } catch {
    // `import.meta.env` is unavailable outside Vite — fall through to process.env.
  }
  try {
    const nodeValue = typeof process !== 'undefined' ? process.env?.[key] : undefined;
    if (typeof nodeValue === 'string' && nodeValue.trim()) return nodeValue.trim();
  } catch {
    // Ignore — no env available.
  }
  return '';
}

/**
 * Read the configured Meta Pixel id from Vite env or process env.
 * Returns an empty string when unset so callers can no-op cleanly.
 *
 * >>> ADD YOUR PIXEL ID HERE <<<
 * Set `VITE_META_PIXEL_ID` in `.env.local` (local dev) and as a GitHub Actions
 * repository *variable* (production). See README.md → "Meta Pixel setup".
 * @returns {string}
 */
export function getMetaPixelId() {
  return readEnv('VITE_META_PIXEL_ID');
}

/** True when a Meta Pixel id is configured. */
export function isMetaPixelConfigured() {
  return getMetaPixelId().length > 0;
}

/**
 * Canonical event → Meta standard event mapping.
 *
 * Meta's recommended standard events are used so ad optimization and reporting
 * work out of the box. Keep in sync with docs/tracking.md §1 and §8.
 *
 * | Canonical (dataLayer) | Meta standard event |
 * |-----------------------|---------------------|
 * | `page_view`           | `PageView`          |
 * | `view_show`           | `ViewContent`       |
 * | `contact`             | `Contact`           |
 * | `generate_lead`       | `Lead`              |
 * | `subscribe`           | `Subscribe`         |
 * | `ticket_click`        | `InitiateCheckout`  |
 */
export const META_EVENT_MAP = Object.freeze({
  [CANONICAL_EVENTS.PAGE_VIEW]: 'PageView',
  [CANONICAL_EVENTS.VIEW_SHOW]: 'ViewContent',
  [CANONICAL_EVENTS.CONTACT]: 'Contact',
  [CANONICAL_EVENTS.GENERATE_LEAD]: 'Lead',
  [CANONICAL_EVENTS.SUBSCRIBE]: 'Subscribe',
  [CANONICAL_EVENTS.TICKET_CLICK]: 'InitiateCheckout',
});

/**
 * Meta standard events that accept a monetary `value` + `currency` pair.
 * Used to decide whether to forward commerce fields.
 */
export const META_VALUE_EVENTS = Object.freeze([
  'ViewContent',
  'InitiateCheckout',
  'Purchase',
  'AddToCart',
]);

/**
 * Resolve the Meta standard event name for a canonical event.
 * @param {string} canonicalEvent - One of EVENTS.*
 * @returns {string} The Meta standard event name, or '' when unmapped.
 */
export function getMetaEventName(canonicalEvent) {
  return META_EVENT_MAP[canonicalEvent] || '';
}

/**
 * Build the Meta-specific fields that GTM forwards to the pixel for a given
 * canonical event. These are merged into the `dataLayer` push by
 * `src/lib/tracking.js` so a single push feeds both GA4 and Meta.
 *
 * The returned object is intentionally flat and snake_case to match the rest of
 * the dataLayer envelope (docs/tracking.md §2.3). GTM's Meta tags read these
 * keys directly.
 *
 * @param {string} canonicalEvent - One of EVENTS.*
 * @param {Record<string, unknown>} [payload] - The canonical event payload.
 * @returns {Record<string, unknown>} Meta fields to merge into the push.
 */
export function buildMetaFields(canonicalEvent, payload = {}) {
  const metaEventName = getMetaEventName(canonicalEvent);
  if (!metaEventName) return {};

  const fields = {
    // GTM reads `meta_event_name` to pick the Meta standard event to fire.
    meta_event_name: metaEventName,
    // Meta dedupe key — mirrors the canonical `event_id` (docs/tracking.md §4).
    meta_event_id: payload.event_id,
  };

  // Commerce fields: only forward when a numeric value is present.
  if (META_VALUE_EVENTS.includes(metaEventName)) {
    const value = toNumber(payload.value ?? payload.price_from);
    if (value !== undefined) {
      fields.meta_value = value;
      fields.meta_currency = payload.currency || 'CAD';
    }
  }

  // Content identity: helps Meta build audiences/retargeting for shows.
  const contentId = payload.show_id;
  if (contentId !== undefined && contentId !== null && contentId !== '') {
    fields.meta_content_ids = [String(contentId)];
    fields.meta_content_type = 'product';
    if (payload.show_title) fields.meta_content_name = payload.show_title;
  }

  return omitEmpty(fields);
}

/**
 * Build the Meta Pixel base-code configuration object.
 *
 * NOTE: This does NOT inject the pixel. GTM owns the base code (docs/tracking.md
 * §3). This object is exposed so the GTM container's "Meta Pixel — Base Code"
 * tag can be configured with the same id, and so verification scripts can assert
 * the id is wired correctly.
 *
 * @param {string} [pixelId] - Explicit id; falls back to env.
 * @returns {{ pixelId: string, enabled: boolean }}
 */
export function getMetaPixelConfig(pixelId) {
  const resolvedId = (pixelId ?? getMetaPixelId() ?? '').trim();
  return { pixelId: resolvedId, enabled: resolvedId.length > 0 };
}

/**
 * Build the `dataLayer` bootstrap object that tells GTM which pixel id to load.
 *
 * GTM's Meta Pixel base-code tag reads `meta_pixel_id` from the dataLayer, so the
 * pixel id never has to be hard-coded in the container. This is pushed once at
 * startup by `src/lib/tracking.js` (`initMetaPixel`).
 *
 * @param {string} [pixelId] - Explicit id; falls back to env.
 * @returns {Record<string, unknown> | null} The push object, or null when unset.
 */
export function buildMetaPixelBootstrap(pixelId) {
  const { pixelId: resolvedId, enabled } = getMetaPixelConfig(pixelId);
  if (!enabled) return null;
  return {
    event: 'meta_pixel_init',
    meta_pixel_id: resolvedId,
  };
}

/** Coerce a value to a finite number, or undefined when not numeric. */
function toNumber(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Remove keys whose value is null or undefined so we never push empty fields. */
function omitEmpty(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

export default {
  META_EVENT_MAP,
  META_VALUE_EVENTS,
  getMetaPixelId,
  isMetaPixelConfigured,
  getMetaEventName,
  buildMetaFields,
  getMetaPixelConfig,
  buildMetaPixelBootstrap,
};
