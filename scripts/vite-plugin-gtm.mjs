/**
 * vite-plugin-gtm.mjs — Injects the Google Tag Manager container into index.html.
 *
 * Why a Vite plugin instead of a hard-coded snippet in index.html?
 *  - The container id must be configurable through `VITE_GTM_CONTAINER_ID`
 *    (docs/tracking.md §6). Vite inlines `VITE_*` vars at build time, so the
 *    snippet has to be generated during the build, not committed statically.
 *  - `transformIndexHtml` runs for both `vite dev` and `vite build`, so the
 *    snippet is present in development and production alike.
 *  - The prerender step (scripts/prerender.mjs) reads `dist/index.html` as its
 *    template, so every prerendered page inherits the injected snippet for free.
 *  - When no container id is configured the plugin injects nothing, keeping
 *    local development and CI builds without a container completely clean.
 *
 * The snippet is emitted with `async` loading and Consent Mode v2 defaults set
 * to `denied`, so it never blocks initial render (docs/tracking.md §5.1).
 *
 * Injection is done via direct string replacement (not Vite's `tags` API) so the
 * exact GTM markup — including HTML comments — is preserved verbatim.
 *
 * Config values are passed in explicitly from vite.config.js (which uses Vite's
 * `loadEnv`), because `.env` files are not visible to the config's module graph.
 */

import {
  buildConsentDefaultSnippet,
  buildGtmHeadSnippet,
  buildGtmBodySnippet,
  getGtmContainerId,
  getGtmEnvTokens,
} from '../src/lib/gtm.js';

/**
 * @param {object} [options]
 * @param {string} [options.containerId] - Resolved GTM container id.
 * @param {string} [options.envAuth] - GTM environment auth token (DEV/STAGING).
 * @param {string} [options.envPreview] - GTM environment preview id (DEV/STAGING).
 * @returns {import('vite').Plugin}
 */
export default function gtmPlugin(options = {}) {
  // Prefer explicitly-passed values (from loadEnv); fall back to env helpers so
  // the plugin still works when invoked without options (e.g. in tests).
  const containerId = (options.containerId || getGtmContainerId() || '').trim();
  const fallbackTokens = getGtmEnvTokens();
  const envAuth = (options.envAuth ?? fallbackTokens.auth ?? '').trim();
  const envPreview = (options.envPreview ?? fallbackTokens.preview ?? '').trim();

  return {
    name: 'fever-dream:gtm',
    // Run before Vite's own HTML processing so our tags are part of the template.
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!containerId) {
          // No container configured — leave the HTML untouched.
          return html;
        }

        const headSnippet = `${buildConsentDefaultSnippet(containerId)}\n    ${buildGtmHeadSnippet(
          containerId,
          envAuth,
          envPreview
        )}`;
        const bodySnippet = buildGtmBodySnippet(containerId, envAuth, envPreview);

        // Inject the head snippet immediately after <head> opens.
        let out = html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    ${headSnippet}`);

        // Inject the noscript fallback immediately after <body> opens.
        out = out.replace(/<body(\s[^>]*)?>/i, (match) => `${match}\n    ${bodySnippet}`);

        return out;
      },
    },
  };
}
