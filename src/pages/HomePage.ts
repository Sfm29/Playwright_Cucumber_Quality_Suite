import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  private readonly productsNavLink = 'a[href="/products"]';
  private readonly loginNavLink = 'a[href="/login"]';
  private readonly subscribeEmailInput = '#susbscribe_email'; // typo is present on the live site's markup
  private readonly subscribeButton = '#subscribe';

  async goto(): Promise<void> {
    await this.open('/');
  }

  async goToProducts(): Promise<void> {
    await this.page.click(this.productsNavLink);
  }

  async goToLogin(): Promise<void> {
    await this.page.click(this.loginNavLink);
  }

  async subscribe(email: string): Promise<void> {
    await this.page.fill(this.subscribeEmailInput, email);
    await this.page.click(this.subscribeButton);
  }
}
