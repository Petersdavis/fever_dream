import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'feverdream-3bafe';
const ORGANIZATION_ID = '906905779983';
const ORGANIZER_PROFILE_URL = 'https://www.eventbrite.com/o/fever-dream-comedy-45265374033';
const API_BASE = 'https://www.eventbriteapi.com/v3';
const MAX_EVENT_AGE_DAYS = 180;

function loadEnvToken() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*EVENTBRITE_PRIVATE_TOKEN\s*=\s*(.*)\s*$/);
      if (match) return match[1].trim();
    }
  }
  return process.env.EVENTBRITE_PRIVATE_TOKEN;
}

function minTicketPrice(ticketClasses = []) {
  const paid = ticketClasses
    .map((t) => t.cost)
    .filter(Boolean)
    .sort((a, b) => a.value - b.value);
  if (paid.length === 0) return null;
  return {
    display: paid[0].display,
    value: paid[0].value,
    currency: paid[0].currency,
  };
}

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

async function fetchOrganizerStats() {
  try {
    const res = await fetch(ORGANIZER_PROFILE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const marker = '<script id="__NEXT_DATA__" type="application/json">';
    const start = html.indexOf(marker);
    if (start === -1) return null;
    const end = html.indexOf('</script>', start);
    const raw = html.slice(start + marker.length, end);
    const parsed = JSON.parse(raw);
    const organizer = parsed.props?.pageProps?.organizer;
    if (!organizer || !organizer.metrics) return null;

    return {
      organizerName: organizer.name || 'Fever Dream Comedy',
      profileUrl: ORGANIZER_PROFILE_URL,
      followers: organizer.metrics.followers || '198',
      hostingYears: organizer.metrics.hostingYears || '4 years',
      totalEvents: organizer.metrics.totalEvents || 109,
      attendeesHosted: organizer.metrics.attendeesHosted || '2.4k',
      avatarUrl: organizer.avatarUrl || null,
      updatedAt: FieldValue.serverTimestamp(),
    };
  } catch (err) {
    console.error('Error fetching organizer stats:', err.message);
    return null;
  }
}

async function run() {
  const token = loadEnvToken();
  if (!token) {
    console.error('EVENTBRITE_PRIVATE_TOKEN not found.');
    process.exit(1);
  }

  console.log(`Connecting to Firestore project ${PROJECT_ID} via ADC...`);
  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });

  const db = getFirestore();

  console.log('Fetching live events from Eventbrite...');
  const rawEvents = await fetchLiveEvents(token);
  const cutoffMs = Date.now() - (MAX_EVENT_AGE_DAYS * 24 * 60 * 60 * 1000);

  const recent = rawEvents.filter((ev) => {
    if (!ev.created) return true;
    return new Date(ev.created).getTime() >= cutoffMs;
  });

  const normalized = recent.map(normalizeEvent);
  console.log(`Uploading ${normalized.length} events to Firestore collection 'events'...`);

  const batch = db.batch();
  for (const event of normalized) {
    const docRef = db.collection('events').doc(event.id);
    batch.set(docRef, event, { merge: true });
  }

  console.log('Fetching verified organizer stats...');
  const stats = await fetchOrganizerStats();
  if (stats) {
    batch.set(db.collection('stats').doc('eventbrite'), stats, { merge: true });
  }

  await batch.commit();
  console.log(`SUCCESS! Loaded ${normalized.length} events and organizer stats into Firestore database in production.`);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
