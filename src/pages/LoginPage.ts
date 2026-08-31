import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly loginEmailInput = 'input[data-qa="login-email"]';
  private readonly loginPasswordInput = 'input[data-qa="login-password"]';
  private readonly loginButton = 'button[data-qa="login-button"]';
  private readonly loginErrorMessage = 'p[style*="color: red"]';

  private readonly signupNameInput = 'input[data-qa="signup-name"]';
  private readonly signupEmailInput = 'input[data-qa="signup-email"]';
  private readonly signupButton = 'button[data-qa="signup-button"]';
  private readonly accountInfoHeading = 'h2:has-text("Enter Account Information")';

  async goto(): Promise<void> {
    await this.open('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.fill(this.loginEmailInput, email);
    await this.page.fill(this.loginPasswordInput, password);
    await this.page.click(this.loginButton);
  }

  async loginErrorText(): Promise<string> {
    return (await this.page.textContent(this.loginErrorMessage))?.trim() ?? '';
  }

  /**
   * Starts (but deliberately does NOT complete) account creation.
   * We only assert that the signup step hands off correctly to the account-info form.
   * We intentionally avoid completing signup against the live third-party site in CI —
   * repeated automated account creation against a shared public demo site is bad citizenship
   * and would eventually get the CI runner's IP rate-limited or blocked.
   */
  async beginSignup(name: string, email: string): Promise<void> {
    await this.page.fill(this.signupNameInput, name);
    await this.page.fill(this.signupEmailInput, email);
    await this.page.click(this.signupButton);
  }

  async isOnAccountInfoStep(): Promise<boolean> {
    return this.page.locator(this.accountInfoHeading).isVisible();
  }
}
