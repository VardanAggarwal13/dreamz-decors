// Central SEO config + JSON-LD builders. Keep site-wide constants here so meta,
// structured data, and the sitemap stay consistent.

// Production site URL. Override per-environment via VITE_SITE_URL.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.dreamdecords.com').replace(/\/$/, '');
export const SITE_NAME = 'DreamzDecors';
export const SITE_TAGLINE = 'Premium Wall Art, Gallery Sets & Decor';
export const DEFAULT_DESCRIPTION =
  'Shop premium wall art, gallery sets, and statement bundles designed for modern Indian homes. Gold-foil finishing, secure packaging, pan-India delivery.';
// Absolute URL to the default 1200×630 social share image. Regenerate the
// artwork with `npm run og` (source: scripts/og-card.html).
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
export const TWITTER_HANDLE = '@dreamzdecors';

/** Resolve a path or absolute URL to an absolute URL on the canonical domain. */
export const absoluteUrl = (pathOrUrl = '/') => {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
};

/** Organization schema — emit once (homepage). Feeds Google's knowledge panel. */
export const organizationSchema = (settings = {}) => {
  const social = settings.social || {};
  const sameAs = [social.instagram, social.facebook, social.pinterest, social.youtube].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/IMG_3811-removebg-preview.png'),
    description: DEFAULT_DESCRIPTION,
    ...(sameAs.length ? { sameAs } : {}),
    ...(settings.contact?.email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            email: settings.contact.email,
            contactType: 'customer support',
            areaServed: 'IN',
          },
        }
      : {}),
  };
};

/** WebSite schema with a sitelinks search box. Emit once (homepage). */
export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

/** BreadcrumbList schema. `items` = [{ name, path }] in order. */
export const breadcrumbSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: absoluteUrl(it.path),
  })),
});

/** FAQPage schema. `faqs` = [{ question, answer }]. */
export const faqSchema = (faqs = []) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
});

/** CollectionPage + ItemList for category/shop listings. */
export const collectionSchema = ({ name, path, products = [] }) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  url: absoluteUrl(path),
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/product/${p.slug}`),
      name: p.title,
    })),
  },
});
