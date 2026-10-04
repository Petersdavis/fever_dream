import { useState, useEffect, useCallback } from 'react';
import testimonialsData from '../data/testimonials.json';

export default function TestimonialsBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials = testimonialsData || [];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [isPaused, handleNext, testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <section
      className="testimonials-stream-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container">
        <div className="testimonials-stream">
          <span className="testimonials-quote-mark" aria-hidden="true">
            “
          </span>
          <div className="testimonials-track">
            {testimonials.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`testimonials-slide ${idx === currentIndex ? 'active' : ''}`}
                aria-hidden={idx !== currentIndex}
              >
                <blockquote className="testimonials-quote-text">
                  {item.quote}
                </blockquote>
                <cite className="testimonials-quote-author">
                  — {item.author || 'Anonymous'}
                </cite>
              </div>
            ))}
          </div>

          <div className="testimonials-stream-nav">
            <button
              type="button"
              onClick={handlePrev}
              className="testimonials-nav-btn"
              aria-label="Previous testimonial"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>

            <div className="testimonials-dots">
              {testimonials.map((item, idx) => (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`testimonials-dot ${idx === currentIndex ? 'active' : ''}`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="testimonials-nav-btn"
              aria-label="Next testimonial"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
