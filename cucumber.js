/**
 * Cucumber configuration.
 * Runs .feature files through the TypeScript step definitions using ts-node,
 * and emits three report formats: a human-readable HTML report, a machine-readable
 * JSON report, and Allure results (kept consistent with the Employee_Management_Automation repo).
 */
module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['src/steps/**/*.ts', 'src/support/**/*.ts'],
    paths: ['features/**/*.feature'],
    format: [
      // NOTE: deliberately NOT 'progress-bar' — it redraws itself in place using
      // terminal cursor control, which needs a real TTY. In a non-interactive
      // context (a redirected/piped shell, or a CI log) it silently prints nothing
      // at all AND suppresses the other formatters' output with it — the run still
      // executes and its real pass/fail result still lands in the file reports
      // below, but the console log looks like a bare, unexplained `exit code 1`.
      // 'progress' (one character per scenario) is the TTY-safe equivalent.
      'progress',
      'summary',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
      'allure-cucumberjs/reporter',
    ],
    formatOptions: {
      resultsDir: 'reports/allure-results',
    },
    publishQuiet: true,
    worldParameters: {
      baseUrl: process.env.BASE_URL || 'https://automationexercise.com',
    },
  },
};
