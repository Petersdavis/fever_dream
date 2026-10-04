import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';

const MainLayout = () => {
    return (
        <div className="layout">
            <BackgroundBubbles />
            <Navbar />
            <main className="main-content">
                <Outlet />
            </main>
            <footer className="footer">
                <div className="container footer-container">
                    <div className="footer-brand">
                        <span className="footer-logo">Fever Dream Comedy</span>
                        <p className="footer-tagline">
                            Home of <em>Girl Night</em> — Ontario's premier all-women comedy showcases and live productions.
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
                                title="Fever Dream Instagram"
                            >
                                Instagram ↗
                            </a>
                            <a
                                href="https://www.facebook.com/feverdreamcomedy/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-social-link"
                                title="Fever Dream Facebook"
                            >
                                Facebook ↗
                            </a>
                            <a
                                href="https://www.eventbrite.com/o/fever-dream-comedy-45265374033"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-social-link"
                                title="Fever Dream Eventbrite"
                            >
                                Eventbrite ↗
                            </a>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Fever Dream Comedy. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
