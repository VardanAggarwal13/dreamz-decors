import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_NAME, DEFAULT_OG_IMAGE, TWITTER_HANDLE, absoluteUrl } from '@/lib/seo';

/** Get-or-create a <meta>/<link> tag, keyed by a stable selector. */
function ensureTag(tagName, selector, createAttrs) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement(tagName);
    Object.entries(createAttrs).forEach(([k, v]) => tag.setAttribute(k, v));
    document.head.appendChild(tag);
  }
  return tag;
}

const setMeta = (selector, createAttrs, content) =>
  ensureTag('meta', selector, createAttrs).setAttribute('content', content ?? '');

export default function Seo({
  title,
  description,
  canonical,
  image,
  type = 'website',
  noIndex = false,
  schema, // a single JSON-LD object OR an array of them
  children,
}) {
  const location = useLocation();

  useEffect(() => {
    const resolvedTitle = title || document.title;
    if (title) document.title = title;

    if (description) setMeta('meta[name="description"]', { name: 'description' }, description);

    setMeta('meta[name="robots"]', { name: 'robots' }, noIndex ? 'noindex,nofollow' : 'index,follow');

    // Canonical URL (absolute, on the production domain).
    const path = `${location.pathname}${location.search}`;
    const canonicalUrl = canonical ? absoluteUrl(canonical) : absoluteUrl(path);
    ensureTag('link', 'link[rel="canonical"]', { rel: 'canonical' }).setAttribute('href', canonicalUrl);

    const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE);

    // Open Graph
    setMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME);
    setMeta('meta[property="og:title"]', { property: 'og:title' }, resolvedTitle);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, description || '');
    setMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    setMeta('meta[property="og:image"]', { property: 'og:image' }, ogImage);

    // Twitter
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    setMeta('meta[name="twitter:site"]', { name: 'twitter:site' }, TWITTER_HANDLE);
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, resolvedTitle);
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description || '');
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, ogImage);

    // JSON-LD structured data — support one object or an array, rendered as
    // separate <script> tags tagged data-seo so we can replace them cleanly.
    document.head.querySelectorAll('script[data-seo="true"]').forEach((el) => el.remove());
    const blocks = Array.isArray(schema) ? schema.filter(Boolean) : schema ? [schema] : [];
    blocks.forEach((block) => {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo', 'true');
      script.textContent = JSON.stringify(block);
      document.head.appendChild(script);
    });
  }, [canonical, description, image, type, location.pathname, location.search, noIndex, schema, title]);

  return children ?? null;
}
