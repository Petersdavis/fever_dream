import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_EMBED_HEIGHT,
  EVENTBRITE_WIDGET_SCRIPT,
  buildWidgetOptions,
  canRenderIframe,
  getEmbedConfig,
  isSecureContextForEmbed,
} from '../lib/eventbrite';
import { trackTicketClick, trackTicketPurchase } from '../lib/tracking';

/**
 * EventbriteCheckout — embedded Eventbrite ticket checkout for a show.
 *
 * Uses Eventbrite's **official** embedded checkout widget (`eb_widgets.js` →
 * `EBWidgets.createWidget()`). The widget owns the iframe, its URL, its sizing
 * and its postMessage protocol; we only supply the event id, the container
 * element, and an `onOrderComplete` callback. We deliberately do not hand-roll
 * an iframe at an internal Eventbrite URL — that is unsupported and broke when
 * Eventbrite retired `/tickets-external`.
 *
 * Behaviour (see docs/tracking.md §9):
 *  - Renders the checkout inside our page so visitors buy without leaving the
 *    site, keeping the show's branding/context around it.
 *  - The embed is opt-in: when no Eventbrite event id can be derived, or the
 *    global kill-switch is off, it renders the plain outbound ticket CTA.
 *  - Degrades gracefully: if the widget script fails to load, the container
 *    never renders, or the page is not served over https (Eventbrite refuses to
 *    embed there), it reveals the outbound link instead of leaving a blank box.
 *  - Fires `ticket_click` (Meta: InitiateCheckout) when the embed is opened and
 *    `ticket_purchase` (Meta: Purchase) from the widget's `onOrderComplete`.
 *
 * @param {object} props
 * @param {object} props.event - The show/event record.
 */
export default function EventbriteCheckout({ event }) {
  const config = useMemo(() => getEmbedConfig(event), [event]);

  // `idle` → CTA shown; `open` → widget mounted; `failed` → fall back to link.
  const [status, setStatus] = useState('idle');
  const [widgetReady, setWidgetReady] = useState(false);
  const containerRef = useRef(null);
  const loadTimerRef = useRef(null);
  const purchaseTrackedRef = useRef(false);

  const showId = event?.id;
  const showTitle = event?.title;
  const venueCity = event?.venueCity;
  const ticketUrl = event?.ticketUrl;

  const trackClick = useCallback(
    (clickPlacement) => {
      trackTicketClick({
        showId,
        showTitle,
        venueCity,
        ticketUrl,
        placement: clickPlacement,
      });
    },
    [showId, showTitle, venueCity, ticketUrl]
  );

  const trackPurchase = useCallback(
    (source, extra = {}) => {
      // Guard against double-firing (e.g. widget callback + return-URL marker).
      if (purchaseTrackedRef.current) return;
      purchaseTrackedRef.current = true;
      trackTicketPurchase({
        showId,
        showTitle,
        venueCity,
        value: extra.value,
        currency: event?.currency || 'CAD',
        orderId: extra.orderId,
        quantity: extra.quantity,
        source,
      });
    },
    [showId, showTitle, venueCity, event?.currency]
  );

  // Detect a completed purchase when the visitor returns from the outbound
  // checkout. Eventbrite appends nothing we can rely on, so we use our own
  // return marker (`?checkout=complete`) that the fallback link appends.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'complete') return;

    trackPurchase('return_url', {
      orderId: params.get('order_id') || undefined,
    });

    // Clean the marker out of the URL so a refresh does not re-fire the event.
    params.delete('checkout');
    params.delete('order_id');
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${
      window.location.hash || ''
    }`;
    window.history.replaceState({}, '', nextUrl);
  }, [trackPurchase]);

  // Clear the load watchdog on unmount.
  useEffect(
    () => () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    },
    []
  );

  // Mount the official widget once the container is in the DOM. The widget
  // script is loaded lazily (only after the visitor opts in) so it never blocks
  // first paint or the prerender step.
  useEffect(() => {
    if (status !== 'open' || !config.enabled) return undefined;

    let cancelled = false;

    function createWidget() {
      if (cancelled) return;
      const EBWidgets = typeof window !== 'undefined' ? window.EBWidgets : undefined;
      if (!EBWidgets || typeof EBWidgets.createWidget !== 'function') {
        setStatus('failed');
        return;
      }

      const options = buildWidgetOptions({
        eventbriteId: config.eventbriteId,
        height: DEFAULT_EMBED_HEIGHT,
        onOrderComplete: ({ orderId } = {}) => {
          trackPurchase('embed', { orderId });
        },
      });
      if (!options) {
        setStatus('failed');
        return;
      }

      try {
        EBWidgets.createWidget(options);
        setWidgetReady(true);
        if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      } catch {
        setStatus('failed');
      }
    }

    const existing = document.querySelector(`script[src="${EVENTBRITE_WIDGET_SCRIPT}"]`);
    if (existing) {
      // Script tag already present — the global may still be initialising.
      if (window.EBWidgets) createWidget();
      else existing.addEventListener('load', createWidget, { once: true });
      return () => {
        cancelled = true;
        existing.removeEventListener('load', createWidget);
      };
    }

    const script = document.createElement('script');
    script.src = EVENTBRITE_WIDGET_SCRIPT;
    script.async = true;
    script.addEventListener('load', createWidget, { once: true });
    script.addEventListener('error', () => setStatus('failed'), { once: true });
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener('load', createWidget);
    };
  }, [status, config.enabled, config.eventbriteId, trackPurchase]);

  const handleOpen = () => {
    trackClick('embed');
    setStatus('open');
    setWidgetReady(false);

    // Watchdog: if the widget has not signalled readiness within 10s, assume it
    // was blocked and reveal the outbound fallback.
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      setStatus((current) => (current === 'open' ? 'failed' : current));
    }, 10000);
  };

  const handleFallbackClick = () => {
    trackClick('detail');
  };

  // --- No embed available: plain outbound CTA (original behaviour) ----------
  if (!config.enabled) {
    return (
      <div className="show-detail-cta-wrapper">
        <a
          href={ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary show-detail-primary-cta"
          onClick={handleFallbackClick}
        >
          Get Tickets on Eventbrite →
        </a>
        <span className="cta-disclaimer">
          Fast, secure checkout via Eventbrite. Instant ticket delivery.
        </span>
      </div>
    );
  }

  // --- Embed available ------------------------------------------------------
  // Eventbrite's widget refuses to run outside a secure context, so skip
  // straight to the outbound link on http:// origins (e.g. plain localhost).
  const embedSupported = canRenderIframe() && isSecureContextForEmbed();
  const showWidget = status === 'open' && embedSupported;

  return (
    <div className="show-detail-cta-wrapper eventbrite-checkout">
      {status === 'idle' && (
        <>
          <button
            type="button"
            className="btn btn-primary show-detail-primary-cta"
            onClick={handleOpen}
          >
            Get Tickets — Checkout Here →
          </button>
          <span className="cta-disclaimer">
            Secure checkout powered by Eventbrite. You won't leave this page.
          </span>
        </>
      )}

      {showWidget && (
        <div className="eventbrite-embed-wrapper">
          <div className="eventbrite-embed-header">
            <span className="eventbrite-embed-title">🎟️ Select your tickets</span>
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="eventbrite-embed-open-link"
              onClick={handleFallbackClick}
            >
              Open in new tab ↗
            </a>
          </div>

          {!widgetReady && (
            <div className="eventbrite-embed-loading" role="status" aria-live="polite">
              Loading secure checkout…
            </div>
          )}

          {/* Eventbrite's widget injects its own iframe into this container. */}
          <div
            id={config.containerId}
            ref={containerRef}
            className="eventbrite-embed-container"
          />

          <p className="eventbrite-embed-note">
            Checkout is handled securely by Eventbrite. Having trouble?{' '}
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleFallbackClick}
            >
              Buy on Eventbrite instead
            </a>
            .
          </p>
        </div>
      )}

      {status === 'failed' && (
        <div className="eventbrite-embed-fallback" role="alert">
          <p>
            We couldn't load the in-page checkout — your browser may be blocking
            third-party frames. You can still buy tickets securely on Eventbrite.
          </p>
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary show-detail-primary-cta"
            onClick={handleFallbackClick}
          >
            Continue to Eventbrite →
          </a>
        </div>
      )}
    </div>
  );
}
