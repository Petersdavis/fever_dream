import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/tracking';
import { resolveSeoForPath, applySeoToDocument } from '../lib/seo';
import localFallbackEvents from '../data/events.json';

/**
 * RouteTracker — synchronizes document SEO metadata and fires one `page_view`
 * per client-side navigation.
 *
 * Why a component instead of firing in each page?
 *  - Centralizes the page-view signal and dynamic <head> SEO updates so no page
 *    can forget them or double-fire tracking.
 *  - The initial mount skips `trackPageView()`: the prerendered HTML already
 *    represents the first page load, and GTM's Meta base-code tag fires the
 *    initial `PageView` on container load (docs/tracking.md §3).
 *  - Subsequent SPA navigations update <title>, <meta>, canonical, and JSON-LD,
 *    and each fire one `page_view`.
 *
 * Renders nothing.
 */
export default function RouteTracker() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const seo = resolveSeoForPath(location.pathname, localFallbackEvents);
    applySeoToDocument(seo);

    // Skip the very first render — the initial PageView is owned by GTM's Meta
    // base-code tag so we never double-count the landing page.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    trackPageView();
  }, [location.pathname]);

  return null;
}
