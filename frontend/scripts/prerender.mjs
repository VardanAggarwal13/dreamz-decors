/**
 * Post-build prerender for crawler-complete HTML on a static host (Vercel).
 *
 * Serves the freshly-built dist/ with an in-memory SPA fallback, drives a
 * headless Chromium (Playwright) to each content-stable route, waits for React
 * to paint, and writes the rendered HTML back to dist/<route>/index.html.
 *
 * Design for free-tier (Vercel build + Render API that may be cold):
 *   - NON-FATAL: any failure (no Chromium, API asleep, timeout) logs a warning
 *     and exits 0 so a deploy never breaks over prerendering.
 *   - API-INDEPENDENT: only static marketing routes are prerendered. Product
 *     pages stay JS-rendered (Google renders them; they have Product JSON-LD +
 *     are in the sitemap), so the build never waits on a cold backend.
 */
import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const PORT = 4178;

// Content-stable routes worth baking into static HTML.
const ROUTES = ['/', '/shop', '/about', '/shipping', '/faq', '/contact', '/terms'];

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
};

async function startServer(template) {
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      // Real asset on disk? stream it.
      if (path.extname(urlPath)) {
        const filePath = path.join(DIST, urlPath);
        const s = await stat(filePath).catch(() => null);
        if (s?.isFile()) {
          res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
          createReadStream(filePath).pipe(res);
          return;
        }
        res.writeHead(404); res.end(); return;
      }
      // Any route → the original SPA shell (served from memory so route writes
      // don't change what the fallback returns).
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(template);
    } catch {
      res.writeHead(500); res.end();
    }
  });
  await new Promise((resolve) => server.listen(PORT, resolve));
  return server;
}

async function main() {
  const template = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const server = await startServer(template);

  // Lazy import so a missing dependency degrades gracefully.
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let done = 0;
  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      // Ensure React actually painted into #root.
      await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0, { timeout: 8000 }).catch(() => {});
      const html = '<!doctype html>\n' + (await page.content()).replace(/^<!doctype html>/i, '').trimStart();

      const outPath = route === '/'
        ? path.join(DIST, 'index.html')
        : path.join(DIST, route, 'index.html');
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, html, 'utf8');
      done += 1;
      console.log(`[prerender] ${route} → ${path.relative(DIST, outPath)}`);
    } catch (err) {
      console.warn(`[prerender] skipped ${route}: ${err.message}`);
    }
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  console.log(`[prerender] done — ${done}/${ROUTES.length} routes baked to static HTML`);
}

main().catch((err) => {
  // Never fail the deploy over prerendering.
  console.warn(`[prerender] skipped (non-fatal): ${err.message}`);
  console.warn('[prerender] tip: ensure Chromium is installed — `npx playwright install chromium`');
  process.exit(0);
});
