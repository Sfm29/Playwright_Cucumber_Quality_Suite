Feature: Product search
  As a shopper
  I want to search the product catalogue
  So that I can quickly find items I'm interested in

  Background:
    Given I am on the products page

  @smoke
  Scenario Outline: Searching for a known keyword returns at least one product
    When I search for "<keyword>"
    Then the page should show the "Searched Products" heading
    And I should see at least 1 result

    Examples:
      | keyword |
      | Dress   |
      | Top     |
      | Jeans   |

  Scenario: Searching for a term with no matches returns zero results
    When I search for "zzz_no_such_product_exists_zzz"
    Then the page should show the "Searched Products" heading
    And I should see 0 results
