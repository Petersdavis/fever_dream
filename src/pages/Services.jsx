import BookingForm from '../components/BookingForm';

const Services = () => {
    return (
        <div className="page services-page">
            {/* Hero */}
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <h1>Girl Night <span className="accent-text">on Tour!</span></h1>
                    <h2>Comedy. Community. Your venue.</h2>
                </div>
            </section>

            {/* Service Cards */}
            <div className="container" style={{ padding: '80px 0 40px' }}>
                <div className="services-grid">

                    {/* Girl Night on Tour */}
                    <div className="service-card">
                        <div className="service-card-icon">🎤</div>
                        <h2 className="service-card-title">
                            Girl Night <span className="accent-text">on Tour</span>
                        </h2>
                        <p className="service-card-body">
                            Are you interested in hosting Girl Night on Tour at your venue? Email us for
                            the deets! Girl Night is more than a comedy show; it's a community-building
                            event carefully adapted to your venue's specifications. For one night, hosts
                            Lindsay and Renee can transform your venue into a comedy club and the ultimate
                            ladies' night out!
                        </p>
                    </div>

                    {/* Corporate Package */}
                    <div className="service-card">
                        <div className="service-card-icon">💼</div>
                        <h2 className="service-card-title">
                            Corporate <span className="accent-text">Package</span>
                        </h2>
                        <p className="service-card-body">
                            With our corporate package, Fever Dream Comedy allows you access to our roster
                            of talented comedians delivering hilarious comedy by women — enjoyed by all!
                            Our performers provide comedy tailored to your event needs, and hosts Lindsay
                            and Renee promise uplifting vibes and a safe, welcoming atmosphere.
                        </p>
                    </div>

                    {/* Private Parties */}
                    <div className="service-card">
                        <div className="service-card-icon">🎉</div>
                        <h2 className="service-card-title">
                            Private <span className="accent-text">Parties</span>
                        </h2>
                        <p className="service-card-body">
                            From birthdays to bachelorette parties, small business holiday parties and
                            more — Fever Dream Comedy is your single-stop for entertainment. We take your
                            party specifications and craft your perfect-fit lineup of women comedians to
                            make your special night extraordinary.
                        </p>
                    </div>
                </div>

                {/* Book Us Section */}
                <div className="services-cta-banner">
                    <p className="services-cta-label">Ready to make your event unforgettable?</p>
                    <div className="services-cta-form">
                        <BookingForm />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Services;
