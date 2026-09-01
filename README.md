# Playwright Cucumber Quality Suite

BDD, accessibility and visual regression testing framework for [automationexercise.com](https://automationexercise.com), built with **Playwright + Cucumber + TypeScript**.

This is my third QA automation portfolio project. The first two ([`Employee_Management_Automation`](https://github.com/Sfm29/Employee_Management_Automation) and [`QA_Playwright_Framework`](https://github.com/Sfm29/QA_Playwright_Framework)) cover UI + API end-to-end testing with a classic Page Object Model. This one deliberately goes somewhere they don't: **BDD collaboration with non-technical stakeholders, accessibility compliance, and visual regression** — three things real QA teams are asked for that a plain functional test suite doesn't cover.

## Why these three, and not everything

Performance testing, mobile testing and contract testing are equally valid next steps, but cramming all six gaps into one project dilutes the point of each. This project intentionally scopes to **BDD + accessibility + visual regression** because they share the same test infrastructure (same pages, same Playwright, same CI) and tell one coherent story: *quality beyond "does the button work."* Performance and mobile testing are left as a clearly separate, future project — see [Roadmap](#roadmap).

## What's covered

| Type | Tool | Where |
|---|---|---|
| BDD functional tests | Cucumber + Playwright | `features/*.feature`, `src/steps/` |
| Accessibility (WCAG 2.1 A/AA) | `@axe-core/playwright`, run as Cucumber steps | `features/accessibility.feature` |
| Visual regression | Playwright Test's native `toHaveScreenshot()` | `tests/visual/` |
| Cross-browser execution | Chromium, Firefox, WebKit | CI matrix + `npm run test:<browser>` |
| CI/CD | GitHub Actions | `.github/workflows/ci.yml` |
| Containerisation | Docker + docker-compose | `Dockerfile`, `docker-compose.yml` |
| Reporting | Cucumber HTML, Allure, Playwright HTML | `reports/` (generated, gitignored) |

## Architecture

```
features/       Gherkin scenarios — the executable spec, readable by non-engineers
src/pages/      Page Object Model (mirrors the pattern used in my other two repos)
src/steps/      Step definitions binding Gherkin to Playwright, via the page objects
src/support/    Custom Cucumber World + lifecycle hooks (browser/context management)
tests/visual/   Native Playwright Test specs, screenshot baselines only
.github/workflows/  CI pipeline
```

Two test runners, one repo, on purpose: Cucumber drives the functional + accessibility suites because BDD is the point; Playwright Test drives visual regression because `toHaveScreenshot()`'s baseline/diff workflow has no real equivalent inside Cucumber, and reimplementing it there would be worse than using the tool built for the job.

## Running it

```bash
npm install
npx playwright install --with-deps   # one-time browser binaries

npm test                # full BDD suite, chromium, headless
npm run test:smoke      # just the @smoke-tagged scenarios
npm run test:a11y       # just the accessibility suite
npm run test:firefox    # same suite, firefox
npm run test:webkit     # same suite, webkit

npm run test:visual             # visual regression, all 3 browsers
npm run test:visual:update      # (re)record baselines after an intentional UI change

npm run report:allure   # generate + open the Allure report after a run
```

Or via Docker, no local Node/browser setup required:

```bash
docker compose up suite-chromium
docker compose up suite-firefox
docker compose up suite-webkit
```

## Design decisions worth knowing about (and would happily discuss in an interview)

- **Signup is deliberately not completed end-to-end.** The suite fills the signup form and asserts the hand-off to the account-details step, but stops short of creating a real account on a shared public demo site on every CI run. Repeatedly hammering a third-party site with fake account creation is bad automation citizenship and risks the CI runner's IP getting rate-limited — a trade-off I'd rather make explicit than hide.
- **The product-search scenarios assert "at least N results," not "every result's name contains the keyword."** I initially wrote the stricter assertion, then checked the live site and found its search matches by category as well as name (e.g. searching "Top" also returns "Little Girls Mr. Panda Shirt", which is filed under the Tops category) — so the strict version would have been a flaky, wrong assertion passing by luck. Caught it against the real site before it shipped rather than after CI went red for the wrong reason.
- **Accessibility failures are scoped to `critical`/`serious` impact**, not zero-violations-of-any-kind. A portfolio project that fails CI on every `minor` contrast nuance on a site I don't control isn't a useful gate — it's noise. Blocking on high-impact issues while still surfacing everything else in the report is the version a real team would actually keep enabled.
- **Visual regression hides the "recommended items" carousel before snapshotting** — it's the one piece of rotating, non-deterministic content on these pages. Without that, the suite would flake on unrelated content changes instead of catching real UI regressions.
- **`npm test` runs through `scripts/run-tests.js` instead of calling `cucumber-js` directly.** While standing this project up I hit a real CI reliability bug: on a *failing* run, `cucumber-js`'s own console formatters (`progress`/`summary`) went completely silent in every non-interactive context I tried — a piped local shell and GitHub Actions logs alike — leaving nothing but a bare `exit code 1` with zero indication of which scenario failed or why. The suite was still running correctly and `reports/cucumber-report.json` was still written in full; only the console text vanished. Rather than ship a CI pipeline that fails opaquely, `scripts/run-tests.js` runs `cucumber-js` as a child process and then reads its own JSON report straight off disk to print an explicit pass/fail summary — independent of, and immune to, that upstream formatter quirk. Small wrapper, but it's the difference between a red CI check that tells you why and one that makes you re-run it locally to find out.

## Roadmap

Deliberately **not** in this repo — planned as a separate portfolio project so each one stays focused:

- **API contract testing** (Pact) against a REST API — validates provider/consumer compatibility, a gap none of my three repos currently cover.
- **Performance/load testing** (k6) — a different discipline (throughput/latency under load, not functional correctness) that deserves its own tooling and its own story, not a bolt-on here.

## License

MIT
