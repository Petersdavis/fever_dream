const Testimonials = () => {
    return (
        <div className="page testimonials">
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <h1>Social <span className="accent-text">Proof</span></h1>
                    <h2>What our clients say about the Fever Dream experience</h2>
                </div>
            </section>

            <div className="container" style={{ padding: '80px 0' }}>
                <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    <div className="testimonial-card" style={{ background: 'var(--surface-color)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '20px' }}>"The absolute highlight of our conference. Professional, hilarious, and perfectly tailored."</p>
                        <h4 className="accent-text">— Sarah Jenkins, HR Director</h4>
                    </div>
                    <div className="testimonial-card" style={{ background: 'var(--surface-color)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '20px' }}>"Video testimonials prioritize the energy they bring to the room."</p>
                        <h4 className="accent-text">— Press Highlight</h4>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '60px' }}>
                    <h2>Awards & <span className="accent-text">Recognition</span></h2>
                    <p style={{ color: 'var(--text-dim)' }}>Proudly serving the industry with award-winning talent.</p>
                </div>
            </div>
        </div>
    );
};

export default Testimonials;
