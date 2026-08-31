import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private readonly cartTable = '#cart_info';
  private readonly rowById = (id: string) => `#product-${id}`;
  private readonly deleteButtonById = (id: string) => `#product-${id} .cart_quantity_delete`;
  private readonly priceById = (id: string) => `#product-${id} .cart_price p`;
  private readonly totalById = (id: string) => `#product-${id} .cart_total_price`;
  private readonly emptyCartBanner = '#empty_cart';

  async goto(): Promise<void> {
    await this.open('/view_cart');
  }

  async hasProduct(productId: string): Promise<boolean> {
    return this.page.locator(this.rowById(productId)).isVisible();
  }

  async priceFor(productId: string): Promise<string> {
    return (await this.page.textContent(this.priceById(productId)))?.trim() ?? '';
  }

  async totalFor(productId: string): Promise<string> {
    return (await this.page.textContent(this.totalById(productId)))?.trim() ?? '';
  }

  async removeProduct(productId: string): Promise<void> {
    await this.page.click(this.deleteButtonById(productId));
    // The row removal is a client-side DOM update with no navigation — wait for it to disappear.
    await this.page.waitForSelector(this.rowById(productId), { state: 'detached' });
  }

  async isEmpty(): Promise<boolean> {
    return this.page.locator(this.emptyCartBanner).isVisible();
  }

  async emptyCartMessage(): Promise<string> {
    return (await this.page.textContent(this.emptyCartBanner))?.trim() ?? '';
  }
}
