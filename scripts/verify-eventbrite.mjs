/**
 * verify-eventbrite.mjs — Smoke-test the Eventbrite embedded checkout wiring.
 *
 * Run after `npm run build`:
 *   node scripts/verify-eventbrite.mjs
 *
 * What it checks (docs/tracking.md §9):
 *  1. Eventbrite ids are extracted from real ticket URLs.
 *  2. An explicit `eventbriteId` field wins over the URL.
 *  3. Widget options target Eventbrite's official `checkout` widget.
 *  4. `getEmbedConfig` enables the embed only when an id is available.
 *  5. `VITE_EVENTBRITE_EMBED_ENABLED=false` disables the embed globally.
 *  6. The `ticket_purchase` canonical event maps to Meta `Purchase`.
 *  7. `buildMetaFields` forwards numeric value + currency for `ticket_purchase`.
 *  8. The built bundle loads Eventbrite's official widget script (component wired).
 *
 * Exit code is non-zero on any failure so it can gate CI.
 */

import fs from 'node:fs';
import path from 'node:path';
import { EVENTS, trackTicketPurchase } from '../src/lib/tracking.js';
import { META_EVENT_MAP, buildMetaFields } from '../src/lib/metaPixel.js';
import {
  EVENTBRITE_WIDGET_SCRIPT,
  EVENTBRITE_WIDGET_TYPE,
  buildWidgetOptions,
  extractEventbriteId,
  getContainerId,
  getEmbedConfig,
  getEventbriteId,
  isEmbedGloballyEnabled,
} from '../src/lib/eventbrite.js';
import { loadEnv } from './load-env.mjs';

const root = process.cwd();
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

console.log('Verifying Eventbrite embedded checkout wiring ...\n');

// 1. Id extraction from real Eventbrite ticket URLs.
const sampleUrl =
  'https://www.eventbrite.com/e/girl-night-on-tour-an-all-women-comedy-show-at-ptit-ours-tickets-1998224106092';
check(
  'extractEventbriteId parses a standard ticket URL',
  extractEventbriteId(sampleUrl) === '1998224106092',
  `got "${extractEventbriteId(sampleUrl)}"`
);
check(
  'extractEventbriteId returns "" for a non-Eventbrite URL',
  extractEventbriteId('https://example.com/tickets') === ''
);
check(
  'extractEventbriteId tolerates a missing URL',
  extractEventbriteId(undefined) === ''
);

// 2. Explicit eventbriteId wins over the URL.
check(
  'getEventbriteId prefers an explicit eventbriteId field',
  getEventbriteId({ eventbriteId: '1234567890', ticketUrl: sampleUrl }) === '1234567890'
);
check(
  'getEventbriteId falls back to ticketUrl',
  getEventbriteId({ ticketUrl: sampleUrl }) === '1998224106092'
);

// 3. Official widget options.
const widgetOptions = buildWidgetOptions({ eventbriteId: '1998224106092' });
check(
  'buildWidgetOptions uses the official checkout widget type',
  widgetOptions?.widgetType === EVENTBRITE_WIDGET_TYPE
);
check(
  'buildWidgetOptions carries the event id',
  widgetOptions?.eventId === '1998224106092'
);
check(
  'buildWidgetOptions targets the deterministic container id',
  widgetOptions?.iframeContainerId === getContainerId('1998224106092')
);
check(
  'buildWidgetOptions reserves an initial container height',
  typeof widgetOptions?.iframeContainerHeight === 'number' &&
    widgetOptions.iframeContainerHeight > 0
);
check('buildWidgetOptions returns null without an id', buildWidgetOptions({}) === null);
check(
  'buildWidgetOptions forwards onOrderComplete',
  typeof buildWidgetOptions({
    eventbriteId: '1998224106092',
    onOrderComplete: () => {},
  })?.onOrderComplete === 'function'
);
check(
  'EVENTBRITE_WIDGET_SCRIPT points at the official widget bundle',
  EVENTBRITE_WIDGET_SCRIPT === 'https://www.eventbrite.com/static/widgets/eb_widgets.js'
);

// 4. getEmbedConfig gating.
const enabledConfig = getEmbedConfig({ ticketUrl: sampleUrl });
check(
  'getEmbedConfig enables the embed when an id is present',
  enabledConfig.enabled === true && enabledConfig.reason === 'ok'
);
const disabledConfig = getEmbedConfig({ ticketUrl: 'https://example.com/x' });
check(
  'getEmbedConfig disables the embed when no id is present',
  disabledConfig.enabled === false && disabledConfig.reason === 'no_eventbrite_id'
);

// 5. Global kill-switch.
const previousFlag = process.env.VITE_EVENTBRITE_EMBED_ENABLED;
process.env.VITE_EVENTBRITE_EMBED_ENABLED = 'false';
check('VITE_EVENTBRITE_EMBED_ENABLED=false disables the embed', isEmbedGloballyEnabled() === false);
check(
  'getEmbedConfig honours the kill-switch',
  getEmbedConfig({ ticketUrl: sampleUrl }).reason === 'disabled_by_env'
);
if (previousFlag === undefined) {
  delete process.env.VITE_EVENTBRITE_EMBED_ENABLED;
} else {
  process.env.VITE_EVENTBRITE_EMBED_ENABLED = previousFlag;
}

// 6. ticket_purchase maps to Meta Purchase.
check(
  'ticket_purchase canonical event exists',
  EVENTS.TICKET_PURCHASE === 'ticket_purchase'
);
check(
  'ticket_purchase maps to Meta Purchase',
  META_EVENT_MAP[EVENTS.TICKET_PURCHASE] === 'Purchase'
);

// 7. Purchase forwards numeric value + currency.
const purchaseFields = buildMetaFields(EVENTS.TICKET_PURCHASE, {
  event_id: 'ticket_purchase.1.a',
  value: 40,
  currency: 'CAD',
  show_id: 'evt_123',
  show_title: 'Girl Night',
});
check(
  'Purchase forwards numeric meta_value + meta_currency',
  purchaseFields.meta_value === 40 && purchaseFields.meta_currency === 'CAD'
);
check(
  'Purchase forwards meta_content_ids',
  Array.isArray(purchaseFields.meta_content_ids) &&
    purchaseFields.meta_content_ids[0] === 'evt_123'
);

// 8. trackTicketPurchase is SSR-safe (no window → no-op, no throw).
let ssrSafe = true;
try {
  const result = trackTicketPurchase({ showId: 'evt_123', value: 40 });
  ssrSafe = result === null;
} catch {
  ssrSafe = false;
}
check('trackTicketPurchase is SSR-safe (no-ops without window)', ssrSafe);

// 9. The built bundle references the embed endpoint (component is wired in).
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
  const bundle = jsFiles
    .map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf8'))
    .join('\n');
  check(
    'Built bundle loads the official Eventbrite widget script',
    bundle.includes('static/widgets/eb_widgets.js')
  );
  check(
    'Built bundle calls EBWidgets.createWidget',
    bundle.includes('createWidget')
  );
  check(
    'Built bundle includes the ticket_purchase event name',
    bundle.includes('ticket_purchase')
  );
} else {
  check('dist/assets exists (run `npm run build` first)', false);
}

console.log(`Passed ${passes.length} check(s):`);
for (const p of passes) console.log(`  ✓ ${p}`);

if (failures.length > 0) {
  console.error(`\nFailed ${failures.length} check(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log('\n✓ Eventbrite embedded checkout smoke-test passed.');
