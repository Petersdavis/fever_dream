/**
 * eventbrite.js — Eventbrite embedded checkout configuration helpers.
 *
 * See docs/tracking.md §9 and README.md → "Eventbrite Embedded Checkout" for the
 * full contract.
 *
 * Design rules (do not violate):
 *  - This module is SSR-safe and side-effect free at import time. It only builds
 *    plain strings/objects; it never touches `window`/`document`. The Vite
 *    prerender step (scripts/prerender.mjs) therefore remains unaffected.
 *  - We use Eventbrite's **official** embedded checkout widget
 *    (`eb_widgets.js` → `EBWidgets.createWidget()`). We do NOT hand-roll an
 *    iframe pointing at an internal Eventbrite URL: the legacy
 *    `/tickets-external` endpoint was retired (it now 404s) and the widget
 *    script is the only supported integration path.
 *  - The embed is *opt-in*. It is only enabled when an Eventbrite event id can be
 *    derived from the event's `ticketUrl` (or an explicit `eventbriteId` field).
 *    When it cannot, callers must fall back to the plain outbound ticket link.
 *  - No PII is handled here. The iframe is Eventbrite's own checkout surface; we
 *    never read or forward its contents.
 */

/**
 * Read an env var from either the Vite build context (`import.meta.env`) or a
 * plain Node script context (`process.env`). Mirrors `src/lib/metaPixel.js` so
 * the same module powers the browser app *and* the Node verification scripts.
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

/** Eventbrite's supported embedded checkout host. */
export const EVENTBRITE_EMBED_ORIGIN = 'https://www.eventbrite.com';

/**
 * Eventbrite's official embedded checkout widget script. Loading this exposes
 * `window.EBWidgets`, whose `createWidget()` renders the checkout form inside a
 * container element on our own page so the visitor never leaves the site.
 */
export const EVENTBRITE_WIDGET_SCRIPT =
  'https://www.eventbrite.com/static/widgets/eb_widgets.js';

/** The only widget type we use. */
export const EVENTBRITE_WIDGET_TYPE = 'checkout';

/**
 * Default container height (px) handed to the widget. The widget auto-resizes
 * the container once it knows the real content height, so this is only the
 * initial reservation that avoids a layout jump.
 */
export const DEFAULT_EMBED_HEIGHT = 620;

/** Minimum height (px) Eventbrite's widget will ever shrink the container to. */
export const MIN_EMBED_HEIGHT = 425;

/**
 * Extract the numeric Eventbrite event id from a ticket URL.
 *
 * Eventbrite ticket URLs look like:
 *   https://www.eventbrite.com/e/<slug>-tickets-<id>
 *   https://www.eventbrite.ca/e/<slug>-tickets-<id>?aff=...
 *
 * @param {string} [ticketUrl]
 * @returns {string} The numeric event id, or '' when it cannot be derived.
 */
export function extractEventbriteId(ticketUrl) {
  if (!ticketUrl || typeof ticketUrl !== 'string') return '';
  const match = ticketUrl.match(/tickets-(\d{6,})/i) || ticketUrl.match(/\/(\d{10,})(?:[/?#]|$)/);
  return match ? match[1] : '';
}

/**
 * Resolve the Eventbrite event id for a show. Prefers an explicit
 * `eventbriteId` field (set by the sync script or manually in Firestore) and
 * falls back to parsing `ticketUrl`.
 *
 * @param {object} [event]
 * @returns {string}
 */
export function getEventbriteId(event) {
  if (!event) return '';
  const explicit = typeof event.eventbriteId === 'string' ? event.eventbriteId.trim() : '';
  if (/^\d{6,}$/.test(explicit)) return explicit;
  return extractEventbriteId(event.ticketUrl);
}

/**
 * Read the global embed kill-switch. Set `VITE_EVENTBRITE_EMBED_ENABLED=false`
 * to force the outbound-link experience everywhere (e.g. if Eventbrite changes
 * their embed policy or an organizer account is not eligible).
 * @returns {boolean}
 */
export function isEmbedGloballyEnabled() {
  const raw = readEnv('VITE_EVENTBRITE_EMBED_ENABLED');
  if (!raw) return true; // default on; degrades to link when no id is found
  return raw.toLowerCase() !== 'false';
}

/**
 * Stable DOM id for the widget's container element. Eventbrite's widget looks
 * the container up by id, so it must be deterministic per event.
 *
 * @param {string} eventbriteId
 * @returns {string}
 */
export function getContainerId(eventbriteId) {
  return `eventbrite-widget-container-${eventbriteId || 'unknown'}`;
}

/**
 * Build the options object passed to `EBWidgets.createWidget()`.
 *
 * The widget owns the iframe, its URL, its sizing and its postMessage protocol;
 * we only supply the event id, the container, and the completion callback.
 *
 * @param {object} params
 * @param {string} params.eventbriteId
 * @param {(payload: { orderId?: string }) => void} [params.onOrderComplete]
 * @param {number} [params.height]
 * @returns {object|null} Widget options, or null when no id is available.
 */
export function buildWidgetOptions({ eventbriteId, onOrderComplete, height } = {}) {
  if (!eventbriteId) return null;
  const options = {
    widgetType: EVENTBRITE_WIDGET_TYPE,
    eventId: String(eventbriteId),
    iframeContainerId: getContainerId(eventbriteId),
    iframeContainerHeight: height || DEFAULT_EMBED_HEIGHT,
  };
  if (typeof onOrderComplete === 'function') {
    options.onOrderComplete = onOrderComplete;
  }
  return options;
}

/**
 * Decide whether a show can be rendered with the embedded checkout.
 *
 * @param {object} [event]
 * @returns {{ enabled: boolean, eventbriteId: string, containerId: string, reason: string }}
 */
export function getEmbedConfig(event) {
  if (!isEmbedGloballyEnabled()) {
    return {
      enabled: false,
      eventbriteId: '',
      containerId: '',
      reason: 'disabled_by_env',
    };
  }

  const eventbriteId = getEventbriteId(event);
  if (!eventbriteId) {
    return {
      enabled: false,
      eventbriteId: '',
      containerId: '',
      reason: 'no_eventbrite_id',
    };
  }

  return {
    enabled: true,
    eventbriteId,
    containerId: getContainerId(eventbriteId),
    reason: 'ok',
  };
}

/**
 * Detect whether the current browser can render third-party iframes.
 *
 * Some hardened browsers / privacy extensions block cross-origin frames. We
 * cannot reliably detect that up front, so this only reports the *capability*
 * (iframe support + a secure-enough context). The component additionally
 * watches for the widget's render signal and falls back to the outbound link
 * when it never arrives.
 *
 * @returns {boolean}
 */
export function canRenderIframe() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    return 'contentWindow' in document.createElement('iframe');
  } catch {
    return false;
  }
}

/**
 * Eventbrite's widget refuses to run outside a secure context (it logs
 * "For security reasons, the embedded checkout widget can only be used on pages
 * served over https."). Report that up front so the UI can skip straight to the
 * outbound fallback on `http://` origins (e.g. plain localhost).
 *
 * @returns {boolean}
 */
export function isSecureContextForEmbed() {
  if (typeof window === 'undefined') return false;
  return window.location?.protocol === 'https:';
}

export default {
  EVENTBRITE_EMBED_ORIGIN,
  EVENTBRITE_WIDGET_SCRIPT,
  EVENTBRITE_WIDGET_TYPE,
  DEFAULT_EMBED_HEIGHT,
  MIN_EMBED_HEIGHT,
  extractEventbriteId,
  getEventbriteId,
  isEmbedGloballyEnabled,
  getContainerId,
  buildWidgetOptions,
  getEmbedConfig,
  canRenderIframe,
  isSecureContextForEmbed,
};
