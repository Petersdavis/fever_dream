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

  return (
    <article className="show-card">
      <div className="show-card-poster-wrapper">
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
      </div>

      <div className="show-card-content">
        <div className="show-card-datetime">
          <span className="show-date">{dateFormatted}</span>
          {timeFormatted && <span className="show-time"> • {timeFormatted}</span>}
        </div>

        <h3 className="show-card-title">{event.title}</h3>

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
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary show-card-cta"
          >
            Get Tickets →
          </a>
        </div>
      </div>
    </article>
  );
}
