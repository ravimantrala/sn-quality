@Priority @Recalculation @IncidentManagement
Feature: Priority Recalculates When Impact or Urgency Changes
  As an ITIL process owner
  I need the priority to recalculate whenever impact or urgency is updated
  So that the priority always reflects the current severity assessment

  Background:
    Given I am logged into ServiceNow as an ITIL user

  # -------------------------------------------------------------------
  # Scenario 1: Urgency Escalation Recalculates Priority
  # -------------------------------------------------------------------
  @Escalation
  Scenario: Priority upgrades when urgency is raised on existing incident
    Given an incident exists with:
      | field             | value                          |
      | caller_id         | Abel Tuter                     |
      | short_description | Recalc test — urgency change   |
      | impact            | 2 - Medium                     |
      | urgency           | 3 - Low                        |
      | category          | Software                       |
      | assignment_group  | Service Desk                   |
    And the "priority" field value is "4 - Low"
    When I update the incident with:
      | field   | value    |
      | urgency | 1 - High |
    And I save the form
    Then the "priority" field value is "2 - High"

  # -------------------------------------------------------------------
  # Scenario 2: Impact Escalation Recalculates Priority
  # -------------------------------------------------------------------
  @Escalation
  Scenario: Priority upgrades when impact is raised on existing incident
    Given an incident exists with:
      | field             | value                          |
      | caller_id         | Abel Tuter                     |
      | short_description | Recalc test — impact change    |
      | impact            | 3 - Low                        |
      | urgency           | 3 - Low                        |
      | category          | Software                       |
      | assignment_group  | Service Desk                   |
    And the "priority" field value is "5 - Planning"
    When I update the incident with:
      | field  | value    |
      | impact | 1 - High |
    And I save the form
    Then the "priority" field value is "3 - Moderate"

  # -------------------------------------------------------------------
  # Scenario 3: Double Escalation (Both Fields Change)
  # -------------------------------------------------------------------
  @Escalation @Critical
  Scenario: Priority jumps to Critical when both impact and urgency are raised
    Given an incident exists with:
      | field             | value                                  |
      | caller_id         | Abel Tuter                             |
      | short_description | Recalc test — double escalation        |
      | impact            | 3 - Low                                |
      | urgency           | 3 - Low                                |
      | category          | Software                               |
      | assignment_group  | Service Desk                           |
    And the "priority" field value is "5 - Planning"
    When I update the incident with:
      | field   | value    |
      | impact  | 1 - High |
      | urgency | 1 - High |
    And I save the form
    Then the "priority" field value is "1 - Critical"