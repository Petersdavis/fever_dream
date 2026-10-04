import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import SocialProofBanner from '../components/SocialProofBanner';
import testimonials from '../data/testimonials.json';

const Testimonials = () => {
    return (
        <div className="page testimonials">
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <h1>Audience & <span className="accent-text">Partner Reviews</span></h1>
                    <h2>What venues, audiences, and event partners say about Fever Dream</h2>
                </div>
            </section>

            <div className="container" style={{ padding: '60px 0 80px' }}>
                <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    {testimonials.map((t) => (
                        <div key={t.id} className="testimonial-card" style={{ background: 'var(--surface-color)', padding: '36px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <StarRating rating={5} size={16} />
                            </div>
                            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '24px', flex: 1, lineHeight: '1.6' }}>
                                "{t.quote}"
                            </p>
                            <h4 className="accent-text" style={{ margin: 0, fontSize: '0.95rem' }}>
                                — {t.author || 'Anonymous'}
                            </h4>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '60px' }}>
                    <SocialProofBanner />
                </div>

                <div style={{ textAlign: 'center', marginTop: '60px' }}>
                    <h2>Ready to Bring the Laughs to <span className="accent-text">Your Venue?</span></h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>Let's organize a memorable comedy night tailored to your space.</p>
                    <Link to="/book" className="btn btn-primary">Book a Show / Inquire</Link>
                </div>
            </div>
        </div>
    );
};

export default Testimonials;
