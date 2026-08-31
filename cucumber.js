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
      'summary',
      'progress-bar',
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
