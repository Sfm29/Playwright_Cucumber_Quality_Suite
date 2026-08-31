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
