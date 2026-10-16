/**
 * verify-meta-pixel.mjs — Smoke-test the Meta Pixel conversion wiring.
 *
 * Run after `npm run build`:
 *   node scripts/verify-meta-pixel.mjs
 *
 * What it checks (docs/tracking.md §8):
 *  1. The pixel id is configured (VITE_META_PIXEL_ID).
 *  2. The canonical→Meta event map covers every canonical event.
 *  3. Every canonical event resolves to a Meta standard event.
 *  4. `buildMetaFields` emits `meta_event_name` + `meta_event_id` for each event.
 *  5. Commerce events forward numeric `meta_value` + `meta_currency`.
 *  6. Content events forward `meta_content_ids`.
 *  7. The pixel bootstrap object carries the configured id.
 *  8. The GTM container is present in dist/index.html (pixel loads *through* GTM).
 *  9. No hard-coded `fbq(` base code leaked into the built HTML (single loader).
 *
 * Exit code is non-zero on any failure so it can gate CI.
 */

import fs from 'node:fs';
import path from 'node:path';
import { EVENTS } from '../src/lib/tracking.js';
import {
  META_EVENT_MAP,
  getMetaPixelId,
  getMetaEventName,
  buildMetaFields,
  buildMetaPixelBootstrap,
} from '../src/lib/metaPixel.js';
import { loadEnv } from './load-env.mjs';

const root = process.cwd();

// Populate process.env from .env* files so the pixel id is visible here.
loadEnv(root, process.env.NODE_ENV || 'production');

const distDir = path.resolve(root, 'dist');

const failures = [];
const passes = [];

function check(label, condition, detail = '') {
  if (condition) {
    passes.push(label);
  } else {
    failures.push(detail ? `${label} — ${detail}` : label);
  }
}

const pixelId = getMetaPixelId();

if (!pixelId) {
  console.log(
    'ℹ VITE_META_PIXEL_ID is not set. Nothing to verify — the pixel is ' +
      'intentionally disabled in this build.\n' +
      '  Set it in .env.local (dev) or as a GitHub Actions repository variable ' +
      '(production). See README.md → "Meta Pixel setup".'
  );
  process.exit(0);
}

console.log(`Verifying Meta Pixel ${pixelId} wiring ...\n`);

// 1. Every canonical event must be mapped to a Meta standard event.
const canonicalEvents = Object.values(EVENTS);
const unmapped = canonicalEvents.filter((name) => !META_EVENT_MAP[name]);
check(
  `All ${canonicalEvents.length} canonical events map to a Meta standard event`,
  unmapped.length === 0,
  unmapped.length ? `unmapped: ${unmapped.join(', ')}` : ''
);

// 2. Each canonical event resolves to a non-empty Meta event name.
for (const name of canonicalEvents) {
  const metaName = getMetaEventName(name);
  check(`"${name}" → "${metaName}"`, Boolean(metaName));
}

// 3. buildMetaFields emits the required Meta keys for every event.
for (const name of canonicalEvents) {
  const fields = buildMetaFields(name, { event_id: `${name}.123.abc` });
  check(
    `buildMetaFields("${name}") emits meta_event_name + meta_event_id`,
    fields.meta_event_name === META_EVENT_MAP[name] &&
      fields.meta_event_id === `${name}.123.abc`
  );
}

// 4. Commerce events forward numeric value + currency.
const viewContentFields = buildMetaFields(EVENTS.VIEW_SHOW, {
  event_id: 'view_show.1.a',
  price_from: '25.00',
});
check(
  'ViewContent forwards numeric meta_value + meta_currency',
  viewContentFields.meta_value === 25 &&
    viewContentFields.meta_currency === 'CAD'
);

const checkoutFields = buildMetaFields(EVENTS.TICKET_CLICK, {
  event_id: 'ticket_click.1.a',
  value: 42.5,
  currency: 'CAD',
});
check(
  'InitiateCheckout forwards numeric meta_value + meta_currency',
  checkoutFields.meta_value === 42.5 && checkoutFields.meta_currency === 'CAD'
);

// 5. Content events forward meta_content_ids.
const contentFields = buildMetaFields(EVENTS.VIEW_SHOW, {
  event_id: 'view_show.1.a',
  show_id: 'evt_123',
  show_title: 'Girl Night',
});
check(
  'ViewContent forwards meta_content_ids + meta_content_type',
  Array.isArray(contentFields.meta_content_ids) &&
    contentFields.meta_content_ids[0] === 'evt_123' &&
    contentFields.meta_content_type === 'product'
);

// 6. The bootstrap object carries the configured pixel id.
const bootstrap = buildMetaPixelBootstrap();
check(
  'Pixel bootstrap carries the configured id',
  bootstrap && bootstrap.meta_pixel_id === pixelId
);

// 7. The pixel must load *through* GTM — the container must be in the build.
const rootIndexPath = path.join(distDir, 'index.html');
if (fs.existsSync(rootIndexPath)) {
  const html = fs.readFileSync(rootIndexPath, 'utf8');
  check(
    'GTM container present in dist/index.html (pixel loads through GTM)',
    html.includes('googletagmanager.com/gtm.js')
  );
  check(
    'No hard-coded Meta base code in built HTML (single loader)',
    !html.includes('connect.facebook.net') && !html.includes('fbq(')
  );
} else {
  check('dist/index.html exists (run `npm run build` first)', false);
}

console.log(`Passed ${passes.length} check(s):`);
for (const p of passes) console.log(`  ✓ ${p}`);

if (failures.length > 0) {
  console.error(`\nFailed ${failures.length} check(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log('\n✓ Meta Pixel smoke-test passed.');
