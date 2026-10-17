# Tracking & Conversion Governance

This document is the **single source of truth** for how Fever Dream Comedy measures
marketing and lead-conversion activity on the website. It defines *what* we track,
*how* events are shaped, *who* consumes them, and the *privacy/consent* rules that
must be satisfied before any marketing tag fires in production.

It is a **contract**. Downstream tasks implement against it:

| Task | Relationship to this document |
|------|-------------------------------|
| `gtm-container-installation` | Loads the GTM container and wires the `dataLayer` defined here. |
| `meta-pixel-conversion-tracking` | Maps the canonical events below to Meta Pixel standard events via GTM. |
| `tracking-validation-and-documentation` | Verifies the contract is honored and no duplicate events fire. |

> **Scope of this task (`tracking-foundation`):** define the contract only. No
> marketing tags are loaded and no third-party scripts are injected here. The
> implementation lives in the dependent tasks above.

---

## 1. Primary Lead-Conversion Actions

These are the business-critical actions the site must be able to measure. Each is
mapped to a **canonical event name** (see §2) and, later, to a Meta Pixel standard
event.

| # | Conversion action | Where it happens | Canonical event | Meta standard event |
|---|-------------------|------------------|-----------------|---------------------|
| 1 | **Booking inquiry submitted** | [`BookingForm`](../src/components/BookingForm.jsx:14) on `/book` | `generate_lead` | `Lead` |
| 2 | **Contact / inquiry intent** (form viewed or started) | [`Book`](../src/pages/Book.jsx:1) page | `contact` | `Contact` |
| 3 | **Newsletter / subscribe** | [`SubscribeBanner`](../src/components/SubscribeBanner.jsx:13) | `subscribe` | `Subscribe` |
| 4 | **Ticket checkout started** (outbound click or embed opened) | [`ShowCard`](../src/components/ShowCard.jsx:70) and [`EventbriteCheckout`](../src/components/EventbriteCheckout.jsx:1) | `ticket_click` | `InitiateCheckout` |
| 5 | **Ticket sale completed** (Eventbrite order) | [`EventbriteCheckout`](../src/components/EventbriteCheckout.jsx:1) | `ticket_purchase` | `Purchase` |
| 6 | **Show detail view** (high-intent engagement) | [`ShowDetail`](../src/pages/ShowDetail.jsx:7) | `view_show` | `ViewContent` |
| 7 | **Page view** (baseline) | All routes | `page_view` | `PageView` |

**Priority conversions** (used for ad optimization and reporting): `generate_lead`,
`subscribe`, `ticket_click`, and `ticket_purchase`.

---

## 2. Canonical Event Schema

Every browser event is pushed to `window.dataLayer` as a single object. Google Tag
Manager reads these objects and fans them out to GA4, Meta Pixel, and any future
destination. **The same object feeds every tag** — this is what prevents
double-counting.

### 2.1 Envelope (all events)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | `string` | ✅ | Canonical event name (see §2.2). |
| `event_category` | `string` | ✅ | One of `page`, `engagement`, `lead`. |
| `event_id` | `string` | ✅ | Unique id for deduplication across tags (see §4). |
| `timestamp` | `string` | ✅ | ISO-8601 UTC timestamp of when the event occurred. |
| `page_path` | `string` | ✅ | `location.pathname` at fire time. |
| `page_location` | `string` | ✅ | Full URL at fire time. |
| `page_title` | `string` | ✅ | `document.title` at fire time. |

### 2.2 Event catalogue

| `event` | `event_category` | Extra payload fields |
|---------|------------------|----------------------|
| `page_view` | `page` | — |
| `view_show` | `engagement` | `show_id`, `show_title`, `venue_city`, `price_from` |
| `ticket_click` | `lead` | `show_id`, `show_title`, `venue_city`, `ticket_url`, `placement` (`card` \| `detail` \| `embed`) |
| `ticket_purchase` | `lead` | `show_id`, `show_title`, `venue_city`, `value`, `currency`, `order_id`, `quantity`, `source` (`embed` \| `return_url`) |
| `contact` | `engagement` | `form_location` (`book`) |
| `generate_lead` | `lead` | `lead_type` (`booking_inquiry`), `event_type` |
| `subscribe` | `lead` | `source` (`homepage_banner` \| `show_detail`), `location_consent` (boolean) |

### 2.3 Field conventions

- **Naming:** `snake_case` for all keys and values. No spaces, no camelCase.
- **Money:** never send raw currency strings. Send numeric `price_from` in **major
  units** (e.g. `25.00`) plus a separate `currency` field (`CAD`) when a value is
  present. If unknown, omit the field rather than sending `null`.
- **PII:** **never** push names, emails, phone numbers, or free-text message bodies
  to the `dataLayer`. Lead PII stays in Firestore (`inquiries`, `subscribers`).
  Only non-identifying descriptors (e.g. `event_type`) may be sent.
- **Booleans:** send real booleans (`true`/`false`), not `"true"`/`"yes"`.
- **Absent values:** omit the key entirely; do not send `null` or `undefined`.

---

## 3. Single Source of Truth for Browser Events

To guarantee one signal per user action, **all** browser events flow through one
module: [`src/lib/tracking.js`](../src/lib/tracking.js:1).

```
UI component  ──►  track()  ──►  window.dataLayer.push({...})  ──►  GTM  ──┬─►  GA4
                                                                          └─►  Meta Pixel
```

Rules:

1. **Components never call `fbq()`, `gtag()`, or push to `dataLayer` directly.**
   They call the helpers exported from [`src/lib/tracking.js`](../src/lib/tracking.js:1).
2. **GTM is the only tag loader.** Meta Pixel is loaded *through* GTM (see
   `meta-pixel-conversion-tracking`), never via a second hard-coded snippet. This
   is the primary defense against double-counting.
3. **One event, one push.** A user action produces exactly one `dataLayer` push.
   GTM triggers are configured to fire one tag per canonical event.
4. **Deduplication id.** Every event carries a unique `event_id`. GTM forwards it
   to Meta as `eventID` so Meta can dedupe browser/server events. See §4.

The module is intentionally **side-effect free at import time** and **SSR-safe**:
it no-ops when `window`/`document` are undefined so the Vite prerender step
([`scripts/prerender.mjs`](../scripts/prerender.mjs:59)) is unaffected.

---

## 4. Deduplication Strategy

Double-counting is the most common analytics failure. We prevent it with three
layers:

1. **Single loader** — only GTM injects tags (§3).
2. **Single push per action** — helpers are the only entry point (§3).
3. **`event_id` correlation** — each event gets a unique id at creation. GTM passes
   it to Meta Pixel as `eventID`. If a future server-side (Conversions API) event
   is added, it reuses the same `event_id`, and Meta collapses the pair into one
   conversion.

`event_id` format: `<event_name>.<epoch_ms>.<random>` (e.g.
`generate_lead.1712345678901.a1b2c3`). It is generated once per event and never
regenerated downstream.

---

## 5. Consent & Privacy Expectations

Marketing tags must **not** fire until the visitor's consent state permits it.

### 5.1 Consent model

- **Default state is denied.** GTM is configured with Consent Mode v2 defaults of
  `denied` for `ad_storage`, `ad_user_data`, `ad_personalization`, and
  `analytics_storage` until consent is granted.
- **Consent is captured before tags fire.** A consent banner/mechanism (owned by a
  future task) updates `gtag('consent', 'update', {...})` and the `dataLayer`.
- **No marketing tag fires on denied consent.** GA4 may run in cookieless/ping
  mode; Meta Pixel must not fire until `ad_storage`/`ad_user_data` are granted.

### 5.2 Data minimization

- No PII in the `dataLayer` (§2.3). Emails and names remain in Firestore only.
- Geolocation captured by [`SubscribeBanner`](../src/components/SubscribeBanner.jsx:56)
  is stored in Firestore with explicit `locationConsent` and is **never** sent to
  marketing tags.
- IP addresses and user agents are handled by the tag platforms under their own
  policies; we do not forward them manually.

### 5.3 Regional / legal notes

- The audience is primarily **Ontario, Canada**. Applicable regimes include
  PIPEDA and, where relevant, CASL for commercial electronic messages.
- Subscribers consent to email via the subscribe form; marketing tags are a
  separate consent surface and must not be bundled silently.
- Document any change to this section in the task scratch file and re-verify in
  `tracking-validation-and-documentation`.

---

## 6. Environment Variables

The tracking stack is configured through Vite environment variables (prefix
`VITE_`). None are required for local development; tags simply no-op when unset.

| Variable | Used by | Purpose |
|----------|---------|---------|
| `VITE_GTM_CONTAINER_ID` | `gtm-container-installation` | GTM container id, e.g. `GTM-XXXXXXX`. |
| `VITE_META_PIXEL_ID` | `meta-pixel-conversion-tracking` | Meta Pixel id, injected via GTM. |
| `VITE_TRACKING_DEBUG` | all | When `"true"`, helpers log pushes to the console. |
| `VITE_EVENTBRITE_EMBED_ENABLED` | `eventbrite-embedded-checkout` | Set to `"false"` to force the outbound ticket link everywhere. Defaults to enabled. |

Add these to `.env.example` and the deployment environment (Firebase Hosting /
GitHub Actions) as the dependent tasks are implemented. See the root
[`README.md`](../README.md:1) for setup.

---

## 7. Verification Checklist (for downstream tasks)

- [ ] GTM container loads on every public route and on prerendered HTML.
- [ ] Exactly one `page_view` fires per navigation (no double fire on hydration).
- [ ] `generate_lead`, `subscribe`, and `ticket_click` fire once per action.
- [ ] Meta Pixel events carry the matching `event_id` for dedupe.
- [ ] No PII appears in any `dataLayer` payload.
- [ ] Tags respect Consent Mode defaults (denied until granted).
- [ ] No performance regression to initial render or prerender output.

---

## 8. Meta Pixel Conversion Tracking (via GTM)

This section is the contract for `meta-pixel-conversion-tracking`. The Meta Pixel
is **loaded through GTM** — never via a second hard-coded snippet — so the single
`dataLayer` push in §3 feeds both GA4 and Meta without double-counting.

### 8.1 Where the Pixel id lives

The pixel id is **not** hard-coded anywhere. It is read from the
`VITE_META_PIXEL_ID` environment variable by
[`src/lib/metaPixel.js`](../src/lib/metaPixel.js:1) and published to the
`dataLayer` at startup by `initMetaPixel()` (called from
[`src/main.jsx`](../src/main.jsx:1)).

> **To add the Pixel id:** set `VITE_META_PIXEL_ID` in `.env.local` (local dev)
> and as a GitHub Actions repository **variable** (production). See
> [`README.md`](../README.md:1) → "Meta Pixel setup" for the exact steps. When
> unset, the pixel is a clean no-op and nothing is pushed.

### 8.2 Canonical → Meta standard event mapping

GTM's Meta tags read the `meta_event_name` field from each `dataLayer` push and
fire the matching standard event. The mapping is defined once in
[`src/lib/metaPixel.js`](../src/lib/metaPixel.js:1) (`META_EVENT_MAP`):

| Canonical event | Meta standard event | Meta fields forwarded |
|-----------------|---------------------|-----------------------|
| `page_view` | `PageView` | `meta_event_id` |
| `view_show` | `ViewContent` | `meta_event_id`, `meta_content_ids`, `meta_content_type`, `meta_content_name`, `meta_value`, `meta_currency` |
| `contact` | `Contact` | `meta_event_id` |
| `generate_lead` | `Lead` | `meta_event_id` |
| `subscribe` | `Subscribe` | `meta_event_id` |
| `ticket_click` | `InitiateCheckout` | `meta_event_id`, `meta_content_ids`, `meta_content_type`, `meta_content_name`, `meta_value`, `meta_currency` |
| `ticket_purchase` | `Purchase` | `meta_event_id`, `meta_content_ids`, `meta_content_type`, `meta_content_name`, `meta_value`, `meta_currency` |

Every push also carries `meta_event_id`, which mirrors the canonical `event_id`
(§4). GTM forwards it to Meta as `eventID` so browser and any future
server-side (Conversions API) events collapse into one conversion.

### 8.3 GTM container setup (one-time, in the GTM UI)

The app only *describes* the pixel; the actual tags live in the GTM container.
Create these in GTM → **Tags**:

1. **Meta Pixel — Base Code**
   - Tag type: **Custom HTML**.
   - Trigger: **Initialization — All Pages** (fires before other tags).
   - HTML: the standard Meta base code, with the id read from the dataLayer:
     ```html
     <script>
       var PIXEL_ID = {{Meta Pixel ID}}; // Data Layer Variable → meta_pixel_id
       !function(f,b,e,v,n,t,s){/* …standard fbq loader… */}(window,document,'script',
         'https://connect.facebook.net/en_US/fbevents.js');
       fbq('init', PIXEL_ID);
       fbq('track', 'PageView');
     </script>
     ```
   - Create a **Data Layer Variable** named `Meta Pixel ID` with key
     `meta_pixel_id`. This is populated by `initMetaPixel()` at startup, so the
     id never has to be typed into the container.

2. **Meta Pixel — Event** (one tag, or one per event)
   - Tag type: **Custom HTML**.
   - Trigger: a **Custom Event** trigger matching each canonical event name
     (`view_show`, `contact`, `generate_lead`, `subscribe`, `ticket_click`).
   - HTML:
     ```html
     <script>
       fbq('track', '{{Meta Event Name}}', {
         content_ids: {{Meta Content IDs}},
         content_type: 'product',
         value: {{Meta Value}},
         currency: {{Meta Currency}}
       }, { eventID: {{Meta Event ID}} });
     </script>
     ```
   - Create **Data Layer Variables** for `meta_event_name`, `meta_content_ids`,
     `meta_value`, `meta_currency`, and `meta_event_id`.

3. **Consent** — the Meta tags must respect Consent Mode v2 (§5.1). Add
   `ad_storage` / `ad_user_data` as **Additional Consent Checks** on the Meta
   tags so they do not fire while consent is `denied`.

### 8.4 Debug & verification

**Automated (CI-friendly):**

```powershell
npm run build
npm run verify:meta      # Meta Pixel wiring smoke-test
npm run verify:tracking  # runs verify:gtm + verify:meta
```

[`scripts/verify-meta-pixel.mjs`](../scripts/verify-meta-pixel.mjs:1) asserts the
pixel id is configured, every canonical event maps to a Meta standard event, the
Meta fields are emitted correctly, the bootstrap carries the id, the GTM
container is present, and **no hard-coded `fbq(` base code leaked into the
build** (single-loader guarantee).

**Manual (browser):**

1. Set `VITE_TRACKING_DEBUG=true` and run `npm run dev`. Every `dataLayer` push
   is logged to the console with its `meta_event_name`.
2. Install the **Meta Pixel Helper** browser extension. On each page you should
   see exactly one `PageView`; on a show page one `ViewContent`; on a ticket CTA
   click one `InitiateCheckout`; on a successful inquiry one `Lead`; on a
   successful subscribe one `Subscribe`.
3. In GTM, use **Preview** mode to confirm the Meta tags fire on the matching
   Custom Event triggers and that `meta_pixel_id` resolves.
4. In **Meta Events Manager → Test Events**, enter the pixel id and confirm
   events arrive with the expected `eventID` (dedupe key).

**Staging vs production:** staging builds set the GTM DEV/STAGING environment
tokens (§6) so the unpublished container (with the Meta tags) is served; the
pixel id is the same. Production uses the published container with the
`VITE_META_PIXEL_ID` repository variable.

### 8.5 Privacy

Meta is a marketing tag and must not fire until `ad_storage` / `ad_user_data`
consent is granted (§5.1). No PII is ever forwarded (§2.3): only non-identifying
descriptors (`show_id`, `show_title`, `event_type`, numeric `value`) are sent.
The `subscribe` event forwards a boolean `location_consent` flag only — raw
coordinates stay in Firestore.

---

## 9. Eventbrite Embedded Checkout

This section is the contract for `eventbrite-embedded-checkout`. The show detail
page can render Eventbrite's checkout **inside the page** so visitors complete a
purchase without leaving the site, while keeping the show's branding, event
context, and conversion tracking active around the embedded flow.

### 9.1 Where it lives

| Piece | File | Responsibility |
|-------|------|----------------|
| Config helpers | [`src/lib/eventbrite.js`](../src/lib/eventbrite.js:1) | Derive the Eventbrite event id, build the official widget options, honour the kill-switch. SSR-safe, side-effect free. |
| UI component | [`src/components/EventbriteCheckout.jsx`](../src/components/EventbriteCheckout.jsx:1) | Renders the CTA, loads the official widget on demand, handles load failure, fires conversion events. |
| Page wiring | [`src/pages/ShowDetail.jsx`](../src/pages/ShowDetail.jsx:1) | Replaces the old outbound CTA with `<EventbriteCheckout event={event} />`. |

The embed is **opt-in per show**. It is enabled only when an Eventbrite event id
can be resolved:

1. an explicit `eventbriteId` field on the event document (preferred), or
2. the numeric id parsed from `ticketUrl` (`…-tickets-<id>`).

When neither is available — or `VITE_EVENTBRITE_EMBED_ENABLED=false` — the
component renders the original outbound **Get Tickets on Eventbrite** link, so
no show ever loses its purchase path.

### 9.2 Official widget integration

We use Eventbrite's **official** embedded checkout widget, not a hand-rolled
iframe:

```js
// loaded lazily from https://www.eventbrite.com/static/widgets/eb_widgets.js
window.EBWidgets.createWidget({
  widgetType: 'checkout',
  eventId: '<eventbriteId>',
  iframeContainerId: 'eventbrite-widget-container-<eventbriteId>',
  iframeContainerHeight: 620,
  onOrderComplete: ({ orderId }) => { /* fires ticket_purchase */ },
});
```

The widget owns the iframe, its URL, its auto-sizing and its postMessage
protocol. We only supply the event id, the container element, and the
completion callback.

> **Do not** point an iframe at an internal Eventbrite URL. The legacy
> `/tickets-external?eid=…` endpoint was retired and now returns **HTTP 404**
> (an unstyled Eventbrite error page), which is exactly what made an earlier
> hand-rolled embed look broken. `/checkout-external` is likewise an internal
> URL that Eventbrite can change without notice.

The widget script is injected only after the visitor clicks **Get Tickets —
Checkout Here**, so the third-party script never blocks initial render or the
prerender step.

### 9.3 Graceful degradation

| Condition | Behaviour |
|-----------|-----------|
| No Eventbrite id / kill-switch off | Outbound ticket link (original CTA). |
| Browser lacks iframe support | Outbound ticket link. |
| Page not served over `https:` | Outbound ticket link — Eventbrite's widget refuses to embed outside a secure context (so plain `http://localhost` shows the link). |
| Widget script blocked / offline | A 10-second watchdog flips to a fallback panel with a **Continue to Eventbrite** button. |
| Mobile | The widget container is full-width with a taller min-height; the header stacks vertically under 640px. |
| Any time | An **Open in new tab ↗** link and a **Buy on Eventbrite instead** link are always present. |

### 9.4 Conversion events

| Event | When it fires | Meta standard event |
|-------|---------------|---------------------|
| `ticket_click` | Visitor opens the embed (`placement: 'embed'`) or clicks any outbound link (`placement: 'detail'`). | `InitiateCheckout` |
| `ticket_purchase` | A completed order is detected. | `Purchase` |

`ticket_purchase` is detected in two ways, both guarded by a one-shot ref so it
never double-fires:

1. **Embed** — the widget's documented `onOrderComplete({ orderId })` callback.
   This is a supported API, not message sniffing: we never parse Eventbrite's
   internal `postMessage` payloads.
2. **Return URL** — when the visitor completes checkout in a new tab and returns
   with `?checkout=complete` (optionally `&order_id=…`), the component fires the
   event and then strips the marker from the URL via `history.replaceState` so a
   refresh cannot re-fire it.

Payload: `show_id`, `show_title`, `venue_city`, `value` (order total, major
units), `currency` (defaults to `CAD`), `order_id`, `quantity`, `source`
(`embed` | `return_url`). No PII is forwarded — Eventbrite owns the buyer data.

### 9.5 Eventbrite account prerequisites

The embed requires **no code changes** in the Eventbrite dashboard, but the
organizer account must satisfy Eventbrite's embed policy:

1. **Organizer account in good standing** — embedded checkout is available to
   organizers whose events are published and not restricted.
2. **Published, ticketed events** — the event must be live and selling tickets
   (free events render a registration form instead of a paid checkout).
3. **Embedding allowed** — Eventbrite must permit embedding for the organizer.
   If the widget reports `widgetNotEligible`, the watchdog falls back to the
   outbound link automatically.
4. **HTTPS** — the widget explicitly refuses to run on non-secure origins. Use
   `https://` (Firebase Hosting, or a tunnel) when testing the embed locally.
5. **Ticket URL present** — the sync script already stores `ticketUrl`; the
   numeric id is parsed from it. To pin a specific id, add an `eventbriteId`
   string field to the event document in Firestore.

> **No API key is needed for the embed.** The existing `EVENTBRITE_PRIVATE_TOKEN`
> is only used by the backend sync function.

### 9.6 Verification

```powershell
npm run build
npm run verify:eventbrite   # Eventbrite embed smoke-test
npm run verify:tracking     # runs verify:gtm + verify:meta + verify:eventbrite
```

[`scripts/verify-eventbrite.mjs`](../scripts/verify-eventbrite.mjs:1) asserts id
extraction, official widget options, embed gating, the kill-switch, the
`ticket_purchase` → `Purchase` mapping, SSR safety, and that the built bundle
loads `eb_widgets.js` and calls `EBWidgets.createWidget`.

**Manual QA:**

1. Serve the site over **https** (the widget refuses to embed otherwise).
2. Open a show detail page and click **Get Tickets — Checkout Here**.
3. Confirm the Eventbrite checkout renders in-page and the page URL does not
   change.
4. With `VITE_TRACKING_DEBUG=true`, confirm one `ticket_click` fires on open and
   one `ticket_purchase` fires after a test order.
5. Block the widget script (e.g. an extension) and confirm the fallback panel
   appears within ~10 seconds.
6. On a phone, confirm the checkout is full-width and scrollable.
