const Book = () => {
    return (
        <div className="page book">
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <h1>Let's <span className="accent-text">Talk</span></h1>
                    <h2>Easy conversion for your next event</h2>
                </div>
            </section>

            <div className="container" style={{ padding: '80px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px' }}>
                    <div className="booking-form-container">
                        <h2 style={{ color: 'white' }}>Inquiry Form</h2>
                        <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Event Type" style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
                            <input type="date" style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
                            <input type="text" placeholder="Budget Range" style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
                            <button type="button" className="btn btn-primary">Send Inquiry</button>
                        </form>
                    </div>
                    <div className="faq-contact">
                        <h2 style={{ color: 'white' }}>Common Concerns</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>FAQ addressing common concerns about booking and logistics.</p>

                        <h2 style={{ color: 'white' }}>Contact</h2>
                        <p>Email: hello@feverdream.com</p>
                        <p>Hours: Mon - Fri, 9am - 5pm</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Book;
