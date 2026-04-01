Feature: Incident Auto-Priority Assignment Based on Impact and Urgency
  As an ITIL process owner
  I want incidents to automatically calculate priority from impact and urgency
  So that SLAs and response times are consistently applied

  Background:
    Given I am logged in as an ITIL user
    And I am on the incident form

  Scenario: High Impact + High Urgency = Critical Priority (P1)
    When I set Impact to "1 - High"
    And I set Urgency to "1 - High"
    And I submit the incident
    Then the Priority field should be "1 - Critical"

  Scenario: High Impact + Medium Urgency = High Priority (P2)
    When I set Impact to "1 - High"
    And I set Urgency to "2 - Medium"
    And I submit the incident
    Then the Priority field should be "2 - High"

  Scenario: High Impact + Low Urgency = Moderate Priority (P3)
    When I set Impact to "1 - High"
    And I set Urgency to "3 - Low"
    And I submit the incident
    Then the Priority field should be "3 - Moderate"

  Scenario: Medium Impact + High Urgency = High Priority (P2)
    When I set Impact to "2 - Medium"
    And I set Urgency to "1 - High"
    And I submit the incident
    Then the Priority field should be "2 - High"

  Scenario: Medium Impact + Medium Urgency = Moderate Priority (P3)
    When I set Impact to "2 - Medium"
    And I set Urgency to "2 - Medium"
    And I submit the incident
    Then the Priority field should be "3 - Moderate"

  Scenario: Medium Impact + Low Urgency = Low Priority (P4)
    When I set Impact to "2 - Medium"
    And I set Urgency to "3 - Low"
    And I submit the incident
    Then the Priority field should be "4 - Low"

  Scenario: Low Impact + High Urgency = Moderate Priority (P3)
    When I set Impact to "3 - Low"
    And I set Urgency to "1 - High"
    And I submit the incident
    Then the Priority field should be "3 - Moderate"

  Scenario: Low Impact + Medium Urgency = Low Priority (P4)
    When I set Impact to "3 - Low"
    And I set Urgency to "2 - Medium"
    And I submit the incident
    Then the Priority field should be "4 - Low"

  Scenario: Low Impact + Low Urgency = Planning Priority (P5)
    When I set Impact to "3 - Low"
    And I set Urgency to "3 - Low"
    And I submit the incident
    Then the Priority field should be "5 - Planning"