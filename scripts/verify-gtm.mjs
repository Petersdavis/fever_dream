/**
 * verify-gtm.mjs — Smoke-test the injected Google Tag Manager snippet.
 *
 * Run after `npm run build`:
 *   node scripts/verify-gtm.mjs
 *
 * What it checks (docs/tracking.md §7):
 *  1. The container id is configured (VITE_GTM_CONTAINER_ID).
 *  2. The GTM loader snippet is present in dist/index.html.
 *  3. The GTM `<noscript>` fallback is present in dist/index.html.
 *  4. Consent Mode v2 defaults are emitted with all signals `denied`.
 *  5. Every prerendered page under dist/ carries the container snippet.
 *  6. The loader is async (never blocks initial render).
 *
 * Exit code is non-zero on any failure so it can gate CI.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getGtmContainerId } from '../src/lib/gtm.js';
import { loadEnv } from './load-env.mjs';

const root = process.cwd();

// Populate process.env from .env* files so the container id is visible here.
loadEnv(root, process.env.NODE_ENV || 'production');

const distDir = path.resolve(root, 'dist');

const failures = [];
const passes = [];

function check(label, condition, detail = '') {
  if (condition) {
    passes.push(label);
  } else {
    failures.push(detail ? `${label} — ${detail}` : label);
  }
}

function walkHtmlFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkHtmlFiles(full));
    } else if (entry.isFile() && entry.name === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

const containerId = getGtmContainerId();

if (!containerId) {
  console.log(
    'ℹ VITE_GTM_CONTAINER_ID is not set. Nothing to verify — the container is ' +
      'intentionally disabled in this build.'
  );
  process.exit(0);
}

console.log(`Verifying GTM container ${containerId} in ${path.relative(root, distDir)}/ ...\n`);

const rootIndexPath = path.join(distDir, 'index.html');
check('dist/index.html exists', fs.existsSync(rootIndexPath));

if (fs.existsSync(rootIndexPath)) {
  const html = fs.readFileSync(rootIndexPath, 'utf8');

  check(
    'GTM loader snippet present in dist/index.html',
    html.includes('googletagmanager.com/gtm.js')
  );
  check(
    'GTM container id embedded in dist/index.html',
    html.includes(containerId)
  );
  check(
    'GTM <noscript> fallback present in dist/index.html',
    html.includes('googletagmanager.com/ns.html')
  );
  check(
    'Consent Mode v2 default-denied emitted',
    html.includes("gtag('consent', 'default'") &&
      html.includes("ad_storage: 'denied'") &&
      html.includes("analytics_storage: 'denied'")
  );
  check(
    'GTM loader is async (non-blocking)',
    /j\.async\s*=\s*true/.test(html)
  );
}

// Every prerendered page must carry the snippet.
const htmlFiles = walkHtmlFiles(distDir);
check('At least one prerendered HTML page found', htmlFiles.length > 0);

let missing = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('googletagmanager.com/gtm.js')) {
    missing += 1;
    failures.push(`Missing GTM snippet: ${path.relative(root, file)}`);
  }
}
check(
  `All ${htmlFiles.length} prerendered page(s) carry the GTM snippet`,
  missing === 0
);

console.log(`Passed ${passes.length} check(s):`);
for (const p of passes) console.log(`  ✓ ${p}`);

if (failures.length > 0) {
  console.error(`\nFailed ${failures.length} check(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log('\n✓ GTM smoke-test passed.');
