import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/tracking';

/**
 * RouteTracker — fires exactly one `page_view` per client-side navigation.
 *
 * Why a component instead of firing in each page?
 *  - Centralizes the page-view signal so no page can forget it or double-fire it.
 *  - The initial mount is skipped: the prerendered HTML already represents the
 *    first page load, and GTM's Meta base-code tag fires the initial `PageView`
 *    on container load. Firing again here would double-count (docs/tracking.md §3).
 *  - Subsequent SPA navigations (pathname changes) each fire one `page_view`.
 *
 * Renders nothing.
 */
export default function RouteTracker() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
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
