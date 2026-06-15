/**
 * Build-time sitemap generator.
 * Pulls live products + categories from the API and writes public/sitemap.xml
 * (which Vite copies into dist/). Falls back to static routes if the API is
 * unreachable so a deploy never breaks over a sitemap.
 *
 * Env:
 *   VITE_SITE_URL     canonical site origin   (default https://www.dreamdecords.com)
 *   SITEMAP_API_URL   API base for fetching   (default http://localhost:5000/api)
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = (process.env.VITE_SITE_URL || 'https://www.dreamdecords.com').replace(/\/$/, '');
const API_URL = (process.env.SITEMAP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const OUT = path.resolve(__dirname, '../public/sitemap.xml');

// Static, publicly-indexable routes with crawl priority + change frequency.
const STATIC = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/shipping', changefreq: 'monthly', priority: '0.5' },
  { path: '/faq', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.4' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmtDate = (d) => { try { return new Date(d).toISOString().split('T')[0]; } catch { return undefined; } };

async function fetchList(endpoint) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (err) {
    console.warn(`[sitemap] could not fetch ${endpoint}: ${err.message} — skipping those URLs`);
    return [];
  }
}

function urlNode({ path: p, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${esc(SITE_URL + p)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority ? `    <priority>${priority}</priority>` : '',
    '  </url>',
  ].filter(Boolean).join('\n');
}

async function main() {
  const [products, categories] = await Promise.all([
    fetchList('/products?limit=1000'),
    fetchList('/categories'),
  ]);

  const nodes = [...STATIC];

  for (const c of categories) {
    if (!c?.slug) continue;
    nodes.push({ path: `/shop/${c.slug}`, lastmod: fmtDate(c.updatedAt), changefreq: 'weekly', priority: '0.7' });
  }
  for (const p of products) {
    if (!p?.slug) continue;
    nodes.push({ path: `/product/${p.slug}`, lastmod: fmtDate(p.updatedAt), changefreq: 'weekly', priority: '0.8' });
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    nodes.map(urlNode).join('\n'),
    '</urlset>',
    '',
  ].join('\n');

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, xml, 'utf8');
  console.log(`[sitemap] wrote ${nodes.length} URLs → public/sitemap.xml (${products.length} products, ${categories.length} categories)`);
}

main().catch((err) => {
  console.warn(`[sitemap] generation failed (${err.message}); writing static-only sitemap`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${STATIC.map(urlNode).join('\n')}\n</urlset>\n`;
  writeFile(OUT, xml, 'utf8').catch(() => {});
});
