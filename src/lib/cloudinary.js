const DEFAULT_CLOUD_NAME = 'hl4vdi8n';

function readEnv(key) {
  try {
    return import.meta?.env?.[key] || '';
  } catch {
    return globalThis?.process?.env?.[key] || '';
  }
}

export function getCloudinaryCloudName(explicitCloudName = '') {
  return (
    explicitCloudName ||
    readEnv('VITE_CLOUDINARY_CLOUD_NAME') ||
    readEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME') ||
    DEFAULT_CLOUD_NAME ||
    ''
  );
}

function isRemoteUrl(src) {
  return /^https?:\/\//i.test(src);
}

function isDataOrBlobUrl(src) {
  return /^(data:|blob:)/i.test(src);
}

function getSiteOrigin() {
  return (
    readEnv('VITE_SITE_URL') ||
    readEnv('NEXT_PUBLIC_SITE_URL') ||
    globalThis?.location?.origin ||
    ''
  );
}

function resolveFetchSource(src) {
  if (isRemoteUrl(src)) return src;
  if (isDataOrBlobUrl(src)) return src;

  const origin = getSiteOrigin();
  if (!origin) return src;

  return new URL(src, origin).toString();
}

export function remapToCloudinary(src, { cloudName = '' } = {}) {
  if (!src || typeof src !== 'string') return src;

  const resolvedCloudName = getCloudinaryCloudName(cloudName);
  if (!resolvedCloudName) return src;

  const fetchSrc = resolveFetchSource(src);
  if (!fetchSrc || isDataOrBlobUrl(fetchSrc)) return src;

  const encodedSrc = encodeURIComponent(fetchSrc);
  return `https://res.cloudinary.com/${resolvedCloudName}/image/fetch/f_auto,q_auto/${encodedSrc}`;
}
