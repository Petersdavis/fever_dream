import { useStats } from '../hooks/useStats';
import StarRating from './StarRating';
import eventbriteLogo from '../assets/logos/Eventbrite-2048x357.png';

export default function SocialProofBanner() {
  const { stats } = useStats();

  const profileUrl =
    stats?.profileUrl || 'https://www.eventbrite.com/o/fever-dream-comedy-45265374033';

  return (
    <section className="social-proof-banner-section" id="proof">
      <span id="social-proof" className="hash-anchor" aria-hidden="true" />
      <div className="container">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="social-proof-banner-link"
          title="View Fever Dream Comedy on Eventbrite"
        >
          <div className="social-proof-header">
            <div className="social-proof-header-left">
              <div className="social-proof-logo-wrapper">
                <img
                  src={eventbriteLogo}
                  alt="Eventbrite"
                  className="social-proof-eb-logo"
                />
              </div>
              <div className="social-proof-rating">
                <StarRating rating={5} size={15} />
                <span className="rating-label">Top-Rated Live Shows</span>
              </div>
            </div>

            <span className="social-proof-view-all">
              Profile ↗
            </span>
          </div>

          <div className="social-proof-grid">
            <div className="social-proof-stat">
              <span className="stat-number">{stats?.attendeesHosted || '2.4k'}+</span>
              <span className="stat-label">Attendees Hosted</span>
            </div>

            <div className="social-proof-divider" aria-hidden="true" />

            <div className="social-proof-stat">
              <span className="stat-number">{stats?.totalEvents || '109'}</span>
              <span className="stat-label">Shows Produced</span>
            </div>

            <div className="social-proof-divider" aria-hidden="true" />

            <div className="social-proof-stat">
              <span className="stat-number">{stats?.hostingYears || '4 Years'}</span>
              <span className="stat-label">Hosting on Eventbrite</span>
            </div>

            <div className="social-proof-divider" aria-hidden="true" />

            <div className="social-proof-stat">
              <span className="stat-number">{stats?.followers || '198'}</span>
              <span className="stat-label">Eventbrite Followers</span>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}
