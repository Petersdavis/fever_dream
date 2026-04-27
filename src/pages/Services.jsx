const Services = () => {
    return (
        <div className="page services">
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <h1>What <span className="accent-text">We Offer</span></h1>
                    <h2>Elevating your events through laughter</h2>
                </div>
            </section>

            <div className="container" style={{ padding: '80px 0' }}>
                <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    <div className="service-category" style={{ background: 'var(--surface-color)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 className="accent-text">Corporate Events</h2>
                        <p style={{ color: 'var(--text-dim)' }}>Holiday parties, conferences, and award galas designed to engage your team.</p>
                    </div>
                    <div className="service-category" style={{ background: 'var(--surface-color)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 className="accent-text">Private Events</h2>
                        <p style={{ color: 'var(--text-dim)' }}>Unforgettable weddings and milestone birthdays with premium talent.</p>
                    </div>
                    <div className="service-category" style={{ background: 'var(--surface-color)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 className="accent-text">Specialized</h2>
                        <p style={{ color: 'var(--text-dim)' }}>Custom writing, comedy workshops, and professional emcees.</p>
                    </div>
                </div>
                <div className="pricing" style={{ textAlign: 'center', marginTop: '60px' }}>
                    <h2>Clear Process & <span className="accent-text">Pricing Guide</span></h2>
                    <button className="btn btn-primary">Download Guide</button>
                </div>
            </div>
        </div>
    );
};

export default Services;
