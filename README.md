# Fever Dream Comedy

Website and backend synchronization services for Fever Dream Comedy. Built with React (Vite), Firebase Hosting, Cloud Functions, and Firestore.

## Prerequisites & Tooling Setup

### 1. Google Cloud CLI (`gcloud`)
To install the Google Cloud SDK on Windows via `winget`:

```powershell
winget install Google.CloudSDK
```

> **Note:** After installation completes, restart your PowerShell terminal for `gcloud` to be available in your PATH.

Authenticate and set the active project:
```powershell
gcloud auth login
gcloud config set project feverdream-3bafe
```

### 2. Firebase CLI
Firebase CLI is used for hosting, rules, and Cloud Functions management:

```powershell
npm install -g firebase-tools
firebase login
firebase use feverdream-3bafe
```

---

## Eventbrite Synchronization & Cloud Functions

The backend pulls upcoming shows and posters from Eventbrite into Firestore on a daily schedule.

### 1. Store the Eventbrite Secret
Set your Eventbrite private token in Cloud Secret Manager:

```powershell
firebase functions:secrets:set EVENTBRITE_PRIVATE_TOKEN
```
*(Paste the private token when prompted)*

### 2. Deploy Firestore Rules and Functions
```powershell
firebase deploy --only firestore:rules,functions
```

### 3. Trigger Manual Sync (Optional)
To test or populate Firestore immediately after deploy:
```powershell
# Replace with the deployed function URL displayed in deployment output:
Invoke-RestMethod "https://us-central1-feverdream-3bafe.cloudfunctions.net/syncEventsNow?key=<YOUR_EVENTBRITE_PRIVATE_TOKEN>"
```

---

## Local Frontend Development

Install frontend dependencies and start Vite dev server:

```powershell
npm install
npm run dev
```

Build for production (with static prerendering for SEO):
```powershell
npm run build
firebase deploy --only hosting
```

---

## Marketing Tracking & Conversion Governance

All browser tracking flows through a single module, [`src/lib/tracking.js`](src/lib/tracking.js:1),
which pushes canonical events to the Google Tag Manager `dataLayer`. GTM is the
only tag loader and fans events out to GA4 and Meta Pixel, which prevents
double-counting. The full contract — conversion events, event schema, consent and
privacy rules, and the deduplication strategy — lives in
[`docs/tracking.md`](docs/tracking.md:1).

### Environment variables

Copy [`.env.example`](.env.example:1) to `.env.local` and set:

| Variable | Purpose |
|----------|---------|
| `VITE_GTM_CONTAINER_ID` | Google Tag Manager container id (e.g. `GTM-XXXXXXX`). |
| `VITE_GTM_ENV_AUTH` | GTM environment auth token — **DEV/STAGING only**. |
| `VITE_GTM_ENV_PREVIEW` | GTM environment preview id — **DEV/STAGING only**. |
| `VITE_META_PIXEL_ID` | Meta Pixel id, loaded via GTM. |
| `VITE_TRACKING_DEBUG` | Set to `true` to log `dataLayer` pushes to the console. |
| `VITE_EVENTBRITE_EMBED_ENABLED` | Set to `false` to force the outbound ticket link everywhere. Defaults to enabled. |

All variables are optional for local development; tracking no-ops when unset.

### Environments: dev / staging / production

A single GTM container (`GTM-MQ858WZ3`) serves all environments:

- **Production** uses the **published** container. The GTM environment tokens
  (`VITE_GTM_ENV_AUTH`, `VITE_GTM_ENV_PREVIEW`) are **left empty** — the absence
  of an environment *is* production.
- **Dev / staging** set both tokens (copied from GTM → Admin → Environments) so
  GTM serves the unpublished workspace version instead of the live one.

Because Vite inlines `VITE_*` variables at build time, each environment's build
must have the correct values present during `npm run build`.

### How the GTM container is installed

The container is **not** hard-coded in [`index.html`](index.html:1). Instead, a
small Vite plugin ([`scripts/vite-plugin-gtm.mjs`](scripts/vite-plugin-gtm.mjs:1))
injects the standard GTM `<head>` snippet and `<body>` `<noscript>` fallback
during `vite build` (and `vite dev`). This keeps the container id configurable
through `VITE_GTM_CONTAINER_ID` while guaranteeing the snippet is present on
every page.

Key properties:

- **All public pages** — the plugin runs on the HTML template, and the prerender
  step ([`scripts/prerender.mjs`](scripts/prerender.mjs:1)) clones that template
  into every static page, so the container loads on all 16 prerendered routes.
- **Non-blocking** — the loader uses `async` and never blocks initial render.
- **Consent Mode v2** — a `gtag('consent', 'default', …)` block with all storage
  signals set to `denied` is emitted *before* the container loads
  (see [`docs/tracking.md`](docs/tracking.md:1) §5.1).
- **No-op when unset** — if `VITE_GTM_CONTAINER_ID` is empty, nothing is injected.

The snippet builders live in [`src/lib/gtm.js`](src/lib/gtm.js:1) and are shared
by the Vite plugin, the prerender guard, and the verification script.

### Consent popup setup

The site now ships with a first-party cookie consent banner that defaults GTM to
`denied` until a visitor chooses otherwise.

What the banner does:

- stores the user's choice in `localStorage` under `fever_dream_gtm_consent`
- calls `gtag('consent', 'update', …)` with either `granted` or `denied`
- re-applies the stored choice on later visits
- exposes a small “Cookie settings” launcher so the banner can be reopened

No extra Google Tag Manager template is required for the popup itself. The GTM
container only needs the standard Consent Mode defaults and the tag-level consent
checks described below.

#### Google Tag Manager setup steps

1. Open **GTM → Admin → Container Settings** and confirm the container id matches
   `VITE_GTM_CONTAINER_ID` in the deployment environment.
2. Leave the existing Consent Mode defaults in place. The app injects
   `ad_storage`, `ad_user_data`, `ad_personalization`, and `analytics_storage`
   as `denied` before GTM loads.
3. For every marketing tag, add **Additional Consent Checks** for:
   - `ad_storage`
   - `ad_user_data`
   - `ad_personalization`
   - `analytics_storage`
4. If you use GA4, configure the GA4 tag to read from the `dataLayer` as usual;
   it can remain cookieless until consent is granted.
5. Keep Meta Pixel and any other ad tags behind the same consent checks so they do
   not fire until the visitor accepts cookies.
6. In Preview mode, verify that the initial page load shows Consent Mode as denied,
   then accept cookies and confirm the consent update is sent before the next
   marketing tag fires.

#### Local behavior

- If the visitor accepts, the banner disappears and the choice is persisted.
- If the visitor declines, the choice is persisted and tags remain blocked.
- If the visitor clears site data, the banner appears again on the next visit.
- If `VITE_GTM_CONTAINER_ID` is unset, the banner still renders but GTM remains a
  no-op.

### Verifying the GTM installation

After a build, run the smoke-test:

```powershell
npm run build
npm run verify:gtm
```

[`scripts/verify-gtm.mjs`](scripts/verify-gtm.mjs:1) asserts that:

1. The container id is configured.
2. The GTM loader snippet is present in `dist/index.html`.
3. The `<noscript>` fallback is present.
4. Consent Mode v2 defaults are emitted with all signals `denied`.
5. Every prerendered page under `dist/` carries the container snippet.
6. The loader is `async` (non-blocking).

The script exits non-zero on any failure, so it can gate CI. The prerender step
also fails the build if a configured container is missing from any page.

### GitHub Actions (production deploy)

The weekly rebuild workflow [`.github/workflows/rebuild-deploy.yml`](.github/workflows/rebuild-deploy.yml:1)
injects the production container id at build time. Configure it as a repository
**variable** (Settings → Secrets and variables → Actions → **Variables** tab):

| Variable | Value |
|----------|-------|
| `VITE_GTM_CONTAINER_ID` | `GTM-MQ858WZ3` |
| `VITE_META_PIXEL_ID` | *(set once the Meta Pixel exists)* |

The workflow deliberately does **not** set `VITE_GTM_ENV_AUTH` /
`VITE_GTM_ENV_PREVIEW`, so production loads the published container.

### Primary conversion events

`generate_lead` (booking inquiry), `subscribe` (newsletter), `ticket_click`
(checkout started), and `ticket_purchase` (completed Eventbrite sale) are the
priority conversions. See [`docs/tracking.md`](docs/tracking.md:1) §1–§2 for the
full catalogue and schema.

---

## Meta Pixel Conversion Tracking

The Meta Pixel is loaded **through GTM** (never a second hard-coded snippet) so a
single `dataLayer` push feeds both GA4 and Meta. The full contract — event
mapping, GTM container setup, and QA steps — lives in
[`docs/tracking.md`](docs/tracking.md:1) §8.

### ➕ Where to add the Pixel id

The pixel id is **not** hard-coded. It is read from `VITE_META_PIXEL_ID` by
[`src/lib/metaPixel.js`](src/lib/metaPixel.js:1) and published to the `dataLayer`
at startup. Add it in **two** places:

1. **Local development** — set it in `.env.local` (copy from
   [`.env.example`](.env.example:1)):

   ```dotenv
   VITE_META_PIXEL_ID=123456789012345
   ```

2. **Production** — add a GitHub Actions repository **variable**
   (Settings → Secrets and variables → Actions → **Variables** tab):

   | Variable | Value |
   |----------|-------|
   | `VITE_META_PIXEL_ID` | your 15–16 digit Pixel id |

   The weekly rebuild workflow
   ([`.github/workflows/rebuild-deploy.yml`](.github/workflows/rebuild-deploy.yml:1))
   already passes `VITE_META_PIXEL_ID` into `npm run build`.

> When `VITE_META_PIXEL_ID` is unset, the pixel is a clean no-op: nothing is
> pushed to the `dataLayer` and no Meta tag fires.

### Canonical → Meta standard events

| Canonical event | Meta standard event | Fired from |
|-----------------|---------------------|------------|
| `page_view` | `PageView` | GTM base code + [`RouteTracker`](src/components/RouteTracker.jsx:1) |
| `view_show` | `ViewContent` | [`ShowDetail`](src/pages/ShowDetail.jsx:1) |
| `contact` | `Contact` | [`BookingForm`](src/components/BookingForm.jsx:1) (on view) |
| `generate_lead` | `Lead` | [`BookingForm`](src/components/BookingForm.jsx:1) (on submit) |
| `subscribe` | `Subscribe` | [`SubscribeBanner`](src/components/SubscribeBanner.jsx:1) |
| `ticket_click` | `InitiateCheckout` | [`ShowCard`](src/components/ShowCard.jsx:1) / [`EventbriteCheckout`](src/components/EventbriteCheckout.jsx:1) |
| `ticket_purchase` | `Purchase` | [`EventbriteCheckout`](src/components/EventbriteCheckout.jsx:1) |

### Verifying the Meta Pixel wiring

```powershell
npm run build
npm run verify:meta       # Meta Pixel wiring smoke-test
npm run verify:tracking   # runs verify:gtm + verify:meta
```

[`scripts/verify-meta-pixel.mjs`](scripts/verify-meta-pixel.mjs:1) asserts the
pixel id is configured, every canonical event maps to a Meta standard event, the
Meta fields are emitted correctly, the GTM container is present, and no
hard-coded `fbq(` base code leaked into the build.

For manual QA (Meta Pixel Helper, GTM Preview, Meta Test Events), see
[`docs/tracking.md`](docs/tracking.md:1) §8.4.

---

## Eventbrite Embedded Checkout

Show detail pages can render Eventbrite's checkout **inside the page** so visitors
buy tickets without leaving the site, while the show's branding, event context,
and conversion tracking stay active around the embedded flow. The full contract
lives in [`docs/tracking.md`](docs/tracking.md:1) §9.

### How it works

1. [`src/lib/eventbrite.js`](src/lib/eventbrite.js:1) resolves the Eventbrite
   event id — from an explicit `eventbriteId` field on the event document, or by
   parsing the numeric id out of `ticketUrl` (`…-tickets-<id>`).
2. [`EventbriteCheckout`](src/components/EventbriteCheckout.jsx:1) renders a
   **Get Tickets — Checkout Here** button. Clicking it lazily loads Eventbrite's
   **official** widget script (`eb_widgets.js`) and calls
   `EBWidgets.createWidget({ widgetType: 'checkout', eventId, iframeContainerId, onOrderComplete })`,
   so the visitor never leaves the page.
3. The component fires `ticket_click` (Meta: `InitiateCheckout`) when the embed
   opens and `ticket_purchase` (Meta: `Purchase`) from the widget's
   `onOrderComplete` callback.

> **Why the official widget?** We do not hand-roll an iframe at an internal
> Eventbrite URL. The legacy `/tickets-external?eid=…` endpoint was retired and
> now returns **HTTP 404** (an unstyled Eventbrite error page), which is what
> made an earlier hand-rolled embed look broken. The widget script is the only
> supported integration path and owns the iframe, its sizing, and its
> completion callback.

### Graceful degradation

| Condition | Behaviour |
|-----------|-----------|
| No Eventbrite id / `VITE_EVENTBRITE_EMBED_ENABLED=false` | Original outbound **Get Tickets on Eventbrite** link. |
| Page not served over `https:` | Outbound link — the widget refuses to embed outside a secure context (plain `http://localhost` shows the link). |
| Widget script blocked / offline | A 10-second watchdog shows a fallback panel with **Continue to Eventbrite**. |
| Mobile | Full-width checkout with a taller min-height; header stacks under 640px. |
| Always | **Open in new tab ↗** and **Buy on Eventbrite instead** links remain available. |

### Eventbrite prerequisites

- Organizer account in good standing with **published, ticketed** events.
- Eventbrite must permit embedding for the organizer. If the widget reports
  `widgetNotEligible`, the watchdog falls back to the outbound link.
- The page must be served over **https** — the widget explicitly refuses to run
  on non-secure origins.
- **No API key is required** for the embed. The existing
  `EVENTBRITE_PRIVATE_TOKEN` is only used by the backend sync function.
- To pin a specific id, add an `eventbriteId` string field to the event document
  in Firestore; otherwise it is parsed from `ticketUrl`.

### Verifying the embed

```powershell
npm run build
npm run verify:eventbrite   # Eventbrite embed smoke-test
npm run verify:tracking     # runs verify:gtm + verify:meta + verify:eventbrite
```

[`scripts/verify-eventbrite.mjs`](scripts/verify-eventbrite.mjs:1) asserts id
extraction, official widget options, embed gating, the kill-switch, the
`ticket_purchase` → `Purchase` mapping, SSR safety, and that the built bundle
loads `eb_widgets.js` and calls `EBWidgets.createWidget`.

---

## Admin Notifications for New Site Messages

Admins are alerted whenever a visitor submits a new **site message** (a booking
inquiry / contact submission stored in the `inquiries` collection). Delivery uses
**Firebase Cloud Messaging (FCM) Web Push**, so alerts arrive even when the admin
has no tab open and the device was asleep.

### Delivery path

```
Visitor submits BookingForm
        │  addDoc(collection(db, 'inquiries'), …)
        ▼
Firestore: inquiries/{messageId}  ──onCreate──▶  Cloud Function
                                                 onSiteMessageCreated
                                                        │
                        ┌───────────────────────────────┴───────────────────────────────┐
                        │ (1) persist audit feed                     (2) FCM Web Push   │
                        ▼                                                               ▼
        Firestore: notifications/{id}                          admin.messaging().sendEachForMulticast()
                        │                                                               │
                        │ (audit / future feed)                                         ▼
                        ▼                                              Google push service
        Admin dashboard (authenticated)                                         │
                                                                                ▼
                                                          Device OS wakes (even if asleep)
                                                                                │
                                                                                ▼
                                                          Service worker (firebase-messaging-sw.js)
                                                                                │
                                              ┌─────────────────────────────────┴───────────────────────────────┐
                                              │ tab open → onMessage → in-tab desktop notification              │
                                              │ tab closed → onBackgroundMessage → OS notification              │
                                              └─────────────────────────────────────────────────────────────────┘
```

1. [`BookingForm`](src/components/BookingForm.jsx:1) writes a document to
   `inquiries` (unchanged public write path).
2. The Firestore trigger `onSiteMessageCreated` in
   [`functions/index.js`](functions/index.js:1) fires on document creation and does **two** things:
   - **(1) Persists an audit feed** — writes a derived doc to the `notifications`
     collection (`{ type, title, body, link, read, createdAt }`).
   - **(2) Sends a background push** — [`sendPushToAdmins()`](functions/index.js:1)
     calls `getMessaging().sendEachForMulticast()` to every token in the
     `adminTokens` collection. Invalid/expired tokens are pruned automatically.
3. The authenticated Admin view ([`src/pages/Admin.jsx`](src/pages/Admin.jsx:1))
   registers this device for push via [`src/lib/push.js`](src/lib/push.js:1) and
   subscribes to foreground FCM messages via `onForegroundMessage`, which renders
   an in-tab desktop notification while the dashboard is open.
4. The background service worker
   [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js:1) receives
   the push when no tab is open and displays it; clicking it deep-links to `/admin`.

> **Single delivery path per state:** the open tab is served by the FCM
> `onMessage` foreground handler, and the closed tab is served by the service
> worker's `onBackgroundMessage`. There is no separate `onSnapshot` desktop
> notification, so a message is never surfaced twice.

### Permission UX (auth-gated)

The browser notification permission prompt is **never** shown on public pages.
The helpers in [`src/lib/notifications.js`](src/lib/notifications.js:1) and
[`src/lib/push.js`](src/lib/push.js:1) are imported only by the Admin view, and
the prompt is only triggered by an explicit **🔔 Enable Notifications** click that
is rendered *after* the `/admin` authentication gate passes. Unauthenticated
visitors see the login form and nothing else — no permission request, no push
registration, no notification code runs.

- **Enable Notifications** — requests permission, registers this device for FCM
  push (storing the token in `adminTokens`), then fires a test notification.
- **Send Test** — shown once permission is `granted`; re-fires a test
  notification so admins can verify the path at any time.
- **✓ Push enabled on this device** — shown once the FCM token is registered.
- Only *new* messages trigger alerts (the Cloud Function fires on document
  creation), so logging in never spams the admin with historical messages.

### Security rules

- The `notifications` collection is **read/update-only for authenticated admins**
  and can never be created or deleted by clients — only the Cloud Function (Admin
  SDK, which bypasses rules) writes it.
- The `adminTokens` collection is **create/update-only for authenticated admins**
  (each admin registers their own device token). It is **never readable or
  deletable by clients** — tokens are secrets, and the Cloud Function prunes
  stale ones via the Admin SDK.

See [`firestore.rules`](firestore.rules:1).

### Required configuration

1. **VAPID key** — generate a Web Push certificate key pair in
   **Firebase Console → Project Settings → Cloud Messaging → Web Push
   certificates → "Key pair"**, then set it in two places:

   | Where | Variable |
   |-------|----------|
   | Local dev (`.env.local`) | `VITE_FIREBASE_VAPID_KEY` |
   | Production (GitHub Actions → Variables) | `VITE_FIREBASE_VAPID_KEY` |

   > When `VITE_FIREBASE_VAPID_KEY` is unset, push registration is skipped and the
   > dashboard falls back to in-tab notifications only.

2. **Deploy** the updated rules and functions:

   ```powershell
   firebase deploy --only firestore:rules,functions
   ```

### iOS support (important)

Apple only allows Web Push on iOS **16.4+** and **only when the site is installed
to the Home Screen** as a PWA. A plain Safari tab cannot receive push. The
[`public/manifest.webmanifest`](public/manifest.webmanifest:1) and the
`apple-mobile-web-app-*` meta tags in [`index.html`](index.html:1) make the site
installable. iPhone admins must:

1. Open the site in Safari.
2. Tap **Share → Add to Home Screen**.
3. Launch the installed app, sign in to `/admin`, and tap **🔔 Enable Notifications**.

Android (Chrome), desktop Chrome/Edge/Firefox work without installation.

> **Browser note:** Web Push requires a secure context (HTTPS or `localhost`).
> When the Notification API or service workers are unavailable, the UI simply
> hides the notification controls.

---

## Automated GitHub Actions (Weekly Rebuild & Prerender)

The repository includes [`.github/workflows/rebuild-deploy.yml`](.github/workflows/rebuild-deploy.yml) which runs automatically every Monday (and can be triggered manually) to pull fresh Eventbrite events, prerender static HTML with updated shows/stats, and deploy to Firebase Hosting.

### Required GitHub Repository Secrets:
Go to **Settings → Secrets and variables → Actions** in your GitHub repository and add:

1. `EVENTBRITE_PRIVATE_TOKEN`: Your Eventbrite private token.
2. `FIREBASE_SERVICE_ACCOUNT_FEVERDREAM_3BAFE`: The JSON key of a Firebase Service Account with Hosting Admin permissions (generated via Google Cloud Console under IAM & Admin → Service Accounts, or running `firebase init hosting:github`).

