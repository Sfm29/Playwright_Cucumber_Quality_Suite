import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { QualityGateWorld } from '../support/world';

Given('I am on the products page', async function (this: QualityGateWorld) {
  await this.productsPage.goto();
});

When('I search for {string}', async function (this: QualityGateWorld, term: string) {
  await this.productsPage.search(term);
});

Then('the page should show the {string} heading', async function (this: QualityGateWorld, heading: string) {
  const actual = await this.productsPage.searchedProductsHeadingText();
  expect(actual.toLowerCase()).toBe(heading.toLowerCase());
});

Then('I should see at least {int} result', async function (this: QualityGateWorld, minCount: number) {
  const count = await this.productsPage.resultCount();
  expect(count).toBeGreaterThanOrEqual(minCount);
});

Then('I should see {int} results', async function (this: QualityGateWorld, expectedCount: number) {
  expect(await this.productsPage.resultCount()).toBe(expectedCount);
});
