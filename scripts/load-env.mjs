/**
 * load-env.mjs — Minimal `.env` loader for plain Node scripts.
 *
 * Vite loads `.env*` files automatically for the app and config, but the
 * prerender and verification scripts run as plain Node processes and therefore
 * do not see those values. This helper parses the standard Vite env files
 * (`.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local`) and populates
 * `process.env` for any keys that are not already set.
 *
 * It intentionally does NOT override values already present in `process.env`,
 * so CI-provided variables (e.g. GitHub Actions `vars.*`) always win.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Parse a single `.env` file into a key/value map.
 * Supports `KEY=value`, `export KEY=value`, `#` comments, and single/double
 * quoted values. This is a deliberately small subset of dotenv syntax.
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    let key = line.slice(0, eq).trim();
    if (key.startsWith('export ')) key = key.slice('export '.length).trim();

    let value = line.slice(eq + 1).trim();
    // Strip matching surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) out[key] = value;
  }
  return out;
}

/**
 * Load Vite-style env files into `process.env` without overriding existing keys.
 * @param {string} [root] - Project root (defaults to cwd).
 * @param {string} [mode] - Vite mode (defaults to NODE_ENV or 'production').
 * @returns {Record<string, string>} The merged values that were loaded.
 */
export function loadEnv(root = process.cwd(), mode = process.env.NODE_ENV || 'production') {
  const files = [
    '.env',
    '.env.local',
    `.env.${mode}`,
    `.env.${mode}.local`,
  ];

  const merged = {};
  for (const file of files) {
    Object.assign(merged, parseEnvFile(path.resolve(root, file)));
  }

  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return merged;
}

export default loadEnv;
