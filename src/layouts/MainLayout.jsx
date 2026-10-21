import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';
import RouteTracker from '../components/RouteTracker';
import CookieConsentBanner from '../components/CookieConsentBanner';

const MainLayout = () => {
    return (
        <div className="layout">
            <RouteTracker />
            <BackgroundBubbles />
            <Navbar />
            <main className="main-content">
                <Outlet />
            </main>
            <CookieConsentBanner />
            <footer className="footer">
                <div className="container footer-container">
                    <div className="footer-brand">
                        <span className="footer-logo">Fever Dream Comedy</span>
                        <p className="footer-tagline">
                            Ontario&apos;s comedy production company featuring up-and-coming and professional female comics — home of <em>Girl Night</em> live shows, corporate events.
                        </p>
                    </div>

                    <div className="footer-socials">
                        <span className="footer-socials-label">Connect with Us:</span>
                        <div className="footer-social-links">
                            <a
                                href="https://www.instagram.com/feverdreamcomedyshow/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-social-link"
                                title="Fever Dream Comedy Instagram"
                            >
                                Instagram ↗
                            </a>
                            <a
                                href="https://www.facebook.com/feverdreamcomedy/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-social-link"
                                title="Fever Dream Comedy Facebook"
                            >
                                Facebook ↗
                            </a>
                            <a
                                href="https://www.eventbrite.com/o/fever-dream-comedy-45265374033"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-social-link"
                                title="Fever Dream Comedy Eventbrite"
                            >
                                Eventbrite ↗
                            </a>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>
                            &copy; {new Date().getFullYear()} Fever Dream Comedy. Producing live stand-up across Kitchener-Waterloo, Guelph, London, and Southwestern Ontario. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
