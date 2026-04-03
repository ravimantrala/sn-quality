@UIPolicy @Priority @IncidentManagement
Feature: Priority Field is Read-Only on Incident Form
  As an ITIL process owner
  I want the Priority field to be read-only
  So that users cannot manually override the calculated priority

  Background:
    Given I am logged in as an ITIL user

  # -------------------------------------------------------------------
  # Scenario 1: Priority field is read-only on new incident
  # -------------------------------------------------------------------
  @Form @Smoke
  Scenario: Priority field is read-only on new incident
    When I open a new "incident" form
    Then the "priority" field is read-only

  # -------------------------------------------------------------------
  # Scenario 2: Priority field is read-only on existing incident
  # -------------------------------------------------------------------
  @Form
  Scenario: Priority field is read-only on existing incident
    When I insert a record into "incident" with:
      | field             | value                       |
      | caller_id         | Abel Tuter                  |
      | short_description | Read-only priority test     |
      | impact            | 2 - Medium                  |
      | urgency           | 2 - Medium                  |
      | category          | Software                    |
      | assignment_group  | Service Desk                |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 3     |
    And the "priority" field is read-only
