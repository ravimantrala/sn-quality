@Catalog @HardwareCheckout @DeviceTypes
Feature: Hardware Checkout Device Type Validation
  As a catalog administrator
  I need each device type to create a valid auto-approved request
  So that fulfillment can proceed for any hardware type

  Background:
    Given I am logged into ServiceNow as an ITIL user

  # -------------------------------------------------------------------
  # All 4 Device Types — Parameterized
  # -------------------------------------------------------------------
  @Matrix @Smoke
  Scenario Outline: Each device type creates an auto-approved requested item
    When I submit the Hardware Checkout catalog item with:
      | variable      | value                            |
      | device_type   | <device_type>                    |
      | justification | Testing <device_label> checkout  |
    Then a requested item (RITM) is created
    And the RITM approval state is "approved"
    And a fulfillment task exists for the RITM
    And the RITM number is captured for cleanup

    Examples:
      | device_type    | device_label   |
      | mac_laptop     | Mac Laptop     |
      | windows_laptop | Windows Laptop |
      | iphone         | iPhone         |
      | android_phone  | Android Phone  |
