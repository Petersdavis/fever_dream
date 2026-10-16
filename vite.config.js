import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import gtmPlugin from './scripts/vite-plugin-gtm.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env / .env.local / .env.[mode] files from the project root. Vite does
  // not expose these to the config's own module graph, so we read them here and
  // hand the resolved values to the GTM plugin explicitly.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      gtmPlugin({
        containerId: env.VITE_GTM_CONTAINER_ID,
        envAuth: env.VITE_GTM_ENV_AUTH,
        envPreview: env.VITE_GTM_ENV_PREVIEW,
      }),
    ],
  }
})
