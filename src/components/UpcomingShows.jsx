import ShowCard from './ShowCard';

export default function UpcomingShows({ events = [], loading = false }) {
  if (loading) {
    return (
      <section className="upcoming-shows-section" id="shows">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">On Stage</span>
            <h2>Upcoming Shows & Tour Dates</h2>
          </div>
          <p className="shows-loading">Loading upcoming shows...</p>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return (
      <section className="upcoming-shows-section" id="shows">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">On Stage</span>
            <h2>Upcoming Shows & Tour Dates</h2>
          </div>
          <div className="shows-empty">
            <p>New tour dates dropping soon!</p>
            <a href="#newsletter" className="btn btn-secondary">Get Notified First</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="upcoming-shows-section" id="shows">
      <span id="events" className="hash-anchor" aria-hidden="true" />
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">Live Dates Across Ontario & Beyond</span>
          <h2>Upcoming Shows</h2>
          <p className="section-subtitle">
            Grab tickets early — shows regularly sell out in advance.
          </p>
        </div>

        <div className="shows-grid">
          {events.map((event) => (
            <ShowCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
