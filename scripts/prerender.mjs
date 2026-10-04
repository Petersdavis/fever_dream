import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { slugifyEvent } from '../src/lib/slugs.js';

const SITE_ORIGIN = 'https://feverdream-3bafe.web.app';
const DEFAULT_IMAGE =
  'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1191270488%2F298565748212%2F1%2Foriginal.20260817-185714?auto=format%2Ccompress&q=75&sharp=10&s=b7260001d6f9577e02f8c9ed7c09b157';

// Define the static routes, rich SEO keywords, and metadata to prerender
const STATIC_ROUTES = [
  {
    path: '/',
    title: 'Fever Dream Comedy | Live All-Women Stand-Up Comedy in Ontario',
    description: 'Home of Girl Night, Ontario\'s premier all-women stand-up comedy showcases, tours, and award-winning live comedy shows across Kitchener, Waterloo, Guelph, and beyond.',
    keywords: 'stand-up comedy Ontario, women comedy show, all-women stand-up, Girl Night comedy, comedy shows Kitchener, live comedy Guelph, comedy tour Ontario, Fever Dream Comedy',
    image: DEFAULT_IMAGE,
    changefreq: 'daily',
    priority: '1.0',
  },
  {
    path: '/comedians',
    title: 'Our Team & Comedians | Fever Dream Comedy',
    description: 'Meet the producers, founders, and featured stand-up comedians behind Fever Dream Comedy and Girl Night, featuring Renee Groux and Lindsay Endersby.',
    keywords: 'female comedians Ontario, women stand-up comics, Renee Groux, Lindsay Endersby, Girl Night producers, KW comedians, comedy talent roster',
    image: DEFAULT_IMAGE,
    changefreq: 'monthly',
    priority: '0.8',
  },
  {
    path: '/services',
    title: 'Live Comedy Booking & Private Events | Fever Dream Comedy',
    description: 'Book Girl Night on Tour, private parties, corporate events, fundraisers, and venue comedy nights tailored to your space.',
    keywords: 'hire comedians Ontario, book comedy show, corporate comedy entertainment, venue comedy night, private party comedians, bachelorette comedy show',
    image: DEFAULT_IMAGE,
    changefreq: 'monthly',
    priority: '0.8',
  },
  {
    path: '/fringe',
    title: 'The Curse of Girl Night | Award-Winning Comedy Show',
    description: 'Winner of "Best of Fest" and "Big Buzz" awards at the 2026 Guelph Fringe Festival. An original sketch and stand-up production by Fever Dream Comedy.',
    keywords: 'The Curse of Girl Night, Guelph Fringe Festival 2026, Best of Fest winner, Big Buzz award, comedy sketch show, fringe festival comedy',
    image: 'https://static.wixstatic.com/media/5bbf7f_0cc0f3f9100d4083b6dcbf17e6d4f046~mv2.png/v1/fill/w_581,h_320,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Love%20So%20Far%20Poster%20-%201200x675_PNG.png',
    changefreq: 'monthly',
    priority: '0.8',
  },
  {
    path: '/book',
    title: 'Book a Show / Inquire | Fever Dream Comedy',
    description: 'Bring an unforgettable all-women stand-up comedy show to your venue or event. Send an inquiry directly to the Fever Dream team.',
    keywords: 'book a comedy show, comedy event inquiry, contact Fever Dream Comedy, comedy bookings Kitchener Waterloo',
    image: DEFAULT_IMAGE,
    changefreq: 'monthly',
    priority: '0.9',
  },
];

async function prerender() {
  const root = process.cwd();
  const distDir = path.resolve(root, 'dist');
  const templatePath = path.resolve(distDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error('dist/index.html not found. Run client build first (vite build).');
  }

  const template = fs.readFileSync(templatePath, 'utf8');

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

  const eventRoutes = events.map((event) => {
    const slug = slugifyEvent(event);
    const dateFormatted = event.start
      ? new Date(event.start).toLocaleDateString('en-CA', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';
    const city = event.venueCity || 'Ontario';
    const venue = event.venueName || '';

    return {
      path: `/upcoming/${slug}`,
      title: `${event.title} in ${city} (${dateFormatted}) | Fever Dream Comedy`,
      description: `Get tickets for ${event.title} on ${dateFormatted} at ${venue ? `${venue}, ` : ''}${city}. Live all-women stand-up comedy presented by Fever Dream.`,
      keywords: `${event.title}, comedy tickets ${city}, ${venue}, stand up comedy Ontario, Fever Dream Comedy, Girl Night on Tour, live comedy tickets`,
      image: event.posterUrl || DEFAULT_IMAGE,
      eventData: event,
      changefreq: 'daily',
      priority: '0.9',
    };
  });

  const allRoutes = [...STATIC_ROUTES, ...eventRoutes];

  // Load the SSR bundle built by vite build --ssr
  const serverEntryPath = path.resolve(distDir, 'server/entry-server.js');
  if (!fs.existsSync(serverEntryPath)) {
    throw new Error('dist/server/entry-server.js not found. Run vite build --ssr first.');
  }

  const { render } = await import(pathToFileURL(serverEntryPath).href);

  console.log(`Prerendering ${allRoutes.length} static HTML pages (${STATIC_ROUTES.length} core pages + ${eventRoutes.length} show landing pages)...`);

  for (const route of allRoutes) {
    const { html: appHtml } = render(route.path);

    // Inject prerendered markup and customized meta tags into HTML template
    let renderedHtml = template.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`
    );

    const canonicalUrl = `${SITE_ORIGIN}${route.path === '/' ? '/' : route.path}`;

    // Generate JSON-LD Structured Data: Event schema for show pages, PerformingGroup for site
    let structuredData;
    if (route.eventData) {
      const ev = route.eventData;
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: ev.title,
        startDate: ev.startUtc || ev.start,
        endDate: ev.end || undefined,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: ev.venueName || 'Venue TBA',
          address: ev.venueAddress || ev.venueCity || 'Ontario, Canada',
        },
        image: ev.posterUrl ? [ev.posterUrl] : [DEFAULT_IMAGE],
        description: ev.summary || route.description,
        offers: ev.ticketUrl ? {
          '@type': 'Offer',
          url: ev.ticketUrl,
          price: ev.priceValue ? (ev.priceValue / 100).toFixed(2) : undefined,
          priceCurrency: ev.currency || 'CAD',
          availability: 'https://schema.org/InStock',
          validFrom: ev.createdAt || undefined,
        } : undefined,
        performer: {
          '@type': 'PerformingGroup',
          name: 'Fever Dream Comedy',
          sameAs: 'https://www.eventbrite.com/o/fever-dream-comedy-45265374033',
        },
        organizer: {
          '@type': 'Organization',
          name: 'Fever Dream Comedy',
          url: SITE_ORIGIN,
        },
      };
    } else {
      structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'PerformingGroup',
            '@id': `${SITE_ORIGIN}/#organization`,
            name: 'Fever Dream Comedy',
            alternateName: ['Girl Night Comedy', 'Fever Dream Comedy KW'],
            url: SITE_ORIGIN,
            description: route.description,
            image: route.image,
            sameAs: [
              'https://www.facebook.com/feverdreamcomedy/',
              'https://www.instagram.com/feverdreamcomedyshow/',
              'https://www.eventbrite.com/o/fever-dream-comedy-45265374033',
            ],
            areaServed: {
              '@type': 'AdministrativeArea',
              name: 'Ontario, Canada',
            },
            genre: ['Stand-up comedy', 'Sketch comedy', 'Live Entertainment'],
            founder: [
              {
                '@type': 'Person',
                name: 'Renee Groux',
                jobTitle: 'Co-Producer & Comedian',
                sameAs: [
                  'https://www.youtube.com/@ReneeGroux',
                  'https://www.instagram.com/reneegroux/',
                ],
              },
              {
                '@type': 'Person',
                name: 'Lindsay Endersby',
                jobTitle: 'Co-Producer & Comedian',
                sameAs: [
                  'https://www.instagram.com/lindsayendersby/',
                ],
              },
            ],
          },
          {
            '@type': 'WebSite',
            '@id': `${SITE_ORIGIN}/#website`,
            url: SITE_ORIGIN,
            name: 'Fever Dream Comedy',
            publisher: { '@id': `${SITE_ORIGIN}/#organization` },
          },
        ],
      };
    }

    const metaTags = `<title>${route.title}</title>
    <meta name="description" content="${route.description}" />
    <meta name="keywords" content="${route.keywords}" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph / Facebook / Meta -->
    <meta property="og:type" content="${route.eventData ? 'event' : 'website'}" />
    <meta property="og:site_name" content="Fever Dream Comedy" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:image" content="${route.image}" />
    <meta property="og:locale" content="en_CA" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${route.title}" />
    <meta name="twitter:description" content="${route.description}" />
    <meta name="twitter:image" content="${route.image}" />

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
    </script>`;

    // Inject route-specific title and meta description
    renderedHtml = renderedHtml.replace(
      /<title>.*?<\/title>/i,
      metaTags
    );

    const outDir = route.path === '/'
      ? distDir
      : path.join(distDir, route.path.replace(/^\//, ''));

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const filePath = path.join(outDir, 'index.html');
    fs.writeFileSync(filePath, renderedHtml, 'utf8');
    console.log(`✓ Prerendered: ${route.path} -> ${path.relative(root, filePath)}`);
  }

  // Dynamically generate sitemap.xml with all static pages and all show landing pages
  console.log('Generating dynamic sitemap.xml with all upcoming shows...');
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map((r) => {
    const loc = `${SITE_ORIGIN}${r.path === '/' ? '/' : r.path}`;
    return `  <url>
    <loc>${loc}</loc>
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
