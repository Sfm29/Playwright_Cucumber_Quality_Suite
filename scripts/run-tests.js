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

function truncate(text, maxLines = 4) {
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
          error: truncate(step.result.error_message),
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
