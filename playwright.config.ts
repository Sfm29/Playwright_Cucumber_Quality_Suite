import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test config — used ONLY for the visual regression suite (tests/visual/**).
 * The BDD functional + accessibility suites run through Cucumber (see cucumber.js);
 * this project is kept separate because Playwright Test's native toHaveScreenshot()
 * baseline/diff workflow has no equivalent inside Cucumber.
 */
export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'reports/playwright-visual-report', open: 'never' }],
    // Same reasoning as the cucumber-js wrapper in scripts/run-tests.js: the HTML
    // report is great for a human, but bundles its data as embedded, non-trivial-to-
    // parse blobs inside index.html — a bad shape for diagnosing a CI failure without
    // opening a browser. A flat JSON report alongside it means a failure can always
    // be read directly off the uploaded artifact.
    ['json', { outputFile: 'reports/playwright-visual-report/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://automationexercise.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
  },
  expect: {
    toHaveScreenshot: {
      // Small tolerance for anti-aliasing/font-rendering differences between CI and local runs.
      maxDiffPixelRatio: 0.02,
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
