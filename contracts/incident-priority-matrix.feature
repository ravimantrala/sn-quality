@Priority @AutoClassification @IncidentManagement
Feature: Incident Auto-Priority Assignment Matrix
  As an ITIL process owner
  I need the priority to be automatically calculated from impact and urgency
  So that SLAs and response times are consistently applied across all severity levels

  Background:
    Given I am logged into ServiceNow as an ITIL user
    And I am on the incident form

  # -------------------------------------------------------------------
  # Full 3x3 Priority Matrix Validation
  # -------------------------------------------------------------------
  @Matrix @Smoke
  Scenario Outline: Priority is calculated from impact and urgency
    When I populate the incident form with:
      | field             | value               |
      | caller_id         | Abel Tuter          |
      | short_description | Priority matrix test — impact <impact>, urgency <urgency> |
      | impact            | <impact>            |
      | urgency           | <urgency>           |
      | category          | Software            |
      | assignment_group  | Service Desk        |
    And I submit the form
    Then the incident is created successfully
    And the "priority" field value is "<expected_priority>"
    And the incident number is captured for cleanup

    Examples:
      | impact     | urgency    | expected_priority |
      | 1 - High   | 1 - High   | 1 - Critical      |
      | 1 - High   | 2 - Medium | 2 - High          |
      | 1 - High   | 3 - Low    | 3 - Moderate      |
      | 2 - Medium | 1 - High   | 2 - High          |
      | 2 - Medium | 2 - Medium | 3 - Moderate      |
      | 2 - Medium | 3 - Low    | 4 - Low           |
      | 3 - Low    | 1 - High   | 3 - Moderate      |
      | 3 - Low    | 2 - Medium | 4 - Low           |
      | 3 - Low    | 3 - Low    | 5 - Planning      |