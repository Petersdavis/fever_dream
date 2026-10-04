import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Define the static routes and SEO metadata to prerender
const ROUTES = [
  {
    path: '/',
    title: 'Fever Dream Comedy | Live All-Women Stand-Up Shows in Ontario',
    description: 'Home of Girl Night, Ontario\'s premier all-women stand-up comedy showcases, tours, and award-winning live entertainment.',
  },
  {
    path: '/comedians',
    title: 'Our Team & Comedians | Fever Dream Comedy',
    description: 'Meet the producers, founders, and featured stand-up comedians of Fever Dream Comedy and Girl Night.',
  },
  {
    path: '/services',
    title: 'Live Comedy Booking & Services | Fever Dream Comedy',
    description: 'Book Girl Night on Tour, private events, corporate showcases, or custom comedy productions across Ontario.',
  },
  {
    path: '/fringe',
    title: 'The Curse of Girl Night | Award-Winning Comedy Show',
    description: 'Winner of "Best of Fest" and "Big Buzz" awards at the 2026 Guelph Fringe Festival. Book this acclaimed sketch & stand-up show.',
  },
  {
    path: '/book',
    title: 'Book Fever Dream Comedy | Event Inquiries',
    description: 'Bring an unforgettable all-women comedy night to your venue, corporate function, or festival.',
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

  // Load the SSR bundle built by vite build --ssr
  const serverEntryPath = path.resolve(distDir, 'server/entry-server.js');
  if (!fs.existsSync(serverEntryPath)) {
    throw new Error('dist/server/entry-server.js not found. Run vite build --ssr first.');
  }

  const { render } = await import(pathToFileURL(serverEntryPath).href);

  console.log('Prerendering static HTML for SEO...');

  for (const route of ROUTES) {
    const { html: appHtml } = render(route.path);

    // Inject prerendered markup and customized meta tags into HTML template
    let renderedHtml = template.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`
    );

    // Inject route-specific title and meta description
    renderedHtml = renderedHtml.replace(
      /<title>.*?<\/title>/i,
      `<title>${route.title}</title>
    <meta name="description" content="${route.description}" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:type" content="website" />`
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

  // Clean up server build folder from dist so it is not deployed to hosting
  const serverDir = path.resolve(distDir, 'server');
  if (fs.existsSync(serverDir)) {
    fs.rmSync(serverDir, { recursive: true, force: true });
  }

  console.log('All static pages successfully prerendered with pre-fetched Firestore/Eventbrite data.');
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
