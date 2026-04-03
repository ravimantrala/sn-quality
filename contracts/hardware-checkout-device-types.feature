@Catalog @HardwareCheckout @DeviceTypes
Feature: Hardware Checkout Device Type Validation
  As a catalog administrator
  I need each device type to create a valid auto-approved request
  So that fulfillment can proceed for any hardware type

  Background:
    Given I am logged in as an ITIL user

  # -------------------------------------------------------------------
  # All 4 Device Types — Parameterized
  # -------------------------------------------------------------------
  @Matrix @Smoke
  Scenario Outline: Each device type creates an auto-approved requested item
    When I open the catalog item "Hardware Checkout"
    And I set the following variable values:
      | variable      | value                            |
      | device_type   | <device_type>                    |
      | justification | Testing <device_label> checkout  |
    And I order the catalog item
    Then a requested item (RITM) is created
    And the RITM approval state is "approved"
    And a fulfillment task exists for the RITM

    Examples:
      | device_type    | device_label   |
      | mac_laptop     | Mac Laptop     |
      | windows_laptop | Windows Laptop |
      | iphone         | iPhone         |
      | android_phone  | Android Phone  |
