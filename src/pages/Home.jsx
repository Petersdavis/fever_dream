import { Link } from 'react-router-dom';
import UpcomingShows from '../components/UpcomingShows';
import { useEvents } from '../hooks/useEvents';
import bestOfFestWatermark from '../assets/guelph_fringe/2026 BEST OF FEST - White.png';
import bigBuzzWatermark from '../assets/guelph_fringe/2026 BIG BUZZ - White.png';

const FRINGE_POSTER_THUMB_URL =
  'https://static.wixstatic.com/media/5bbf7f_0cc0f3f9100d4083b6dcbf17e6d4f046~mv2.png/v1/fill/w_581,h_320,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Love%20So%20Far%20Poster%20-%201200x675_PNG.png';

const Home = () => {
    const { events, loading } = useEvents();

    return (
        <div className="page home">
            <section className="hero hero-home">
                <div className="container">
                    <h1>Fever <span className="accent-text">Dream</span></h1>
                    <h2>Home of Girl-Night, All women comedy shows.</h2>
                    <p className="hero-subtext">
                        Stand-up comedy showcases and live tours across Ontario, proudly showcasing top female talent.
                    </p>
                    <div className="hero-cta-stack">
                        <a href="#shows" className="btn btn-primary">Upcoming Events</a>
                        <Link to="/comedians" className="btn btn-primary">Our Roster</Link>
                        <Link to="/fringe" className="btn btn-primary">The Curse</Link>
                        <Link to="/testimonials" className="btn btn-primary">Testimonials</Link>
                    </div>
                </div>
            </section>

            <section className="fringe-promo-banner">
                <div className="container">
                    <Link to="/fringe" className="fringe-promo-link">
                        <img 
                            src={FRINGE_POSTER_THUMB_URL} 
                            alt="The Curse of Girl Night Poster" 
                            className="fringe-banner-poster" 
                        />
                        <div className="fringe-banner-watermarks">
                            <img 
                                src={bestOfFestWatermark} 
                                alt="Best of Fest Winner" 
                                className="fringe-banner-watermark" 
                            />
                            <img 
                                src={bigBuzzWatermark} 
                                alt="Big Buzz Winner" 
                                className="fringe-banner-watermark" 
                            />
                        </div>
                        <span className="fringe-promo-title">The Curse of <em>Girl Night</em></span>
                        <span className="fringe-promo-cta">Learn More & Book →</span>
                    </Link>
                </div>
            </section>

            <UpcomingShows events={events} loading={loading} />

            <section className="trust-badges">
                <div className="container">
                    <h2>Featured in [Media] | Serving [X] Companies</h2>
                </div>
            </section>

            <section className="services-preview">
                <div className="container">
                    <h2>3 Main Services Preview</h2>
                </div>
            </section>

            <section className="about-intro">
                <div className="container">
                    <h1>Why Trust Us</h1>
                    <h2>Professional Team Bios</h2>
                    <h2>Company Story & Approach</h2>
                    <h2>Timeline of Success</h2>
                </div>
            </section>
        </div>
    );
};

export default Home;
