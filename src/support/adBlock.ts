import { Page } from 'playwright';

/**
 * automationexercise.com serves a third-party ad/content-annotation script that
 * injects unpredictable DOM content on every page load: a floating "related
 * searches" widget (`.goog-rentries`) and inline text-highlighting overlays
 * (`[class*="google-anno"]`, carrying `data-google-vignette`/`data-google-interstitial`
 * attributes) scattered across product names and category links. It's genuinely
 * non-deterministic — which text gets annotated differs between loads, and so does
 * the resulting page height (and, on the product-detail page, sometimes even the
 * rendered width — consistent with an occasional full-page "vignette" interstitial).
 *
 * That's exactly what showed up as two seemingly unrelated CI failures: flaky
 * accessibility violations (`avoid-inline-spacing`, extra `color-contrast` nodes —
 * see the `.exclude(...)` calls in accessibility.steps.ts) and flaky visual
 * regression diffs (screenshots differing in height between otherwise-identical
 * runs, sometimes dramatically). One root cause, two symptoms.
 *
 * CSS-hiding the result after the fact (which both of those call sites also do, as
 * defence in depth) doesn't stop the script from running and reflowing the page
 * first. Blocking its network requests outright is the more reliable fix: the
 * widget never loads, so there's nothing to hide and nothing to reflow around.
 */
const AD_HOST_PATTERNS = [
  /googlesyndication\.com/,
  /doubleclick\.net/,
  /googleadservices\.com/,
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /googletagservices\.com/,
  /adservice\.google\.com/,
];

export async function blockThirdPartyAds(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (AD_HOST_PATTERNS.some((pattern) => pattern.test(url))) {
      return route.abort();
    }
    return route.continue();
  });
}
