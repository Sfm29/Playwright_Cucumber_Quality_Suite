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
    // Same reasoning as LoginPage.isOnAccountInfoStep(): goToCartFromModal() triggers
    // a real page navigation to /view_cart, so a bare isVisible() can run before the
    // row has rendered and race it. waitFor() gives the navigation a real window to
    // finish before deciding the product isn't there.
    try {
      await this.page.locator(this.rowById(productId)).waitFor({ state: 'visible', timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }

  async priceFor(productId: string): Promise<string> {
    return (await this.page.textContent(this.priceById(productId)))?.trim() ?? '';
  }

  async totalFor(productId: string): Promise<string> {
    return (await this.page.textContent(this.totalById(productId)))?.trim() ?? '';
  }

  async removeProduct(productId: string): Promise<void> {
    // Deleting is an AJAX call to /delete_cart/<id> that then removes the <tr> in JS.
    // Locally that's instant and 100% reliable; from a CI runner against the live
    // site it intermittently doesn't reflect in the DOM at all — the click lands but
    // the row never detaches, and Cucumber's retry just re-hits the same 30s hang
    // (observed on CI: "64 x locator resolved to visible <tr id='product-1'>").
    // So: click, give it a short window, and if the row is still there reload the
    // cart — the delete almost always registered server-side and a fresh page
    // reflects it. Only if it truly didn't (row still present after a reload) do we
    // click again. Three rounds before giving up for real.
    const row = this.page.locator(this.rowById(productId));
    for (let attempt = 1; attempt <= 3; attempt++) {
      if ((await row.count()) === 0) return;
      await this.page.click(this.deleteButtonById(productId));
      try {
        await row.waitFor({ state: 'detached', timeout: 8_000 });
        return;
      } catch {
        await this.goto();
      }
    }
    throw new Error(`Cart row ${this.rowById(productId)} still present after 3 delete attempts`);
  }

  async isEmpty(): Promise<boolean> {
    return this.page.locator(this.emptyCartBanner).isVisible();
  }

  async emptyCartMessage(): Promise<string> {
    return (await this.page.textContent(this.emptyCartBanner))?.trim() ?? '';
  }
}
