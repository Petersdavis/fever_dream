import { Link } from 'react-router-dom';
import { slugifyEvent } from '../lib/slugs';

export default function ShowCard({ event }) {
  const startDate = event.start ? new Date(event.start) : null;
  const dateFormatted = startDate
    ? startDate.toLocaleDateString('en-CA', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Date TBA';

  const timeFormatted = startDate
    ? startDate.toLocaleTimeString('en-CA', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const detailUrl = `/upcoming/${slugifyEvent(event)}`;

  return (
    <article className="show-card">
      <Link to={detailUrl} className="show-card-poster-wrapper" title={`View details for ${event.title}`}>
        {event.posterUrl ? (
          <img
            src={event.posterUrl}
            alt={event.title}
            className="show-card-poster"
            loading="lazy"
          />
        ) : (
          <div className="show-card-poster-placeholder">
            <span>Fever Dream Comedy</span>
          </div>
        )}
        {event.priceFrom && (
          <span className="show-card-badge">From {event.priceFrom}</span>
        )}
      </Link>

      <div className="show-card-content">
        <div className="show-card-datetime">
          <span className="show-date">{dateFormatted}</span>
          {timeFormatted && <span className="show-time"> • {timeFormatted}</span>}
        </div>

        <h3 className="show-card-title">
          <Link to={detailUrl} className="show-title-link">
            {event.title}
          </Link>
        </h3>

        <div className="show-card-location">
          <span className="show-venue">{event.venueName || 'Venue TBA'}</span>
          {event.venueCity && (
            <span className="show-city"> — {event.venueCity}</span>
          )}
        </div>

        {event.summary && (
          <p className="show-card-summary">{event.summary}</p>
        )}

        <div className="show-card-actions">
          <Link to={detailUrl} className="btn btn-secondary show-card-details-btn">
            Event Info
          </Link>
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary show-card-cta"
          >
            Tickets →
          </a>
        </div>
      </div>
    </article>
  );
}
