import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Node-context files: build config, scripts, and the SSR-safe tracking/GTM
    // modules that read `process.env` when running outside Vite.
    files: [
      'vite.config.js',
      'scripts/**/*.mjs',
      'src/lib/gtm.js',
      'src/lib/tracking.js',
      'src/lib/metaPixel.js',
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
])
