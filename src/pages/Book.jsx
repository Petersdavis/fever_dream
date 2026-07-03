import BookingForm from '../components/BookingForm';

const Book = () => {
    return (
        <div className="page book">
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <h1>Let's <span className="accent-text">Talk</span></h1>
                    <h2>Easy conversation for your next event</h2>
                </div>
            </section>

            <div className="container" style={{ padding: '80px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px' }}>
                    <BookingForm />
                    <div className="faq-contact">
                        <h2 style={{ color: 'white' }}>Common Concerns</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>FAQ addressing common concerns about booking and logistics.</p>

                        <h2 style={{ color: 'white' }}>Contact</h2>
                        <p>Email: <a href="mailto:feverdreamcomedykw@gmail.com" style={{ color: 'var(--accent-color)' }}>feverdreamcomedykw@gmail.com</a></p>
                        <p>Hours: Mon - Fri, 9am - 5pm</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Book;
