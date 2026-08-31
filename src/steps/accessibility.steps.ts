import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { QualityGateWorld } from '../support/world';

const PAGE_PATHS: Record<string, string> = {
  home: '/',
  products: '/products',
  login: '/login',
  cart: '/view_cart',
};

const BLOCKING_IMPACTS = ['critical', 'serious'];

When('I open the {string} page', async function (this: QualityGateWorld, pageKey: string) {
  const path = PAGE_PATHS[pageKey];
  if (!path) {
    throw new Error(`Unknown page key "${pageKey}". Known keys: ${Object.keys(PAGE_PATHS).join(', ')}`);
  }
  await this.page.goto(`${this.parameters.baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
});

Then('it should have no critical or serious accessibility violations', async function (this: QualityGateWorld) {
  const results = await new AxeBuilder({ page: this.page as any })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter((v) => BLOCKING_IMPACTS.includes(v.impact ?? ''));

  if (blocking.length > 0) {
    // Attach the full detail to the report — "0 violations" alone isn't enough to act on a failure.
    const summary = blocking
      .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) — ${v.helpUrl}`)
      .join('\n');
    this.attach(summary, 'text/plain');
  }

  expect(blocking, `Blocking accessibility violations found:\n${JSON.stringify(blocking, null, 2)}`).toHaveLength(0);
});
