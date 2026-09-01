import { AfterAll, AfterStep, BeforeAll, Before, After, Status } from '@cucumber/cucumber';
import { Browser, chromium, firefox, webkit } from 'playwright';
import { QualityGateWorld } from './world';
import { blockThirdPartyAds } from './adBlock';

let browser: Browser;

/**
 * One shared browser instance for the whole run (fast); a fresh context+page per
 * scenario (isolated — no cookie/localStorage leakage between scenarios).
 * BROWSER env var picks the engine so the same suite runs against all three
 * (see package.json's test:chromium / test:firefox / test:webkit scripts and the
 * CI matrix in .github/workflows/ci.yml).
 */
BeforeAll(async function () {
  const engine = process.env.BROWSER || 'chromium';
  const launcher = { chromium, firefox, webkit }[engine];
  if (!launcher) {
    throw new Error(`Unknown BROWSER "${engine}". Use chromium, firefox, or webkit.`);
  }
  browser = await launcher.launch({
    headless: process.env.HEADED !== 'true',
    // Optional escape hatch for sandboxed/offline environments that ship a browser
    // binary Playwright's own version-pinned installer can't reach (e.g. no network
    // access to its CDN). Unset in normal use — Playwright resolves its own browser.
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    // Kept as a defensive no-op, not because it fixed anything: this was my first
    // hypothesis for the accessibility suite's `color-contrast` failures (a known
    // class of headless-Chromium colour-management false positive). Pulling the raw
    // cucumber-report.json artifact from a real CI run disproved it — the violations
    // reproduce with byte-identical values on firefox and webkit too, which a
    // Chromium-only rendering quirk can't explain. They're real CSS issues on the
    // site (see the KNOWN_THIRD_PARTY_ISSUES comment in accessibility.steps.ts,
    // where they're actually handled). Left here since forcing sRGB is harmless and
    // still correct hygiene for a screenshot-taking suite; ignored by firefox/webkit.
    args: engine === 'chromium' ? ['--force-color-profile=srgb'] : undefined,
  });
});

Before(async function (this: QualityGateWorld) {
  this.context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  this.page = await this.context.newPage();
  // See adBlock.ts: keeps the third-party ad/annotation script that injects
  // non-deterministic content into the page from ever loading.
  await blockThirdPartyAds(this.page);
  this.initPageObjects();
});

AfterStep(async function (this: QualityGateWorld, { result }) {
  // Attach a screenshot to the Allure/HTML report for every failed step — this is the
  // single highest-value piece of evidence when triaging a failure from CI.
  //
  // Deliberately wrapped: this hook runs only on top of an already-failed step, so if
  // capturing the screenshot itself throws (e.g. the page/context is already gone
  // because the failure was a crashed navigation), that secondary error must never be
  // allowed to replace or hide the original failure reason in the report.
  if (result.status === Status.FAILED) {
    try {
      const screenshot = await this.page.screenshot();
      this.attach(screenshot, 'image/png');
    } catch (screenshotError) {
      console.error('Could not capture failure screenshot:', screenshotError);
    }
  }
});

After(async function (this: QualityGateWorld) {
  await this.page?.close();
  await this.context?.close();
});

AfterAll(async function () {
  await browser?.close();
});
