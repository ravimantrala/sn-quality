@Catalog @CoffeeOrder @ServiceCatalog
Feature: Office Coffee Order
  As an office employee
  I need to order coffee through the service catalog
  So that I can get my coffee from the Starbucks in the office complex

  Background:
    Given I am logged in as an ITIL user

  # -------------------------------------------------------------------
  # Scenario 1: Catalog Item Exists with Correct Variables
  # -------------------------------------------------------------------
  @Setup @Smoke
  Scenario: Coffee Order catalog item is available with correct options
    When I search for catalog item "Coffee Order"
    Then a record in "sc_cat_item" exists where:
      | field  | operator | value        |
      | name   | =        | Coffee Order |
      | active | =        | true         |
    And a record in "item_option_new" exists where:
      | field    | operator | value       |
      | name     | =        | coffee_type |
    And a record in "item_option_new" exists where:
      | field    | operator | value           |
      | name     | =        | delivery_method |

  # -------------------------------------------------------------------
  # Scenario 2: Order a Latte with Delivery
  # -------------------------------------------------------------------
  @Order @Smoke
  Scenario: Employee orders a latte for delivery
    When I open the catalog item "Coffee Order"
    And I set the following variable values:
      | variable        | value    |
      | coffee_type     | latte    |
      | delivery_method | delivery |
    And I order the catalog item
    Then a requested item (RITM) is created
    And the RITM approval state is "approved"
    And a fulfillment task exists for the RITM

  # -------------------------------------------------------------------
  # Scenario 3: Order a Black Coffee with Pickup
  # -------------------------------------------------------------------
  @Order @FreeItem
  Scenario: Employee orders a free black coffee for pickup
    When I open the catalog item "Coffee Order"
    And I set the following variable values:
      | variable        | value  |
      | coffee_type     | black  |
      | delivery_method | pickup |
    And I order the catalog item
    Then a requested item (RITM) is created
    And the RITM approval state is "approved"
    And a fulfillment task exists for the RITM

  # -------------------------------------------------------------------
  # Scenario 4: Order a Cappuccino with Pickup
  # -------------------------------------------------------------------
  @Order
  Scenario: Employee orders a cappuccino for pickup
    When I open the catalog item "Coffee Order"
    And I set the following variable values:
      | variable        | value      |
      | coffee_type     | cappuccino |
      | delivery_method | pickup     |
    And I order the catalog item
    Then a requested item (RITM) is created
    And the RITM approval state is "approved"
    And a fulfillment task exists for the RITM
