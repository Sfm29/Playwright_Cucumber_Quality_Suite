#!/usr/bin/env node
/**
 * Thin wrapper around `cucumber-js` that guarantees a readable pass/fail summary
 * always reaches the console — including in CI.
 *
 * Why this exists: cucumber-js's own console formatters ('progress'/'summary') were
 * observed going completely silent on a FAILING run in non-interactive contexts
 * (GitHub Actions logs, and locally with output piped/redirected) — the suite still
 * executes correctly and reports/cucumber-report.json is still written in full, but
 * the raw console log can show nothing beyond a bare `exit code 1`, with no
 * indication of which scenario failed or why. That makes CI failures nearly
 * undebuggable from the log alone.
 *
 * This wrapper runs cucumber-js as a child process (inheriting stdio, so you still
 * see whatever it *does* print), then reads its own JSON report back off disk —
 * completely independent of cucumber-js's console output — and prints an explicit
 * summary itself. It exits with cucumber-js's original exit code either way.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const cucumberArgs = process.argv.slice(2);
const reportPath = path.join(__dirname, '..', 'reports', 'cucumber-report.json');

const result = spawnSync('npx', ['cucumber-js', ...cucumberArgs], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const A11Y_PREFIX = 'Blocking accessibility violations found:\n';

/**
 * Accessibility failures carry a pretty-printed JSON blob of axe-core's full
 * violation objects — genuinely useful, but each one runs 30-60+ lines once you
 * include axe's internal rule-check detail (`any`/`all`/`none`), which buries the
 * two things you actually need to act on it: WHICH element, and WHY. Parse it back
 * out and print just that. Anything that doesn't match this exact shape (i.e. every
 * non-accessibility failure) falls through to a plain, generous truncation instead.
 */
function summarizeError(text) {
  // Playwright's expect() wraps a custom assertion message inside its own Error,
  // and that error's stringified form (what cucumber-js records) can prepend things
  // like "Error: " ahead of it — so search for the marker rather than anchoring to
  // the very start of the string.
  const markerIndex = text?.indexOf(A11Y_PREFIX) ?? -1;
  if (markerIndex !== -1) {
    try {
      const jsonText = extractBalancedJsonArray(text, markerIndex + A11Y_PREFIX.length);
      const violations = JSON.parse(jsonText);
      return violations
        .map((v) => {
          const nodeLines = v.nodes
            .map((n) => `    - ${n.target.join(', ')}\n      ${n.failureSummary.replace(/\n/g, '\n      ')}`)
            .join('\n');
          return `  [${v.impact}] ${v.id}: ${v.help}\n${nodeLines}`;
        })
        .join('\n');
    } catch {
      // Fall through to plain truncation if the shape ever changes.
    }
  }
  return truncate(text);
}

/**
 * Playwright's expect() can append its own diagnostic text (e.g. "Expected: ...")
 * after our custom assertion message, so the JSON array embedded in it isn't
 * necessarily the whole rest of the string. Scan forward from `start` (expected to
 * be a '[') and return just the substring up to its matching close bracket, tracking
 * string literals so brackets inside them don't throw off the count.
 */
function extractBalancedJsonArray(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '[') depth++;
    else if (char === ']') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error('Unbalanced JSON array — could not find matching close bracket.');
}

function truncate(text, maxLines = 6) {
  return (text || '').split('\n').slice(0, maxLines).join('\n');
}

console.log('\n=== Run summary (read directly from reports/cucumber-report.json) ===');

if (!fs.existsSync(reportPath)) {
  console.log('No report file found — the run likely crashed before any scenario executed.');
  process.exit(result.status ?? 1);
}

let features;
try {
  features = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (parseError) {
  console.log(`Report file exists but could not be parsed: ${parseError.message}`);
  process.exit(result.status ?? 1);
}

let passedCount = 0;
const failures = [];

for (const feature of features) {
  for (const element of feature.elements || []) {
    const failedSteps = (element.steps || []).filter((s) => s.result?.status === 'failed');
    if (failedSteps.length > 0) {
      for (const step of failedSteps) {
        failures.push({
          feature: feature.name,
          scenario: element.name,
          step: step.name,
          error: summarizeError(step.result.error_message),
        });
      }
    } else {
      passedCount += 1;
    }
  }
}

console.log(`${passedCount} scenario(s) passed, ${failures.length} scenario(s) failed\n`);

for (const failure of failures) {
  console.log(`FAILED — ${failure.feature} > ${failure.scenario}`);
  console.log(`  step: ${failure.step}`);
  console.log(
    `  ${failure.error.replace(/\n/g, '\n  ')}\n`,
  );
}

process.exit(result.status ?? (failures.length > 0 ? 1 : 0));
