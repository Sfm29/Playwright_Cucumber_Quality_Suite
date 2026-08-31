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
  if (result.status === Status.FAILED) {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
  }
});

After(async function (this: QualityGateWorld) {
  await this.page?.close();
  await this.context?.close();
});

AfterAll(async function () {
  await browser?.close();
});
