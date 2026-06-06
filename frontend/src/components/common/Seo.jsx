import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ensureMeta(selector, attrs) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(attrs).forEach(([key, value]) => {
      tag.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  }

  return tag;
}

function ensureLink(selector, attrs) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('link');
    Object.entries(attrs).forEach(([key, value]) => {
      tag.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  }

  return tag;
}

function ensureScript(selector, type) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('script');
    tag.setAttribute('type', type);
    tag.setAttribute('data-seo', 'true');
    document.head.appendChild(tag);
  }

  return tag;
}

export default function Seo({
  title,
  description,
  canonical,
  noIndex = false,
  schema,
  children,
}) {
  const location = useLocation();

  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      ensureMeta('meta[name="description"]', { name: 'description' }).setAttribute(
        'content',
        description
      );
    }

    ensureMeta('meta[name="robots"]', { name: 'robots' }).setAttribute(
      'content',
      noIndex ? 'noindex,nofollow' : 'index,follow'
    );

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentCanonical = canonical
      ? canonical.startsWith('http')
        ? canonical
        : `${origin}${canonical}`
      : `${origin}${location.pathname}${location.search}`;
    ensureLink('link[rel="canonical"]', { rel: 'canonical' }).setAttribute('href', currentCanonical);

    ensureMeta('meta[property="og:title"]', { property: 'og:title' }).setAttribute(
      'content',
      title || document.title
    );
    ensureMeta('meta[property="og:description"]', { property: 'og:description' }).setAttribute(
      'content',
      description || ''
    );
    ensureMeta('meta[property="og:url"]', { property: 'og:url' }).setAttribute(
      'content',
      currentCanonical
    );
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card' }).setAttribute(
      'content',
      'summary_large_image'
    );

    const script = ensureScript('script[data-seo="true"]', 'application/ld+json');
    if (schema) {
      script.textContent = JSON.stringify(schema);
    } else if (script) {
      script.textContent = '';
    }
  }, [canonical, description, location.pathname, location.search, noIndex, schema, title]);

  return children ?? null;
}
