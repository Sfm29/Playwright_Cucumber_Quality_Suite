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
 * It ALSO serves Google's "Funding Choices" consent-management platform from
 * `fundingchoicesmessages.google.com`, which injects a full-screen IAB-TCF consent
 * modal ("This site asks for consent to use your data") over the page — thousands
 * of `.fc-*` DOM nodes, a dimmed backdrop, and a centered dialog. Whether it shows
 * on any given load is non-deterministic (it depends on cookie state and on whether
 * its script wins the race against the test's first action). When it does show it
 * dims and covers the whole viewport, so: visual baselines captured while it was up
 * are simply wrong (see the committed login baseline), and a functional step that
 * clicks a now-obscured button waits until it times out — which is why the same
 * suite is green locally and red on CI's slower engines (Firefox first).
 *
 * All of it is the same class of problem and takes the same fix. CSS-hiding the
 * result after the fact (which the visual/a11y call sites also do, as defence in
 * depth) doesn't stop the script from running and reflowing/covering the page
 * first. Blocking the network requests outright is the reliable fix: nothing loads,
 * so there's nothing to hide, reflow around, or click through.
 */
const AD_HOST_PATTERNS = [
  /googlesyndication\.com/,
  /doubleclick\.net/,
  /googleadservices\.com/,
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /googletagservices\.com/,
  /adservice\.google\.com/,
  // Google Funding Choices / consent-management platform — the full-screen
  // "asks for consent to use your data" modal. Blocking the host stops the modal
  // from ever being injected.
  /fundingchoicesmessages\.google\.com/,
  /fundingchoices\.google\.com/,
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
