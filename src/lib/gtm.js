/**
 * gtm.js — Google Tag Manager container configuration & snippet builders.
 *
 * See docs/tracking.md for the full governance contract.
 *
 * Design rules (do not violate):
 *  - GTM is the ONLY tag loader. Meta Pixel and GA4 are loaded *through* GTM,
 *    never via a second hard-coded snippet (docs/tracking.md §3).
 *  - The container id is configurable through the `VITE_GTM_CONTAINER_ID`
 *    environment variable. When unset, every builder returns an empty string so
 *    local development and CI builds without a container simply no-op.
 *  - This module is SSR-safe and side-effect free at import time. It only builds
 *    strings; it never touches `window`/`document`. The Vite prerender step
 *    (scripts/prerender.mjs) therefore remains unaffected.
 *  - Consent Mode v2 defaults are emitted *before* the container loads, with all
 *    storage signals `denied` until a consent banner grants them
 *    (docs/tracking.md §5.1).
 */

/** GTM Consent Mode storage key used by the in-app banner. */
export const GTM_CONSENT_STORAGE_KEY = 'fever_dream_gtm_consent';

/** 24-hour TTL for a declined consent choice. */
export const GTM_CONSENT_DECLINE_TTL_MS = 24 * 60 * 60 * 1000;

/** Normalized consent states written to both storage and GTM. */
export const GTM_CONSENT_STATES = Object.freeze({
  GRANTED: 'granted',
  DENIED: 'denied',
});

/**
 * Read an env var from either the Vite build context (`import.meta.env`) or a
 * plain Node script context (`process.env`). This lets the same module power the
 * Vite HTML plugin *and* the Node-based prerender/verify scripts.
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
 * Read the configured GTM container id from Vite env or process env.
 * Returns an empty string when unset so callers can no-op cleanly.
 * @returns {string}
 */
export function getGtmContainerId() {
  return readEnv('VITE_GTM_CONTAINER_ID');
}

/**
 * Read the optional GTM environment tokens (DEV/STAGING only).
 * Both must be present to activate a non-production environment. In production
 * both are intentionally empty, which makes GTM serve the published container.
 * @returns {{ auth: string, preview: string }}
 */
export function getGtmEnvTokens() {
  return {
    auth: readEnv('VITE_GTM_ENV_AUTH'),
    preview: readEnv('VITE_GTM_ENV_PREVIEW'),
  };
}

/**
 * Build the GTM environment query string appended to the container URL.
 * Returns an empty string in production (no tokens configured).
 * @param {string} [auth] - Explicit auth token; falls back to env when omitted.
 * @param {string} [preview] - Explicit preview id; falls back to env when omitted.
 * @returns {string}
 */
export function getGtmEnvQuery(auth, preview) {
  const tokens = getGtmEnvTokens();
  const resolvedAuth = (auth ?? tokens.auth ?? '').trim();
  const resolvedPreview = (preview ?? tokens.preview ?? '').trim();
  if (!resolvedAuth || !resolvedPreview) return '';
  return `&gtm_auth=${encodeURIComponent(resolvedAuth)}&gtm_preview=${encodeURIComponent(
    resolvedPreview
  )}&gtm_cookies_win=x`;
}

/**
 * Build the Consent Mode v2 default-denied bootstrap.
 * Must run BEFORE the GTM container snippet so the defaults are queued first.
 * @param {string} [containerId] - Explicit container id; falls back to env.
 * @returns {string} Inline `<script>` markup, or '' when no container is set.
 */
export function buildConsentDefaultSnippet(containerId) {
  const resolvedId = (containerId ?? getGtmContainerId() ?? '').trim();
  if (!resolvedId) return '';
  return `<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500
    });
    try {
      var storedConsent = window.localStorage && window.localStorage.getItem('${GTM_CONSENT_STORAGE_KEY}');
      if (storedConsent) {
        var parsedConsent;
        try {
          parsedConsent = JSON.parse(storedConsent);
        } catch {
          parsedConsent = storedConsent;
        }

        var consentValue = typeof parsedConsent === 'string' ? parsedConsent : parsedConsent && parsedConsent.value;
        var expiresAt = parsedConsent && typeof parsedConsent === 'object' ? parsedConsent.expiresAt : null;
        var isExpired = typeof expiresAt === 'number' && Date.now() >= expiresAt;

        if (!isExpired && consentValue === 'granted') {
          gtag('consent', 'update', {
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
            analytics_storage: 'granted'
          });
        }
      }
    } catch {
      // Ignore storage / parsing errors and fall back to the denied default.
    }
  </script>`;
}

/**
 * Read the stored consent preference from localStorage.
 * Returns `''` when no valid preference exists.
 * @returns {string}
 */
export function getStoredGtmConsent() {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return '';
    }

    const value = window.localStorage.getItem(GTM_CONSENT_STORAGE_KEY);
    if (!value) return '';

    if (value === GTM_CONSENT_STATES.GRANTED) {
      return GTM_CONSENT_STATES.GRANTED;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(value);
    } catch {
      return '';
    }

    if (!parsed || parsed.value !== GTM_CONSENT_STATES.DENIED) return '';
    if (typeof parsed.expiresAt === 'number' && Date.now() >= parsed.expiresAt) return '';

    return GTM_CONSENT_STATES.DENIED;
  } catch {
    return '';
  }
}

/**
 * Persist the user's consent preference in localStorage.
 * @param {'granted'|'denied'} consent
 * @returns {'granted'|'denied' | null}
 */
export function setStoredGtmConsent(consent) {
  const normalized = consent === GTM_CONSENT_STATES.GRANTED ? GTM_CONSENT_STATES.GRANTED : GTM_CONSENT_STATES.DENIED;
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      if (normalized === GTM_CONSENT_STATES.GRANTED) {
        window.localStorage.setItem(GTM_CONSENT_STORAGE_KEY, normalized);
      } else {
        window.localStorage.setItem(
          GTM_CONSENT_STORAGE_KEY,
          JSON.stringify({
            value: normalized,
            expiresAt: Date.now() + GTM_CONSENT_DECLINE_TTL_MS,
          })
        );
      }
    }
  } catch {
    // Ignore storage errors; the in-memory choice still applies for this session.
  }
  return normalized;
}

/**
 * Clear the stored consent preference so the banner can be shown again.
 * @returns {void}
 */
export function clearStoredGtmConsent() {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem(GTM_CONSENT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
}

/**
 * Convert a normalized consent choice into a GTM consent payload.
 * @param {'granted'|'denied'} consent
 * @returns {{ ad_storage: string, ad_user_data: string, ad_personalization: string, analytics_storage: string }}
 */
export function buildGtmConsentPayload(consent) {
  const normalized = consent === GTM_CONSENT_STATES.GRANTED ? GTM_CONSENT_STATES.GRANTED : GTM_CONSENT_STATES.DENIED;
  return {
    ad_storage: normalized,
    ad_user_data: normalized,
    ad_personalization: normalized,
    analytics_storage: normalized,
  };
}

/**
 * Apply a GTM consent update in the browser.
 * @param {'granted'|'denied'} consent
 * @returns {Record<string, string> | null}
 */
export function updateGtmConsent(consent) {
  if (typeof window === 'undefined') return null;

  const payload = buildGtmConsentPayload(consent);
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag('consent', 'update', payload);
  return payload;
}

/**
 * Re-apply a stored consent preference, if one exists.
 * @returns {Record<string, string> | null}
 */
export function syncStoredGtmConsent() {
  const storedConsent = getStoredGtmConsent();
  if (!storedConsent) return null;
  return updateGtmConsent(storedConsent);
}

/**
 * Build the GTM `<head>` container snippet.
 * Uses the async loader so it never blocks initial render.
 * @param {string} [containerId] - Explicit container id; falls back to env.
 * @param {string} [auth] - Explicit GTM env auth token; falls back to env.
 * @param {string} [preview] - Explicit GTM env preview id; falls back to env.
 * @returns {string} Head markup, or '' when no container is configured.
 */
export function buildGtmHeadSnippet(containerId, auth, preview) {
  const resolvedId = (containerId ?? getGtmContainerId() ?? '').trim();
  if (!resolvedId) return '';
  const envQuery = getGtmEnvQuery(auth, preview);
  return `<!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl+'${envQuery}';f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${resolvedId}');</script>
    <!-- End Google Tag Manager -->`;
}

/**
 * Build the GTM `<body>` noscript fallback.
 * @param {string} [containerId] - Explicit container id; falls back to env.
 * @param {string} [auth] - Explicit GTM env auth token; falls back to env.
 * @param {string} [preview] - Explicit GTM env preview id; falls back to env.
 * @returns {string} Noscript markup, or '' when no container is configured.
 */
export function buildGtmBodySnippet(containerId, auth, preview) {
  const resolvedId = (containerId ?? getGtmContainerId() ?? '').trim();
  if (!resolvedId) return '';
  const envQuery = getGtmEnvQuery(auth, preview);
  return `<!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${resolvedId}${envQuery}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->`;
}

export default {
  getGtmContainerId,
  getGtmEnvTokens,
  getGtmEnvQuery,
  GTM_CONSENT_STORAGE_KEY,
  GTM_CONSENT_STATES,
  buildConsentDefaultSnippet,
  getStoredGtmConsent,
  setStoredGtmConsent,
  clearStoredGtmConsent,
  buildGtmConsentPayload,
  updateGtmConsent,
  syncStoredGtmConsent,
  buildGtmHeadSnippet,
  buildGtmBodySnippet,
};
