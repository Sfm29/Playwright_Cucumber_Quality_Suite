import { test, expect } from '@playwright/test';
import { blockThirdPartyAds } from '../../src/support/adBlock';

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
    // See adBlock.ts: the real fix for the height (and, on product-detail, width)
    // mismatches this suite was seeing between otherwise-identical runs — a
    // third-party ad/annotation script reflowing the page unpredictably. Block it
    // before navigating, so it never gets the chance to run.
    await blockThirdPartyAds(page);

    await page.goto(path, { waitUntil: 'networkidle' });

    // Neutralise the rotating "recommended items" carousel, and belt-and-suspenders
    // hide anything the ad block above might miss (a CDN host it doesn't cover) —
    // display: none, not visibility: hidden, since these specifically affect page
    // height and need to be removed from layout, not just made invisible in place.
    await page.addStyleTag({
      content: `
        .recommended_items { visibility: hidden !important; }
        .goog-rentries, [class*="google-anno"] { display: none !important; }
      `,
    });

    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
