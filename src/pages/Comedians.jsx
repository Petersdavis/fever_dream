const Comedians = () => {
    return (
        <div className="page comedians">
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <h1>Our <span className="accent-text">Comedians</span></h1>
                    <h2>World-class talent for world-class events</h2>
                </div>
            </section>

            <div className="container" style={{ padding: '80px 0' }}>
                <div className="filters" style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-dim)' }}>[ Filterable roster by style or industry ]</p>
                </div>

                <div className="comedians-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                    <div className="comedian-card" style={{ background: 'var(--surface-color)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                        <div style={{ width: '100px', height: '100px', background: 'var(--primary-dark)', borderRadius: '50%', margin: '0 auto 20px' }}></div>
                        <h3 className="accent-text">Talent Name</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>[ Professional clips & credits ]</p>
                        <p style={{ fontStyle: 'italic', marginTop: '15px' }}>"Brilliant performance, exactly what we needed!"</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Comedians;
