import { slugifyEvent } from './slugs.js';

export const SITE_ORIGIN = 'https://feverdream-3bafe.web.app';

export const DEFAULT_IMAGE =
  'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F1191270488%2F298565748212%2F1%2Foriginal.20260817-185714?auto=format%2Ccompress&q=75&sharp=10&s=b7260001d6f9577e02f8c9ed7c09b157';

export const FRINGE_POSTER_IMAGE =
  'https://static.wixstatic.com/media/5bbf7f_0cc0f3f9100d4083b6dcbf17e6d4f046~mv2.png/v1/fill/w_581,h_320,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Love%20So%20Far%20Poster%20-%201200x675_PNG.png';

export const SOUTHWESTERN_ONTARIO_CITIES = [
  'Kitchener',
  'Waterloo',
  'Cambridge',
  'Guelph',
  'Stratford',
  'Elora',
  'London',
  'Hamilton',
  'Brantford',
  'Woodstock',
];

export const BOOKING_FAQS = [
  {
    question: 'What types of comedy shows and services does Fever Dream Comedy offer?',
    answer:
      'Fever Dream Comedy is a full-service comedy production company in Southwestern Ontario with multiple offerings: public live showcases and tours (Girl Night on Tour), turnkey corporate events and team-building entertainment, private parties (bachelorettes, birthdays, fundraisers), original festival/sketch productions, and live comedy recordings (specials and comedy albums).',
  },
  {
    question: 'Who performs on Fever Dream Comedy lineups?',
    answer:
      'We specialize in featuring a curated blend of professional female headliners—as seen on SiriusXM, Just For Laughs, CBC, and Don’t Tell Comedy—alongside standout up-and-coming women comics from Southwestern Ontario and across Canada. Every show is hosted and produced by comedians Renee Groux and Lindsay Endersby.',
  },
  {
    question: 'What does our venue or company need to provide to host a show?',
    answer:
      'We make hosting effortless. Fever Dream Comedy provides end-to-end show production tailored to your space, including curation of the comedian lineup, hosting, professional sound/PA and microphone setup if needed, ticketing and box-office management, and co-branded promotional media.',
  },
  {
    question: 'What regions do you serve for live shows, corporate events, and recordings?',
    answer:
      'Based in Kitchener-Waterloo, we primarily serve Southwestern Ontario—including Guelph, Cambridge, Stratford, Elora, London, Hamilton, and Brantford—and regularly tour across Ontario and Quebec.',
  },
];

export const STATIC_ROUTES = [
  {
    path: '/',
    breadcrumbName: 'Home',
    title:
      'Fever Dream Comedy | Female Stand-Up Comedy Production in Southwestern Ontario',
    description:
      'Southwestern Ontario comedy production company featuring up-and-coming and professional female comics. Home of Girl Night live shows, corporate events, private parties, and comedy recordings across Kitchener-Waterloo, Guelph, London, and beyond.',
    keywords:
      'comedy production company Southwestern Ontario, female comedians Ontario, up and coming female comics, professional women comedians, Girl Night comedy, corporate comedy events Ontario, live comedy recordings, stand-up comedy Kitchener Waterloo, live comedy Guelph, Fever Dream Comedy',
    image: DEFAULT_IMAGE,
    changefreq: 'daily',
    priority: '1.0',
  },
  {
    path: '/comedians',
    breadcrumbName: 'Our Comedians & Producers',
    title:
      'Female Comedians & Producers | Up-and-Coming & Pro Comics | Fever Dream Comedy',
    description:
      'Meet Southwestern Ontario comedy producers Renee Groux and Lindsay Endersby and our roster of professional headliners and rising female stand-up comics behind Girl Night and SiriusXM-featured comedy recordings.',
    keywords:
      'female comedians Southwestern Ontario, professional female comics, up and coming women comedians, Renee Groux, Lindsay Endersby, comedy producers Kitchener Waterloo, SiriusXM comedy album, Girl Night roster',
    image: DEFAULT_IMAGE,
    changefreq: 'monthly',
    priority: '0.8',
  },
  {
    path: '/services',
    breadcrumbName: 'Production Services & Corporate Events',
    title:
      'Comedy Production, Corporate Events, Live Recordings & Tours | Fever Dream Comedy',
    description:
      'Full-service comedy production in Southwestern Ontario: book Girl Night on Tour for your venue, hire professional female comics for corporate events and private parties, or produce live comedy recordings and specials.',
    keywords:
      'corporate comedy events Southwestern Ontario, comedy production company Ontario, live comedy recordings, comedy special production, hire female comedians, venue comedy night, private party comedians, Girl Night on Tour',
    image: DEFAULT_IMAGE,
    changefreq: 'monthly',
    priority: '0.9',
  },
  {
    path: '/fringe',
    breadcrumbName: 'The Curse of Girl Night',
    title:
      'The Curse of Girl Night | Award-Winning Sketch & Stand-Up Production | Fever Dream Comedy',
    description:
      'Winner of Best of Fest and Big Buzz awards at the 2026 Guelph Fringe Festival. An original theatrical sketch and stand-up comedy production by Southwestern Ontario’s Fever Dream Comedy.',
    keywords:
      'The Curse of Girl Night, Guelph Fringe Festival Best of Fest, Big Buzz award, Southwestern Ontario sketch comedy, female comedy production, Lindsay Endersby, Renee Groux',
    image: FRINGE_POSTER_IMAGE,
    changefreq: 'monthly',
    priority: '0.8',
  },
  {
    path: '/book',
    breadcrumbName: 'Book a Show or Inquire',
    title:
      'Book Female Comedians, Corporate Events & Show Production | Fever Dream Comedy',
    description:
      'Inquire to book live stand-up comedy shows, corporate entertainment, private parties, or live comedy recordings in Southwestern Ontario with Fever Dream Comedy.',
    keywords:
      'book comedy show Southwestern Ontario, hire corporate comedian Kitchener Waterloo, book female comedians Guelph London, comedy production inquiry, Fever Dream Comedy contact',
    image: DEFAULT_IMAGE,
    changefreq: 'monthly',
    priority: '0.9',
  },
];

/**
 * Escape text for safe insertion inside HTML attributes and tags.
 */
export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Parse a Canadian address string like "43 Arthur Street South, Guelph, ON N1E 0P9"
 * into a Schema.org PostalAddress object.
 */
export function parsePostalAddress(addressStr = '', fallbackCity = 'Kitchener') {
  const raw = String(addressStr || '').trim();
  if (!raw) {
    return {
      '@type': 'PostalAddress',
      addressLocality: fallbackCity || 'Kitchener',
      addressRegion: 'ON',
      addressCountry: 'CA',
    };
  }

  // Match pattern: "<street>, <city>, <province> <postalCode>"
  const match = raw.match(
    /^(.+?),\s*([^,]+?),\s*([A-Z]{2})(?:\s+([A-Z]\d[A-Z]\s*\d[A-Z]\d))?$/i
  );

  if (match) {
    const [, streetAddress, locality, region, postalCode] = match;
    return {
      '@type': 'PostalAddress',
      streetAddress: streetAddress.trim(),
      addressLocality: locality.trim(),
      addressRegion: region.toUpperCase(),
      ...(postalCode ? { postalCode: postalCode.trim().toUpperCase() } : {}),
      addressCountry: 'CA',
    };
  }

  return {
    '@type': 'PostalAddress',
    streetAddress: raw,
    addressLocality: fallbackCity || 'Ontario',
    addressRegion: 'ON',
    addressCountry: 'CA',
  };
}

/**
 * Build SEO metadata object for an individual event/show page.
 */
export function buildEventRouteSeo(event) {
  const slug = slugifyEvent(event);
  const dateFormatted = event.start
    ? new Date(event.start).toLocaleDateString('en-CA', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';
  const city = event.venueCity || 'Southwestern Ontario';
  const venue = event.venueName || '';
  const isUpcoming = event.start
    ? new Date(event.start).getTime() >= Date.now() - 86400000
    : true;

  return {
    path: `/upcoming/${slug}`,
    breadcrumbName: `${event.title} (${city})`,
    title: `${event.title} in ${city}${dateFormatted ? ` (${dateFormatted})` : ''} | Fever Dream Comedy`,
    description: `Get tickets for ${event.title}${dateFormatted ? ` on ${dateFormatted}` : ''} at ${venue ? `${venue}, ` : ''}${city}. Live stand-up comedy featuring professional and up-and-coming female comics, produced by Fever Dream Comedy.`,
    keywords: `${event.title}, comedy tickets ${city}, ${venue}, female comedians ${city}, stand up comedy Southwestern Ontario, Fever Dream Comedy, Girl Night on Tour`,
    image: event.posterUrl || DEFAULT_IMAGE,
    eventData: event,
    lastmod: event.updatedAt ? event.updatedAt.split('T')[0] : undefined,
    changefreq: isUpcoming ? 'daily' : 'monthly',
    priority: isUpcoming ? '0.9' : '0.6',
  };
}

/**
 * Build rich Schema.org JSON-LD structured data for any route.
 */
export function buildStructuredData(route) {
  const canonicalUrl = `${SITE_ORIGIN}${route.path === '/' ? '/' : route.path}`;

  const organizationNode = {
    '@type': ['PerformingGroup', 'EntertainmentBusiness'],
    '@id': `${SITE_ORIGIN}/#organization`,
    name: 'Fever Dream Comedy',
    alternateName: ['Girl Night Comedy', 'Fever Dream Comedy KW'],
    url: SITE_ORIGIN,
    email: 'feverdreamcomedykw@gmail.com',
    description:
      'Southwestern Ontario comedy production company featuring up-and-coming and professional female comics across live showcases, tours, corporate events, private parties, and live comedy recordings.',
    image: DEFAULT_IMAGE,
    logo: DEFAULT_IMAGE,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kitchener-Waterloo',
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
    areaServed: [
      {
        '@type': 'AdministrativeArea',
        name: 'Southwestern Ontario, Canada',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Ontario, Canada',
      },
      ...SOUTHWESTERN_ONTARIO_CITIES.map((city) => ({
        '@type': 'City',
        name: city,
      })),
    ],
    sameAs: [
      'https://www.facebook.com/feverdreamcomedy/',
      'https://www.instagram.com/feverdreamcomedyshow/',
      'https://www.eventbrite.com/o/fever-dream-comedy-45265374033',
    ],
    genre: [
      'Stand-up comedy',
      'Sketch comedy',
      'Live Comedy Production',
      'Corporate Comedy Entertainment',
      'Comedy Recordings & Specials',
    ],
    founder: [
      {
        '@type': 'Person',
        name: 'Renee Groux',
        jobTitle: 'Co-Producer & Stand-Up Comedian',
        sameAs: [
          'https://www.youtube.com/@ReneeGroux',
          'https://www.instagram.com/reneegroux/',
        ],
      },
      {
        '@type': 'Person',
        name: 'Lindsay Endersby',
        jobTitle: 'Co-Producer & Stand-Up Comedian',
        sameAs: ['https://www.instagram.com/lindsayendersby/'],
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Comedy Production & Entertainment Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Live Comedy Show Production & Touring (Girl Night on Tour)',
            description:
              'Turnkey live stand-up comedy showcases and touring productions featuring professional and up-and-coming female comics for venues, breweries, distilleries, and theatres across Southwestern Ontario.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Corporate Events & Workplace Comedy Entertainment',
            description:
              'Custom-tailored stand-up comedy entertainment and hosting for corporate events, conferences, holiday galas, and team-building functions.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Live Comedy Recordings, Albums & Specials Production',
            description:
              'End-to-end live show production for comedy album tapings, video specials, and broadcast/streaming recordings (including SiriusXM-featured releases).',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Private Parties, Fundraisers & Special Events',
            description:
              'Bespoke lineups of female stand-up comedians for private celebrations, bachelorette parties, community fundraisers, and club nights.',
          },
        },
      ],
    },
  };

  if (route.eventData) {
    const ev = route.eventData;
    const addressObj = parsePostalAddress(ev.venueAddress, ev.venueCity);
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ComedyEvent',
          '@id': `${canonicalUrl}#event`,
          name: ev.title,
          startDate: ev.start || ev.startUtc,
          endDate: ev.end || undefined,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: ev.venueName || 'Venue TBA',
            address: addressObj,
          },
          image: ev.posterUrl ? [ev.posterUrl] : [DEFAULT_IMAGE],
          description: ev.summary || route.description,
          offers: ev.ticketUrl
            ? {
                '@type': 'Offer',
                url: ev.ticketUrl,
                price: ev.priceValue ? (ev.priceValue / 100).toFixed(2) : undefined,
                priceCurrency: ev.currency || 'CAD',
                availability: 'https://schema.org/InStock',
                validFrom: ev.createdAt || undefined,
              }
            : undefined,
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
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_ORIGIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Upcoming Shows',
              item: `${SITE_ORIGIN}/#shows`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: ev.title,
              item: canonicalUrl,
            },
          ],
        },
      ],
    };
  }

  const graph = [
    organizationNode,
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      url: SITE_ORIGIN,
      name: 'Fever Dream Comedy',
      inLanguage: 'en-CA',
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
  ];

  if (route.path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE_ORIGIN}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: route.breadcrumbName || route.title,
          item: canonicalUrl,
        },
      ],
    });
  }

  if (route.path === '/book') {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      mainEntity: BOOKING_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  if (route.path === '/fringe') {
    graph.push({
      '@type': 'CreativeWork',
      '@id': `${canonicalUrl}#production`,
      name: 'The Curse of Girl Night',
      headline: "Fever Dream Comedy's Award-Winning Original Sketch & Stand-Up Show",
      creator: { '@id': `${SITE_ORIGIN}/#organization` },
      image: FRINGE_POSTER_IMAGE,
      award: [
        '2026 Best of Fest Winner — Guelph Fringe Festival',
        '2026 Big Buzz Winner — Guelph Fringe Festival',
      ],
      genre: ['Sketch Comedy', 'Stand-Up Comedy', 'Theatre'],
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

/**
 * Resolve SEO config for a given pathname and optional event list.
 */
export function resolveSeoForPath(pathname = '/', events = []) {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (cleanPath === '/admin') {
    return {
      path: '/admin',
      title: 'Admin Dashboard | Fever Dream Comedy',
      description: 'Fever Dream Comedy administration portal.',
      keywords: '',
      image: DEFAULT_IMAGE,
      robots: 'noindex, nofollow',
    };
  }

  const staticMatch = STATIC_ROUTES.find((r) => r.path === cleanPath);
  if (staticMatch) {
    return { ...staticMatch, robots: 'index, follow' };
  }

  if (cleanPath.startsWith('/upcoming/')) {
    const slug = cleanPath.replace('/upcoming/', '');
    const matchedEvent = events.find(
      (e) =>
        slugifyEvent(e).toLowerCase() === slug.toLowerCase() ||
        String(e.id) === slug ||
        slug.toLowerCase().endsWith(`-${e.id}`)
    );
    if (matchedEvent) {
      return { ...buildEventRouteSeo(matchedEvent), robots: 'index, follow' };
    }
  }

  return { ...STATIC_ROUTES[0], path: cleanPath, robots: 'index, follow' };
}

/**
 * Update document head tags dynamically during client-side SPA navigation.
 */
export function applySeoToDocument(seo) {
  if (typeof document === 'undefined' || !seo) return;

  const canonicalUrl = `${SITE_ORIGIN}${seo.path === '/' ? '/' : seo.path}`;
  document.title = seo.title;

  const setMeta = (selector, attrName, attrValue, content) => {
    if (!content) return;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('meta[name="description"]', 'name', 'description', seo.description);
  setMeta('meta[name="keywords"]', 'name', 'keywords', seo.keywords);
  setMeta('meta[name="robots"]', 'name', 'robots', seo.robots || 'index, follow');

  setMeta('meta[property="og:type"]', 'property', 'og:type', seo.eventData ? 'event' : 'website');
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  setMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
  setMeta('meta[property="og:image"]', 'property', 'og:image', seo.image || DEFAULT_IMAGE);

  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', seo.image || DEFAULT_IMAGE);

  let canonicalEl = document.head.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);

  if (seo.robots !== 'noindex, nofollow') {
    const ldJson = buildStructuredData(seo);
    let scriptEl = document.head.querySelector('script[type="application/ld+json"]');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(ldJson);
  }
}
