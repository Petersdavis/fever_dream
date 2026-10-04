const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');

initializeApp();
const db = getFirestore();

const EVENTBRITE_PRIVATE_TOKEN = defineSecret('EVENTBRITE_PRIVATE_TOKEN');

// Fever Dream's real Eventbrite API organization id (not the vanity profile id).
const ORGANIZATION_ID = '906905779983';
const EVENTS_COLLECTION = 'events';
const API_BASE = 'https://www.eventbriteapi.com/v3';
const MAX_EVENT_AGE_DAYS = 180; // Only sync events created within the last 6 months (180 days)

/**
 * Pull every live event for the organization, following pagination.
 */
async function fetchLiveEvents(token) {
  const events = [];
  let continuation = null;

  do {
    const params = new URLSearchParams({
      status: 'live',
      order_by: 'start_asc',
      expand: 'venue,ticket_classes,logo',
      page_size: '50',
    });
    if (continuation) params.set('continuation', continuation);

    const url = `${API_BASE}/organizations/${ORGANIZATION_ID}/events/?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Eventbrite API ${res.status}: ${body}`);
    }

    const data = await res.json();
    events.push(...(data.events || []));
    continuation = data.pagination?.has_more_items ? data.pagination.continuation : null;
  } while (continuation);

  return events;
}

/**
 * Collapse Eventbrite's ticket classes to a single "from" price for display.
 */
function minTicketPrice(ticketClasses = []) {
  const paid = ticketClasses
    .map((t) => t.cost)
    .filter(Boolean)
    .sort((a, b) => a.value - b.value);
  if (paid.length === 0) return null;
  return {
    display: paid[0].display, // e.g. "$22.63"
    value: paid[0].value, // integer minor units
    currency: paid[0].currency,
  };
}

/**
 * Map a raw Eventbrite event to the normalized shape the website reads.
 */
function normalizeEvent(ev) {
  const venue = ev.venue || {};
  const address = venue.address || {};
  const price = minTicketPrice(ev.ticket_classes);

  return {
    id: ev.id,
    title: ev.name?.text || 'Untitled Show',
    summary: ev.summary || '',
    start: ev.start?.local || null,
    startUtc: ev.start?.utc || null,
    end: ev.end?.local || null,
    timezone: ev.start?.timezone || null,
    ticketUrl: ev.url || null,
    posterUrl: ev.logo?.original?.url || ev.logo?.url || null,
    venueName: venue.name || null,
    venueCity: address.city || null,
    venueAddress: address.localized_address_display || null,
    priceFrom: price?.display || null,
    priceValue: price?.value ?? null,
    currency: price?.currency || null,
    status: ev.status || 'live',
    isFree: ev.is_free ?? false,
    createdAt: ev.created || null,
    source: 'eventbrite',
    updatedAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Core sync: upsert live events created within the last 6 months,
 * and remove docs that are no longer live or older than the threshold.
 */
async function syncEventsCore(token) {
  const raw = await fetchLiveEvents(token);
  const cutoffMs = Date.now() - (MAX_EVENT_AGE_DAYS * 24 * 60 * 60 * 1000);

  // Filter out events created more than 6 months ago
  const recentEvents = raw.filter((ev) => {
    if (!ev.created) return true;
    const createdTime = new Date(ev.created).getTime();
    return createdTime >= cutoffMs;
  });

  const normalized = recentEvents.map(normalizeEvent);
  const liveIds = new Set(normalized.map((e) => e.id));

  const batch = db.batch();
  const col = db.collection(EVENTS_COLLECTION);

  for (const event of normalized) {
    batch.set(col.doc(event.id), event, { merge: true });
  }

  // Remove events that have dropped off the live list (ended / unpublished / aged out).
  const existing = await col.where('source', '==', 'eventbrite').get();
  existing.forEach((doc) => {
    if (!liveIds.has(doc.id)) batch.delete(doc.ref);
  });

  await batch.commit();
  logger.info(`Synced ${normalized.length} events (filtered from ${raw.length} total live; cutoff ${MAX_EVENT_AGE_DAYS}d); pruned stale docs.`);
  return normalized.length;
}

// Scheduled daily sync (06:00 America/Toronto).
exports.syncEvents = onSchedule(
  {
    schedule: '0 6 * * *',
    timeZone: 'America/Toronto',
    secrets: [EVENTBRITE_PRIVATE_TOKEN],
    region: 'us-central1',
  },
  async () => {
    await syncEventsCore(EVENTBRITE_PRIVATE_TOKEN.value());
  },
);

// Manual trigger for the first populate / ad-hoc refresh.
// Guarded by a shared key passed as ?key= matching the private token.
exports.syncEventsNow = onRequest(
  { secrets: [EVENTBRITE_PRIVATE_TOKEN], region: 'us-central1' },
  async (req, res) => {
    const token = EVENTBRITE_PRIVATE_TOKEN.value();
    if (req.query.key !== token) {
      res.status(403).send('Forbidden');
      return;
    }
    try {
      const count = await syncEventsCore(token);
      res.status(200).json({ ok: true, synced: count });
    } catch (err) {
      logger.error('Manual sync failed', err);
      res.status(500).json({ ok: false, error: String(err) });
    }
  },
);
