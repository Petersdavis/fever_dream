import { useEffect, useState } from 'react';
import {
  GTM_CONSENT_STATES,
  clearStoredGtmConsent,
  getStoredGtmConsent,
  setStoredGtmConsent,
  syncStoredGtmConsent,
  updateGtmConsent,
} from '../lib/gtm.js';

const CONSENT_COPY = {
  title: 'Cookie consent',
  description:
    'We use analytics and marketing cookies to measure traffic, improve the site, and support our ads. Accept to enable those tags, or decline to keep them off.',
  acceptLabel: 'Accept cookies',
  declineLabel: 'Decline',
  manageLabel: 'Manage cookies',
};

export default function CookieConsentBanner() {
  const [storedConsent, setStoredConsent] = useState(() => getStoredGtmConsent());
  const [isVisible, setIsVisible] = useState(() => !getStoredGtmConsent());

  useEffect(() => {
    if (storedConsent) {
      syncStoredGtmConsent();
    }
  }, [storedConsent]);

  const handleChoice = (consent) => {
    const normalized = setStoredGtmConsent(consent);
    setStoredConsent(normalized);
    updateGtmConsent(normalized);
    setIsVisible(false);
  };

  const handleReset = () => {
    clearStoredGtmConsent();
    setStoredConsent('');
    setIsVisible(true);
    updateGtmConsent(GTM_CONSENT_STATES.DENIED);
  };

  if (!isVisible && !storedConsent) {
    return null;
  }

  if (!isVisible && storedConsent) {
    return (
      <button type="button" className="cookie-consent-launcher" onClick={() => setIsVisible(true)}>
        Cookie settings
      </button>
    );
  }

  return (
    <div className="cookie-consent" role="dialog" aria-modal="false" aria-live="polite" aria-label={CONSENT_COPY.title}>
      <div className="cookie-consent__content">
        <div>
          <p className="cookie-consent__eyebrow">{CONSENT_COPY.title}</p>
          <p className="cookie-consent__description">{CONSENT_COPY.description}</p>
        </div>

        <div className="cookie-consent__actions">
          <button
            type="button"
            className="btn btn-primary cookie-consent__button"
            onClick={() => handleChoice(GTM_CONSENT_STATES.GRANTED)}
          >
            {CONSENT_COPY.acceptLabel}
          </button>
          <button
            type="button"
            className="btn btn-secondary cookie-consent__button"
            onClick={() => handleChoice(GTM_CONSENT_STATES.DENIED)}
          >
            {CONSENT_COPY.declineLabel}
          </button>
          <button type="button" className="cookie-consent__link" onClick={handleReset}>
            {CONSENT_COPY.manageLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
