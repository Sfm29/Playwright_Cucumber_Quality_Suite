import { Page } from 'playwright';

/**
 * Shared behaviour for every page object: navigation and small waits.
 * Kept deliberately thin — page-specific logic lives in the concrete page classes,
 * mirroring the Page Object Model used in the QA_Playwright_Framework repo.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page, protected readonly baseUrl: string) {}

  async open(path = '/'): Promise<void> {
    await this.page.goto(`${this.baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  async currentUrl(): Promise<string> {
    return this.page.url();
  }
}
