import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    // Track the route the menu was opened on so a navigation closes it without
    // calling setState synchronously inside an effect (react-hooks rule).
    const [menuRoute, setMenuRoute] = useState(location.pathname);

    const navItems = [
        { name: 'Our Comedians', path: '/comedians' },
        { name: 'Services', path: '/services' },
        { name: 'Book', path: '/book' },
    ];

    // Close mobile menu whenever route changes (derived during render).
    if (isOpen && menuRoute !== location.pathname) {
        setIsOpen(false);
        setMenuRoute(location.pathname);
    }

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Prevent background scrolling when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo" onClick={() => setIsOpen(false)}>
                    Fever Dream
                </Link>

                <button
                    type="button"
                    className={`nav-hamburger ${isOpen ? 'active' : ''}`}
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isOpen}
                    aria-controls="nav-menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>

                <ul id="nav-menu" className={`nav-menu ${isOpen ? 'open' : ''}`}>
                    {navItems.map((item) => (
                        <li key={item.name} className="nav-item">
                            <NavLink
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    isActive ? "nav-link active" : "nav-link"
                                }
                            >
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {isOpen && (
                    <div
                        className="nav-backdrop"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                )}
            </div>
        </nav>
    );
};

export default Navbar;
