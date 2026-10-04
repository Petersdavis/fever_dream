import fs from 'node:fs';
import path from 'node:path';

const ORGANIZATION_ID = '906905779983';
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
    updatedAt: new Date().toISOString(),
  };
}

async function syncDev() {
  const token = loadEnvToken();
  if (!token) {
    console.error('Error: EVENTBRITE_PRIVATE_TOKEN not found in .env or environment');
    process.exit(1);
  }

  console.log('Fetching live events from Eventbrite API...');
  const params = new URLSearchParams({
    status: 'live',
    order_by: 'start_asc',
    expand: 'venue,ticket_classes,logo',
    page_size: '50',
  });

  const res = await fetch(`${API_BASE}/organizations/${ORGANIZATION_ID}/events/?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error(`Eventbrite API failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const rawEvents = data.events || [];
  const cutoffMs = Date.now() - (MAX_EVENT_AGE_DAYS * 24 * 60 * 60 * 1000);

  const filtered = rawEvents.filter((ev) => {
    if (!ev.created) return true;
    return new Date(ev.created).getTime() >= cutoffMs;
  });

  const normalized = filtered.map(normalizeEvent);

  const outDir = path.resolve(process.cwd(), 'src/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, 'events.json');
  fs.writeFileSync(outFile, JSON.stringify(normalized, null, 2), 'utf8');

  console.log(`Successfully synced ${normalized.length} events to ${outFile}`);
}

syncDev();
