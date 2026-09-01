import { BasePage } from './BasePage';

export class ProductsPage extends BasePage {
  private readonly searchInput = '#search_product';
  private readonly searchButton = '#submit_search';
  private readonly searchedProductsHeading = '.features_items .title';
  private readonly productCards = '.product-image-wrapper';
  private readonly productName = '.productinfo p';
  // Scoped to `.productinfo` on purpose: each product card renders the "Add to cart"
  // button TWICE — once always in the DOM under `.productinfo`, and again inside a
  // `.product-overlay` hover layer with the exact same data-product-id. An unscoped
  // selector resolves to both and Playwright's strict mode rejects the ambiguity;
  // this targets only the primary, always-visible one.
  private readonly addToCartByIdLink = (id: string) => `.productinfo > a.add-to-cart[data-product-id="${id}"]`;
  private readonly cartModal = '#cartModal';
  private readonly cartModalTitle = '#cartModal .modal-title';
  private readonly viewCartLink = '#cartModal a[href="/view_cart"]';
  private readonly continueShoppingButton = '#cartModal button.btn-success';

  async goto(): Promise<void> {
    await this.open('/products');
  }

  async search(term: string): Promise<void> {
    await this.page.fill(this.searchInput, term);
    await this.page.click(this.searchButton);
  }

  async searchedProductsHeadingText(): Promise<string> {
    return (await this.page.textContent(this.searchedProductsHeading))?.trim() ?? '';
  }

  async resultCount(): Promise<number> {
    return this.page.locator(this.productCards).count();
  }

  async productNames(): Promise<string[]> {
    return this.page.locator(this.productName).allTextContents();
  }

  async addToCart(productId: string): Promise<void> {
    const card = this.page.locator(this.addToCartByIdLink(productId));
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await this.page.waitForSelector(this.cartModal, { state: 'visible' });
  }

  async cartModalTitleText(): Promise<string> {
    return (await this.page.textContent(this.cartModalTitle))?.trim() ?? '';
  }

  async goToCartFromModal(): Promise<void> {
    await this.page.click(this.viewCartLink);
  }

  async continueShoppingFromModal(): Promise<void> {
    await this.page.click(this.continueShoppingButton);
  }
}
