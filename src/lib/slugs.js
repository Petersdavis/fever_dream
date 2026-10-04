/**
 * Helper to generate consistent, SEO-friendly slugs for events.
 */
export function slugifyEvent(event) {
  if (!event) return '';
  const cleanTitle = (event.title || 'comedy-show')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents like Montréal -> Montreal
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const cleanCity = (event.venueCity || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const base = cleanCity && !cleanTitle.includes(cleanCity)
    ? `${cleanTitle}-${cleanCity}`
    : cleanTitle;

  return `${base}-${event.id}`;
}

/**
 * Find an event matching either the full slug, the raw event ID, or ending with the ID.
 */
export function findEventBySlug(events = [], slug = '') {
  if (!events || !slug) return null;
  const normalizedSlug = String(slug).trim().toLowerCase();

  return (
    events.find((e) => slugifyEvent(e).toLowerCase() === normalizedSlug) ||
    events.find((e) => String(e.id) === normalizedSlug) ||
    events.find((e) => normalizedSlug.endsWith(`-${e.id}`)) ||
    null
  );
}
