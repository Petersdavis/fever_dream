import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="page home">
            <section className="hero">
                <div className="container">
                    <h1>Fever <span className="accent-text">Dream</span></h1>
                    <h2>Live Comedy Excellence</h2>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)', maxWidth: '600px', margin: '0 auto 2rem' }}>
                        Immediate credibility through the best clips in the industry.
                    </p>
                    <button className="btn btn-primary">Book Now</button>
                </div>
            </section>

            <section className="fringe-promo-banner">
                <div className="container">
                    <Link to="/fringe" className="fringe-promo-link">
                        <span className="fringe-promo-eyebrow">✨ Now Playing at Guelph Fringe Festival</span>
                        <span className="fringe-promo-title">The Curse of <em>Girl Night</em></span>
                        <span className="fringe-promo-cta">See the Show →</span>
                    </Link>
                </div>
            </section>

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
