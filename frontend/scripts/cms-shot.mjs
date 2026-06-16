import { chromium } from 'playwright';

const cookieStr = 'better-auth.session_token=ktoyZDosQWHA2YGRXcFroLIdXWIRgPRD.v9Zgri3ruESE3b%2FALKo6CbDn02ugOJsGSrRK2v8%2BkKI%3D';
const [name, value] = cookieStr.split('=');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
await ctx.addCookies([{ name, value, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();
await page.goto('http://localhost:5173/admin/content', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
// Homepage tab (default) — top of form
await page.screenshot({ path: 'scripts/cms-home.png' });
// FAQ tab — nested faqs arrays + add/remove
await page.getByRole('button', { name: 'FAQ' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/cms-faq.png', fullPage: true });
console.log('shots saved');
await browser.close();
