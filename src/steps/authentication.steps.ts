import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { QualityGateWorld } from '../support/world';

Given('I am on the login page', async function (this: QualityGateWorld) {
  await this.loginPage.goto();
});

When(
  'I try to log in with email {string} and password {string}',
  async function (this: QualityGateWorld, email: string, password: string) {
    await this.loginPage.login(email, password);
  },
);

Then('I should see the login error {string}', async function (this: QualityGateWorld, expected: string) {
  expect(await this.loginPage.loginErrorText()).toBe(expected);
});

When(
  'I start signing up as {string} with a new, unused email',
  async function (this: QualityGateWorld, name: string) {
    // A timestamped email keeps every CI run unique without ever hitting a real inbox.
    const uniqueEmail = `qa_gate_${Date.now()}@example.com`;
    await this.loginPage.beginSignup(name, uniqueEmail);
  },
);

Then('I should be taken to the {string} step', async function (this: QualityGateWorld, _stepName: string) {
  expect(await this.loginPage.isOnAccountInfoStep()).toBe(true);
});
