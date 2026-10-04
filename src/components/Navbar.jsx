import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
    const navItems = [
        { name: 'Our Comedians', path: '/comedians' },
        { name: 'Services', path: '/services' },
        { name: 'Book', path: '/book' },
    ];

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    Fever Dream
                </Link>
                <ul className="nav-menu">
                    {navItems.map((item) => (
                        <li key={item.name} className="nav-item">
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive ? "nav-link active" : "nav-link"
                                }
                            >
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
