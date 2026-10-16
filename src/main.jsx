import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initMetaPixel } from './lib/tracking.js'

// Publish the Meta Pixel id to the dataLayer before the app renders so GTM can
// load the pixel and fire the initial PageView in the correct order. No-ops when
// VITE_META_PIXEL_ID is unset (docs/tracking.md §8).
initMetaPixel();

const container = document.getElementById('root');

if (container.hasChildNodes()) {
  hydrateRoot(
    container,
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
