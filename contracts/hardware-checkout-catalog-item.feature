@Catalog @HardwareCheckout @ServiceCatalog
Feature: Hardware Checkout Catalog Item
  As an employee
  I need to request hardware devices through the service catalog
  So that I can get the equipment I need to do my job

  Background:
    Given I am logged in as an ITIL user

  # -------------------------------------------------------------------
  # Scenario 1: Catalog Item Exists with Correct Variables
  # -------------------------------------------------------------------
  @Setup @Smoke
  Scenario: Hardware Checkout catalog item is available with device type choices
    When I search for catalog item "Hardware Checkout"
    Then a record in "sc_cat_item" exists where:
      | field  | operator | value             |
      | name   | =        | Hardware Checkout |
      | active | =        | true              |
    And a record in "item_option_new" exists where:
      | field | operator | value       |
      | name  | =        | device_type |
    And a record in "question_choice" exists where:
      | field | operator | value      |
      | value | =        | mac_laptop |
    And a record in "question_choice" exists where:
      | field | operator | value          |
      | value | =        | windows_laptop |
    And a record in "question_choice" exists where:
      | field | operator | value  |
      | value | =        | iphone |
    And a record in "question_choice" exists where:
      | field | operator | value         |
      | value | =        | android_phone |

  # -------------------------------------------------------------------
  # Scenario 2: Device Request is Auto-Approved
  # -------------------------------------------------------------------
  @Submission @AutoApproval @Smoke
  Scenario: Device request is auto-approved
    When I open the catalog item "Hardware Checkout"
    And I set the following variable values:
      | variable      | value              |
      | device_type   | mac_laptop         |
      | justification | New hire equipment |
    And I order the catalog item
    Then a requested item (RITM) is created
    And the RITM approval state is "approved"
    And a fulfillment task exists for the RITM
