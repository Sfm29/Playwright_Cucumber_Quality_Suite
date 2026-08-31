import { test, expect } from '@playwright/test';

/**
 * Visual regression for the same core pages covered functionally by the Cucumber suite.
 * Kept as native Playwright Test (not Cucumber) specifically to use toHaveScreenshot(),
 * which owns baseline creation/diffing/update out of the box — reimplementing that on
 * top of Cucumber would just be worse.
 *
 * First run on a fresh clone: `npm run test:visual:update` to record the baselines,
 * then commit the generated tests/visual/visual.spec.ts-snapshots/ folder.
 */
const PAGES: Array<{ name: string; path: string }> = [
  { name: 'home', path: '/' },
  { name: 'products', path: '/products' },
  { name: 'login', path: '/login' },
  { name: 'product-detail', path: '/product_details/1' },
];

for (const { name, path } of PAGES) {
  test(`${name} page matches its visual baseline`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });

    // Neutralise the one piece of non-deterministic content (rotating "recommended
    // items" carousel) so the screenshot is stable across runs instead of flaking.
    await page.addStyleTag({
      content: `.recommended_items { visibility: hidden !important; }`,
    });

    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
