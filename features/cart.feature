Feature: Shopping cart
  As a shopper
  I want to add and remove products from my cart
  So that I can control exactly what I'm about to buy

  @smoke
  Scenario: Adding a product from the catalogue updates the cart
    Given I am on the products page
    When I add product "1" to the cart
    Then the cart confirmation should say "Added!"
    When I view the cart from the confirmation dialog
    Then product "1" should be in the cart

  Scenario: Removing the only item empties the cart
    Given I have product "1" in my cart
    When I remove product "1" from the cart
    Then my cart should be empty
    And I should see the message "Cart is empty! Click here to buy products."
