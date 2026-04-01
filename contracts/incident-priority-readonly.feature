Feature: Priority Field is Read-Only on Incident Form
  As an ITIL process owner
  I want the Priority field to be read-only
  So that users cannot manually override the calculated priority

  Background:
    Given I am logged in as an ITIL user
    And I am on the incident form

  Scenario: Priority field is read-only on new incident
    When the incident form loads
    Then the Priority field should be read-only

  Scenario: Priority field is read-only on existing incident
    Given an incident exists with Impact "2 - Medium" and Urgency "2 - Medium"
    When I open the incident
    Then the Priority field should be read-only
    And the Priority field should display "3 - Moderate"