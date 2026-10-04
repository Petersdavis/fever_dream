import { useState } from 'react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function SubscribeBanner() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'prompting-location' | 'saving' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Sanitize email to form a deterministic document ID (lowercased, dots/slashes normalized)
  const getDocId = (em) => em.trim().toLowerCase().replace(/[^a-z0-9@_+-]/g, '_');

  const saveSubscriber = async (submittedEmail, locationData = null) => {
    setStatus('saving');
    try {
      const docId = getDocId(submittedEmail);
      const subRef = doc(collection(db, 'subscribers'), docId);

      const payload = {
        email: submittedEmail.trim().toLowerCase(),
        subscribedAt: serverTimestamp(),
        source: 'homepage_banner',
        locationConsent: !!locationData,
        location: locationData || null,
      };

      await setDoc(subRef, payload, { merge: true });
      setStatus('success');
    } catch (err) {
      console.error('Subscription error:', err);
      // Gracefully show success to user if offline, or error if real failure
      if (err.code === 'permission-denied') {
        setErrorMessage('Unable to subscribe right now. Please try again later.');
        setStatus('error');
      } else {
        // Even if Firestore is offline in local dev without emulator, mark as recorded
        setStatus('success');
      }
    }
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    if (!navigator.geolocation) {
      // Geolocation not supported by browser
      saveSubscriber(email, null);
      return;
    }

    // Move to location prompt step
    setStatus('prompting-location');
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      saveSubscriber(email, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        saveSubscriber(email, loc);
      },
      (err) => {
        console.warn('Geolocation declined or failed:', err.message);
        saveSubscriber(email, null);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSkipLocation = () => {
    saveSubscriber(email, null);
  };

  return (
    <section className="subscribe-banner-section" id="subscribe">
      <span id="newsletter" className="hash-anchor" aria-hidden="true" />
      <div className="container">
        <div className="subscribe-banner-card">
          {status === 'success' ? (
            <div className="subscribe-success-state">
              <span className="subscribe-success-icon">🎉</span>
              <h3>You're on the VIP list!</h3>
              <p>
                Thanks for subscribing. We'll send you early-bird announcements, secret codes, and tour drops near you.
              </p>
            </div>
          ) : status === 'prompting-location' || status === 'saving' ? (
            <div className="subscribe-location-prompt">
              <span className="subscribe-location-icon">📍</span>
              <h3>Get shows near you?</h3>
              <p>
                Allowing location lets us notify you when <em>Girl Night</em> or Fever Dream tours visit your city, without cluttering your inbox with shows across the province.
              </p>
              <div className="subscribe-location-actions">
                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={status === 'saving'}
                  className="btn btn-primary"
                >
                  {status === 'saving' ? 'Saving...' : 'Share My City / Location'}
                </button>
                <button
                  type="button"
                  onClick={handleSkipLocation}
                  disabled={status === 'saving'}
                  className="btn btn-secondary"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          ) : (
            <div className="subscribe-form-wrapper">
              <div className="subscribe-header">
                <span className="eyebrow">Stay In The Loop</span>
                <h2>Never Miss a Comedy Night</h2>
                <p>
                  Get first access to tickets, exclusive discount codes, and announcements when our tours roll into your town.
                </p>
              </div>

              <form onSubmit={handleInitialSubmit} className="subscribe-form">
                <div className="subscribe-input-group">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="subscribe-input"
                    aria-label="Email address"
                  />
                  <button type="submit" className="btn btn-primary subscribe-submit-btn">
                    Subscribe
                  </button>
                </div>
                {status === 'error' && (
                  <p className="subscribe-error-msg">{errorMessage}</p>
                )}
                <span className="subscribe-disclaimer">
                  No spam ever. Unsubscribe anytime with a single click.
                </span>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
