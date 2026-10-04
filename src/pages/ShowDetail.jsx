import { useParams, Link } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { findEventBySlug, slugifyEvent } from '../lib/slugs';
import SubscribeBanner from '../components/SubscribeBanner';
import ShowCard from '../components/ShowCard';

export default function ShowDetail() {
  const { slug } = useParams();
  const { events, loading } = useEvents();

  const event = findEventBySlug(events, slug);

  if (loading) {
    return (
      <div className="page show-detail-page">
        <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page show-detail-page">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🎭</span>
          <h1 style={{ fontFamily: 'var(--font-logo)', fontSize: '2rem', marginBottom: '12px' }}>
            Show Not Found
          </h1>
          <p style={{ color: 'var(--text-dim)', maxWidth: '500px', margin: '0 auto 28px', fontSize: '1.1rem' }}>
            This show may have passed, sold out, or moved. Check out our upcoming tour dates across Ontario!
          </p>
          <Link to="/#shows" className="btn btn-primary">
            Browse Upcoming Shows →
          </Link>
        </div>
      </div>
    );
  }

  const startDate = event.start ? new Date(event.start) : null;
  const dateFormatted = startDate
    ? startDate.toLocaleDateString('en-CA', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date TBA';

  const timeFormatted = startDate
    ? startDate.toLocaleTimeString('en-CA', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const mapsUrl = event.venueAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName || ''} ${event.venueAddress}`)}`
    : null;

  // Filter other upcoming shows to recommend
  const otherShows = events
    .filter((e) => e.id !== event.id)
    .slice(0, 3);

  return (
    <div className="page show-detail-page">
      <div className="container">
        {/* Breadcrumb / Back Link */}
        <div className="show-detail-breadcrumb">
          <Link to="/#shows" className="show-detail-back">
            ← Back to All Upcoming Shows
          </Link>
        </div>

        <article className="show-detail-card">
          {/* Full-width Title Header */}
          <header className="show-detail-header">
            <div className="show-detail-eyebrow">
              {event.venueCity ? `Live in ${event.venueCity}` : 'Live Stand-Up Comedy'}
            </div>
            <h1 className="show-detail-title">{event.title}</h1>
          </header>

          <div className="show-detail-grid">
            {/* Column 1: Poster + Event Details Section */}
            <div className="show-detail-left-col">
              <div className="show-detail-poster-wrapper">
                {event.posterUrl ? (
                  <img
                    src={event.posterUrl}
                    alt={event.title}
                    className="show-detail-poster"
                  />
                ) : (
                  <div className="show-detail-poster-fallback">
                    <span>Fever Dream Comedy</span>
                  </div>
                )}
                {event.priceFrom && (
                  <span className="show-detail-badge">From {event.priceFrom}</span>
                )}
              </div>

              {/* Key Event Metadata / Details */}
              <div className="show-detail-meta-box">
                <div className="meta-row">
                  <span className="meta-icon" aria-hidden="true">📅</span>
                  <div>
                    <strong>{dateFormatted}</strong>
                    {timeFormatted && <span className="meta-sub"> • Showtime: {timeFormatted}</span>}
                  </div>
                </div>

                <div className="meta-row">
                  <span className="meta-icon" aria-hidden="true">📍</span>
                  <div>
                    <strong>{event.venueName || 'Venue to be announced'}</strong>
                    {event.venueAddress && (
                      <div className="meta-sub">
                        {event.venueAddress}
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="maps-link"
                          >
                            (View Map ↗)
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {event.priceFrom && (
                  <div className="meta-row">
                    <span className="meta-icon" aria-hidden="true">🎟️</span>
                    <div>
                      <strong>Tickets from {event.priceFrom}</strong>
                      <span className="meta-sub"> • Powered by Eventbrite</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Ticket CTA + Rich Description */}
            <div className="show-detail-right-col">
              {/* Primary Ticket CTA */}
              <div className="show-detail-cta-wrapper">
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary show-detail-primary-cta"
                >
                  Get Tickets on Eventbrite →
                </a>
                <span className="cta-disclaimer">
                  Fast, secure checkout via Eventbrite. Instant ticket delivery.
                </span>
              </div>

              {/* Event Description / Summary */}
              {event.descriptionHtml ? (
                <div className="show-detail-summary-box">
                  <h3>About This Show</h3>
                  <div
                    className="show-detail-description"
                    dangerouslySetInnerHTML={{ __html: event.descriptionHtml }}
                  />
                </div>
              ) : event.summary ? (
                <div className="show-detail-summary-box">
                  <h3>About This Show</h3>
                  <p>{event.summary}</p>
                </div>
              ) : null}
            </div>
          </div>
        </article>

        {/* Other Upcoming Tour Dates */}
        {otherShows.length > 0 && (
          <section className="show-detail-more-section">
            <div className="section-header" style={{ marginBottom: '32px' }}>
              <span className="eyebrow">On Tour</span>
              <h2 style={{ fontSize: '1.8rem' }}>More Upcoming Tour Dates</h2>
            </div>
            <div className="shows-grid">
              {otherShows.map((other) => (
                <ShowCard key={other.id} event={other} />
              ))}
            </div>
          </section>
        )}

        {/* Subscribe Banner */}
        <div style={{ marginTop: '60px' }}>
          <SubscribeBanner />
        </div>
      </div>
    </div>
  );
}
