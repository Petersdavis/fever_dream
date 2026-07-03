import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import Comedians from './pages/Comedians';
import Testimonials from './pages/Testimonials';
import Book from './pages/Book';
import About from './pages/About';
import Fringe from './pages/Fringe';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="fringe" element={<Fringe />} />
          <Route path="comedians" element={<Comedians />} />
          <Route path="testimonials" element={<Testimonials />} />
          <Route path="about" element={<About />} />
          <Route path="book" element={<Book />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
