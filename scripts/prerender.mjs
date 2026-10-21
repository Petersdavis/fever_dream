import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getGtmContainerId } from '../src/lib/gtm.js';
import {
  SITE_ORIGIN,
  STATIC_ROUTES,
  buildEventRouteSeo,
  buildStructuredData,
  escapeHtml,
} from '../src/lib/seo.js';
import { loadEnv } from './load-env.mjs';

// Populate process.env from .env* files so the GTM guard below can see
// VITE_GTM_CONTAINER_ID (Vite only loads these for the app/config, not here).
loadEnv(process.cwd(), process.env.NODE_ENV || 'production');

async function prerender() {
  const root = process.cwd();
  const distDir = path.resolve(root, 'dist');
  const templatePath = path.resolve(distDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error('dist/index.html not found. Run client build first (vite build).');
  }

  const template = fs.readFileSync(templatePath, 'utf8');

  // Verify the GTM container snippet survived the client build. The snippet is
  // injected by scripts/vite-plugin-gtm.mjs during `vite build`, so it must be
  // present in dist/index.html before we clone it into every prerendered page.
  const gtmContainerId = getGtmContainerId();
  if (gtmContainerId) {
    if (!template.includes('googletagmanager.com/gtm.js')) {
      throw new Error(
        `GTM container id "${gtmContainerId}" is configured but the container ` +
          'snippet is missing from dist/index.html. Check scripts/vite-plugin-gtm.mjs.'
      );
    }
    console.log(`✓ GTM container ${gtmContainerId} detected in build template.`);
  } else {
    console.log('ℹ No VITE_GTM_CONTAINER_ID configured — skipping GTM injection.');
  }

  // Load events from src/data/events.json to dynamically build show landing pages
  const eventsFile = path.resolve(root, 'src/data/events.json');
  let events = [];
  if (fs.existsSync(eventsFile)) {
    try {
      events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
    } catch (err) {
      console.warn('Could not read events.json for prerendering:', err.message);
    }
  }

  const eventRoutes = events.map((event) => buildEventRouteSeo(event));
  const allRoutes = [...STATIC_ROUTES, ...eventRoutes];

  // Load the SSR bundle built by vite build --ssr
  const serverEntryPath = path.resolve(distDir, 'server/entry-server.js');
  if (!fs.existsSync(serverEntryPath)) {
    throw new Error('dist/server/entry-server.js not found. Run vite build --ssr first.');
  }

  const { render } = await import(pathToFileURL(serverEntryPath).href);

  console.log(
    `Prerendering ${allRoutes.length} static HTML pages (${STATIC_ROUTES.length} core pages + ${eventRoutes.length} show landing pages)...`
  );

  for (const route of allRoutes) {
    const { html: appHtml } = render(route.path);

    // Inject prerendered markup and customized meta tags into HTML template
    let renderedHtml = template.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`
    );

    const canonicalUrl = `${SITE_ORIGIN}${route.path === '/' ? '/' : route.path}`;
    const structuredData = buildStructuredData(route);

    const safeTitle = escapeHtml(route.title);
    const safeDescription = escapeHtml(route.description);
    const safeKeywords = escapeHtml(route.keywords);
    const safeImage = escapeHtml(route.image);

    const metaTags = `<title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta name="keywords" content="${safeKeywords}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="geo.region" content="CA-ON" />
    <meta name="geo.placename" content="Kitchener-Waterloo, Southwestern Ontario" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph / Facebook / Meta -->
    <meta property="og:type" content="${route.eventData ? 'event' : 'website'}" />
    <meta property="og:site_name" content="Fever Dream Comedy" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:alt" content="${safeTitle}" />
    <meta property="og:locale" content="en_CA" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />
    <meta name="twitter:image:alt" content="${safeTitle}" />

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
    </script>`;

    // Inject route-specific title and meta description (replacing fallback title + description in index.html)
    renderedHtml = renderedHtml.replace(
      /<title>[\s\S]*?<\/title>(?:\s*<meta\s+name="description"[^>]*>)?/i,
      metaTags
    );

    const outDir =
      route.path === '/'
        ? distDir
        : path.join(distDir, route.path.replace(/^\//, ''));

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Guard: every prerendered page must retain the GTM container snippet so
    // tags fire on static HTML before hydration (docs/tracking.md §7).
    if (gtmContainerId && !renderedHtml.includes('googletagmanager.com/gtm.js')) {
      throw new Error(
        `GTM snippet missing from prerendered page "${route.path}". ` +
          'The container must load on all public pages.'
      );
    }

    const filePath = path.join(outDir, 'index.html');
    fs.writeFileSync(filePath, renderedHtml, 'utf8');
    console.log(`✓ Prerendered: ${route.path} -> ${path.relative(root, filePath)}`);
  }

  // Dynamically generate sitemap.xml with all static pages and all show landing pages
  console.log('Generating dynamic sitemap.xml with all upcoming shows...');
  const todayIso = new Date().toISOString().split('T')[0];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map((r) => {
    const loc = `${SITE_ORIGIN}${r.path === '/' ? '/' : r.path}`;
    const lastmod = r.lastmod || todayIso;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq || 'daily'}</changefreq>
    <priority>${r.priority || '0.8'}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>
`;

  // Write sitemap to both dist and public
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.resolve(root, 'public/sitemap.xml'), sitemapXml, 'utf8');
  console.log(`✓ Generated sitemap.xml containing ${allRoutes.length} indexed URLs.`);

  // Clean up server build folder from dist so it is not deployed to hosting
  const serverDir = path.resolve(distDir, 'server');
  if (fs.existsSync(serverDir)) {
    fs.rmSync(serverDir, { recursive: true, force: true });
  }

  console.log('All static pages and upcoming show landing pages successfully prerendered.');
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
