import { useEffect, useState } from 'react';
import {
  GTM_CONSENT_STATES,
  getStoredGtmConsent,
  setStoredGtmConsent,
  updateGtmConsent,
} from '../lib/gtm.js';

const CONSENT_COPY = {
  title: 'Cookie consent',
  description:
    'We use analytics and marketing cookies to measure traffic, improve the site, and support our ads.',
  acceptLabel: 'Accept cookies',
  declineLabel: 'Decline',
};

export default function CookieConsentBanner() {
  const [storedConsent, setStoredConsent] = useState(() => getStoredGtmConsent());

  useEffect(() => {
    if (!storedConsent) return;
    updateGtmConsent(storedConsent);
  }, [storedConsent]);

  const handleChoice = (consent) => {
    const normalized = setStoredGtmConsent(consent);
    setStoredConsent(normalized);
    updateGtmConsent(normalized);
  };

  if (storedConsent === GTM_CONSENT_STATES.GRANTED || storedConsent === GTM_CONSENT_STATES.DENIED) {
    return null;
  }

  return (
    <div className="cookie-consent-shell">
      <div className="subscribe-banner-card cookie-consent-card" role="dialog" aria-modal="false" aria-live="polite" aria-label={CONSENT_COPY.title}>
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
        </div>
      </div>
    </div>
  );
}
