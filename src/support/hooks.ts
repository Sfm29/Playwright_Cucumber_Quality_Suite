import { AfterAll, AfterStep, BeforeAll, Before, After, Status } from '@cucumber/cucumber';
import { Browser, chromium, firefox, webkit } from 'playwright';
import { QualityGateWorld } from './world';

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
    // Headless Chromium's colour management can miscalculate rendered pixel colours
    // enough to trip axe-core's `color-contrast` check with false positives that
    // don't reproduce headed — a known interaction between headless Chrome and
    // axe-core, not a defect in the page. Forcing sRGB gives axe-core the same
    // colour values a real display would. Harmless for chromium's other suites;
    // ignored entirely by firefox/webkit.
    args: engine === 'chromium' ? ['--force-color-profile=srgb'] : undefined,
  });
});

Before(async function (this: QualityGateWorld) {
  this.context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  this.page = await this.context.newPage();
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
