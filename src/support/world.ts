import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from 'playwright';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';

export interface QualityGateWorldParameters {
  baseUrl: string;
}

/**
 * Custom Cucumber World: one instance per scenario. Holds the Playwright page and
 * pre-wires every page object against it so step definitions stay declarative
 * (`this.loginPage.login(...)`) instead of re-instantiating page objects everywhere.
 */
export class QualityGateWorld extends World<QualityGateWorldParameters> {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  homePage!: HomePage;
  loginPage!: LoginPage;
  productsPage!: ProductsPage;
  cartPage!: CartPage;

  constructor(options: IWorldOptions<QualityGateWorldParameters>) {
    super(options);
  }

  initPageObjects(): void {
    const baseUrl = this.parameters.baseUrl;
    this.homePage = new HomePage(this.page, baseUrl);
    this.loginPage = new LoginPage(this.page, baseUrl);
    this.productsPage = new ProductsPage(this.page, baseUrl);
    this.cartPage = new CartPage(this.page, baseUrl);
  }
}

setWorldConstructor(QualityGateWorld);
