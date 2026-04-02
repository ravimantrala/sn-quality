@Catalog @HardwareCheckout @ServiceCatalog
Feature: Hardware Checkout Catalog Item
  As an employee
  I need to request hardware devices through the service catalog
  So that I can get the equipment I need to do my job

  Background:
    Given I am logged into ServiceNow as an ITIL user
    And the Service Catalog is active

  # -------------------------------------------------------------------
  # Scenario 1: Catalog Item Exists with Correct Variables
  # -------------------------------------------------------------------
  @Setup @Smoke
  Scenario: Hardware Checkout catalog item is available with device type choices
    When I query the catalog item "Hardware Checkout"
    Then the catalog item exists and is active
    And the catalog item has a variable "device_type" of type "Select Box"
    And the variable "device_type" has choices:
      | value           | label           |
      | mac_laptop      | Mac Laptop      |
      | windows_laptop  | Windows Laptop  |
      | iphone          | iPhone          |
      | android_phone   | Android Phone   |

  # -------------------------------------------------------------------
  # Scenario 2: Device Request is Auto-Approved
  # -------------------------------------------------------------------
  @Submission @AutoApproval @Smoke
  Scenario: Device request is auto-approved
    When I submit the Hardware Checkout catalog item with:
      | variable      | value              |
      | device_type   | mac_laptop         |
      | justification | New hire equipment |
    Then a requested item (RITM) is created
    And the RITM approval state is "approved"
    And a fulfillment task exists for the RITM
    And the RITM number is captured for cleanup
