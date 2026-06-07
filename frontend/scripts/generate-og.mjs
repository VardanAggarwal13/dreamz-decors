/**
 * Render scripts/og-card.html to public/og-default.jpg at 1200×630 (the social
 * share image referenced by the Seo component + index.html OG/Twitter tags).
 *
 * Run with `npm run og` after editing og-card.html. Standalone and non-fatal:
 * it is NOT wired into the build (the committed og-default.jpg is the artifact).
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARD = path.resolve(__dirname, 'og-card.html');
const OUT = path.resolve(__dirname, '../public/og-default.jpg');

async function main() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // crisp text; output is still 1200×630
  });
  await page.goto(`file://${CARD}`, { waitUntil: 'networkidle' });
  // Give the web fonts a beat to swap in before snapshotting.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT, type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await browser.close();
  console.log(`[og] wrote ${path.relative(path.resolve(__dirname, '..'), OUT)} (1200×630)`);
}

main().catch((err) => {
  console.error(`[og] failed: ${err.message}`);
  process.exit(1);
});
