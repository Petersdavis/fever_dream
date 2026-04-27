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
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} Fever Dream. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
