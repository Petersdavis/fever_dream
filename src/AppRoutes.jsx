import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import Comedians from './pages/Comedians';
import Book from './pages/Book';
import Fringe from './pages/Fringe';
import Admin from './pages/Admin';
import ShowDetail from './pages/ShowDetail';

function LegacyShowsRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/upcoming/${slug}`} replace />;
}

export const routes = (
  <Routes>
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="upcoming/:slug" element={<ShowDetail />} />
      <Route path="shows/:slug" element={<LegacyShowsRedirect />} />
      <Route path="services" element={<Services />} />
      <Route path="fringe" element={<Fringe />} />
      <Route path="comedians" element={<Comedians />} />
      <Route path="testimonials" element={<Navigate to="/" replace />} />
      <Route path="about" element={<Navigate to="/comedians" replace />} />
      <Route path="book" element={<Book />} />
      <Route path="admin" element={<Admin />} />
    </Route>
  </Routes>
);

export default function AppRoutes() {
  return routes;
}
