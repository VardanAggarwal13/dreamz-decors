import { chromium } from 'playwright';

const cookieStr = 'better-auth.session_token=ktoyZDosQWHA2YGRXcFroLIdXWIRgPRD.v9Zgri3ruESE3b%2FALKo6CbDn02ugOJsGSrRK2v8%2BkKI%3D';
const [name, value] = cookieStr.split('=');
const SENTINEL = 'QA CRUD BADGE';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
await ctx.addCookies([{ name, value, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();

async function openProduct() {
  await page.goto('http://localhost:5173/admin/content', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Product', exact: true }).click();
  await page.waitForTimeout(700);
}

const labelInputs = () => page.locator('input[value], input').filter({ hasNot: page.locator('[type=number]') });

await openProduct();

// READ — count existing "Trust Badge" cards (badge labels are text inputs).
const badgeCardCount = () => page.getByText(/^Trust Badge$/i).count();
const before = await badgeCardCount();
console.log('READ: trust badge cards =', before);

// CREATE — click "Add trust badge", then fill the new (last) label input.
await page.getByRole('button', { name: /Add trust badge/i }).click();
await page.waitForTimeout(300);
const afterAdd = await badgeCardCount();
console.log('CREATE: after add =', afterAdd, afterAdd === before + 1 ? 'OK' : 'FAIL');

// The new card's inputs are the last two text inputs (icon, label). Fill label.
const textInputs = page.locator('section input[type="text"], section input:not([type])');
const total = await textInputs.count();
await textInputs.nth(total - 1).fill(SENTINEL); // label is the 2nd field of the card

// SAVE
await page.getByRole('button', { name: /Save changes/i }).click();
await page.waitForTimeout(1200);
console.log('SAVE clicked');

// READ-BACK — reload and confirm the sentinel persisted.
await openProduct();
const persisted = await page.locator(`input[value="${SENTINEL}"]`).count();
console.log('UPDATE/READ-BACK: sentinel present after reload =', persisted, persisted >= 1 ? 'OK' : 'FAIL');
const afterReload = await badgeCardCount();
console.log('READ-BACK: card count =', afterReload, afterReload === before + 1 ? 'OK' : 'FAIL');

// DELETE — remove the sentinel card, then save.
const sentinelInput = page.locator(`input[value="${SENTINEL}"]`).first();
const card = sentinelInput.locator('xpath=ancestor::div[contains(@class,"bg-white")][1]');
await card.getByRole('button', { name: /Remove/i }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Save changes/i }).click();
await page.waitForTimeout(1200);

// READ-BACK after delete
await openProduct();
const afterDelete = await badgeCardCount();
const sentinelGone = await page.locator(`input[value="${SENTINEL}"]`).count();
console.log('DELETE/READ-BACK: card count =', afterDelete, 'sentinel present =', sentinelGone,
  afterDelete === before && sentinelGone === 0 ? 'OK' : 'FAIL');

await browser.close();
console.log('done');
