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

`generate_lead` (booking inquiry), `subscribe` (newsletter), and `ticket_click`
(outbound Eventbrite CTA) are the priority conversions. See
[`docs/tracking.md`](docs/tracking.md:1) §1–§2 for the full catalogue and schema.

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
| `ticket_click` | `InitiateCheckout` | [`ShowCard`](src/components/ShowCard.jsx:1) / [`ShowDetail`](src/pages/ShowDetail.jsx:1) |

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

## Automated GitHub Actions (Weekly Rebuild & Prerender)

The repository includes [`.github/workflows/rebuild-deploy.yml`](.github/workflows/rebuild-deploy.yml) which runs automatically every Monday (and can be triggered manually) to pull fresh Eventbrite events, prerender static HTML with updated shows/stats, and deploy to Firebase Hosting.

### Required GitHub Repository Secrets:
Go to **Settings → Secrets and variables → Actions** in your GitHub repository and add:

1. `EVENTBRITE_PRIVATE_TOKEN`: Your Eventbrite private token.
2. `FIREBASE_SERVICE_ACCOUNT_FEVERDREAM_3BAFE`: The JSON key of a Firebase Service Account with Hosting Admin permissions (generated via Google Cloud Console under IAM & Admin → Service Accounts, or running `firebase init hosting:github`).


