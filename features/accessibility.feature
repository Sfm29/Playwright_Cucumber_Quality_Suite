Feature: Accessibility
  As a user relying on assistive technology
  I want the core pages to meet WCAG 2.1 AA
  So that the site is usable regardless of ability

  @accessibility
  Scenario Outline: Core pages have no critical or serious accessibility violations
    When I open the "<page>" page
    Then it should have no critical or serious accessibility violations

    Examples:
      | page     |
      | home     |
      | products |
      | login    |
      | cart     |
