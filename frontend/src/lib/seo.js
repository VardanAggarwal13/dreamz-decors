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
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings.contact?.phone || '+91 82848 65051',
      email: settings.contact?.email || 'dreamzdecor30@gmail.com',
      contactType: 'customer support',
      areaServed: 'IN',
    },
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

/**
 * Product schema with full Google Rich Results compliance
 * (Offers, InStock availability, MerchantReturnPolicy, ShippingDetails, AggregateRating).
 */
export const productSchema = (product, { selectedPrice, currentImage, gallery = [] } = {}) => {
  if (!product) return undefined;

  const schemaPrice = Number(selectedPrice || product.price) || 0;
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  const priceValidUntil = d.toISOString().split('T')[0];

  const reviewCount = Number(product.reviews || product.reviewsCount) || 0;
  const ratingValue = Math.min(5, Math.max(1, Number(product.rating) || 5));

  const images = [
    currentImage,
    ...(Array.isArray(gallery) ? gallery.map((item) => (typeof item === 'string' ? item : item.url)) : []),
    ...(Array.isArray(product.images) ? product.images.map((img) => img.url) : []),
    product.image,
  ].filter(Boolean);
  const uniqueImages = Array.from(new Set(images));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: uniqueImages.length ? uniqueImages : [DEFAULT_OG_IMAGE],
    description: product.description || DEFAULT_DESCRIPTION,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    sku: product.slug || String(product.id || ''),
    mpn: product.slug || String(product.id || ''),
    category: product.categoryTitle || product.category || 'Wall Art',
    ...(schemaPrice > 0
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: schemaPrice,
            priceValidUntil,
            itemCondition: 'https://schema.org/NewCondition',
            availability:
              product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            url: absoluteUrl(`/product/${product.slug}`),
            seller: {
              '@type': 'Organization',
              name: SITE_NAME,
            },
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: {
                '@type': 'MonetaryAmount',
                value: 0,
                currency: 'INR',
              },
              shippingDestination: {
                '@type': 'DefinedRegion',
                addressCountry: 'IN',
              },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 1,
                  maxValue: 2,
                  unitCode: 'd',
                },
                transitTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 3,
                  maxValue: 5,
                  unitCode: 'd',
                },
              },
            },
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'IN',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 7,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/FreeReturn',
            },
          },
        }
      : {}),
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ratingValue.toFixed(1),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
};
