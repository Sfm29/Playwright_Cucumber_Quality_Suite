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

/**
 * Known, pre-existing accessibility issues on the third-party site that this suite
 * does not control and cannot fix — documented and ignored by selector so a NEW
 * violation of the same rule elsewhere on the page still fails the build.
 * Re-check this list occasionally: if the site fixes these, delete the entry so the
 * suite is asserting the strongest thing it honestly can.
 *
 * Entries are matched two ways (see the filter below): an EXACT match against axe's
 * generated selector, or a SUFFIX match for cases where exact selectors would be
 * impractical (see color-contrast below). Confirmed genuine by pulling the raw
 * cucumber-report.json artifact straight from a real CI run: every violation here
 * reproduces with byte-identical foreground/background/ratio values across all three
 * browser engines (chromium, firefox, webkit) — that cross-engine determinism is what
 * rules out a rendering artifact and confirms these are real CSS issues on the site,
 * not a testing-environment quirk. (This also disproved an earlier hypothesis — see
 * the comment on the `--force-color-profile=srgb` launch arg in support/hooks.ts.)
 *
 *   #subscribe, #submit_search
 *     — footer "subscribe" button and products-page search button: icon-only, no
 *       accessible name (no text, aria-label, or title).
 *
 *   color-contrast — the site's top nav links (Home/Products/Login/Cart) all carry
 *   an inline `style="color: orange"` (#ffa500 on white, ratio 1.97 vs the 4.5:1
 *   required for normal text); every product price heading is bold orange (#fe980f
 *   on white, ratio 2.16 vs the 3:1 required for large text); and three more elements
 *   fail only on the cart page's breadcrumb/help text (orange breadcrumb background,
 *   grey "active" breadcrumb item, blue "click here" link). The price headings are
 *   matched by a SUFFIX (`.productinfo.text-center > h2`) rather than an exact
 *   selector: with 30+ products in the grid plus duplicated "active carousel slide"
 *   markup, an exact-selector list would need one brittle nth-child entry per product
 *   and break the moment the catalogue changes size.
 *
 *   link-name — the home-page carousel and "recommended items" carousel each render
 *   two icon-only prev/next arrows with no accessible text, aria-label, or title.
 */
const EXACT_SELECTORS: Record<string, string[]> = {
  'button-name': ['#subscribe', '#submit_search'],
  'color-contrast': [
    'li:nth-child(1) > a[href="/"]',
    'a[href$="products"]',
    'a[href$="login"]',
    'a[href$="view_cart"]',
    'ol > li:nth-child(1) > a[href="/"]',
    '.active',
    'u',
  ],
  'link-name': [
    '.left.control-carousel.hidden-xs',
    '.right.control-carousel.hidden-xs',
    '.left.recommended-item-control[href="#recommended-item-carousel"]',
    '.right.recommended-item-control[href="#recommended-item-carousel"]',
  ],
};

const SUFFIX_SELECTORS: Record<string, string[]> = {
  'color-contrast': ['.productinfo.text-center > h2'],
};

function isKnownIssue(ruleId: string, target: string): boolean {
  const exact = EXACT_SELECTORS[ruleId] ?? [];
  const suffixes = SUFFIX_SELECTORS[ruleId] ?? [];
  return exact.includes(target) || suffixes.some((suffix) => target.endsWith(suffix));
}

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

  const blocking = results.violations
    .filter((v) => BLOCKING_IMPACTS.includes(v.impact ?? ''))
    .map((v) => {
      const newNodes = v.nodes.filter(
        (node) => !node.target.some((t) => typeof t === 'string' && isKnownIssue(v.id, t)),
      );
      return { ...v, nodes: newNodes };
    })
    .filter((v) => v.nodes.length > 0);

  if (blocking.length > 0) {
    // Attach the full detail to the report — "0 violations" alone isn't enough to act on a failure.
    const summary = blocking
      .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) — ${v.helpUrl}`)
      .join('\n');
    this.attach(summary, 'text/plain');
  }

  expect(blocking, `Blocking accessibility violations found:\n${JSON.stringify(blocking, null, 2)}`).toHaveLength(0);
});
