import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { QualityGateWorld } from '../support/world';

When('I add product {string} to the cart', async function (this: QualityGateWorld, productId: string) {
  await this.productsPage.addToCart(productId);
});

Then('the cart confirmation should say {string}', async function (this: QualityGateWorld, expected: string) {
  expect(await this.productsPage.cartModalTitleText()).toBe(expected);
});

When('I view the cart from the confirmation dialog', async function (this: QualityGateWorld) {
  await this.productsPage.goToCartFromModal();
});

Then('product {string} should be in the cart', async function (this: QualityGateWorld, productId: string) {
  expect(await this.cartPage.hasProduct(productId)).toBe(true);
});

Given('I have product {string} in my cart', async function (this: QualityGateWorld, productId: string) {
  await this.productsPage.goto();
  await this.productsPage.addToCart(productId);
  await this.productsPage.goToCartFromModal();
});

When('I remove product {string} from the cart', async function (this: QualityGateWorld, productId: string) {
  await this.cartPage.removeProduct(productId);
});

Then('my cart should be empty', async function (this: QualityGateWorld) {
  expect(await this.cartPage.isEmpty()).toBe(true);
});

Then('I should see the message {string}', async function (this: QualityGateWorld, expected: string) {
  const actual = await this.cartPage.emptyCartMessage();
  expect(actual).toContain(expected);
});
