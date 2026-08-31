Feature: Authentication
  As a shopper
  I want to log in or start creating an account
  So that I can access my orders and a personalised experience

  Background:
    Given I am on the login page

  @smoke
  Scenario: Logging in with incorrect credentials is rejected with a clear message
    When I try to log in with email "not_a_real_shopper_9912@example.com" and password "wrongpassword123"
    Then I should see the login error "Your email or password is incorrect!"

  Scenario: Starting signup with a new name and email hands off to the account details form
    When I start signing up as "QA Gate Test" with a new, unused email
    Then I should be taken to the "Enter Account Information" step
