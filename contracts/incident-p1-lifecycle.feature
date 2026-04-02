@P1 @Critical @IncidentManagement
Feature: ServiceNow P1 Incident Lifecycle
  As an ITIL process owner
  I need to validate the end-to-end P1 incident flow
  So that critical outages are handled within SLA with proper escalation

  Background:
    Given I am logged into ServiceNow as an ITIL user
    And the following SLA definitions exist:
      | priority | response_target | resolution_target |
      | 1        | 15 minutes      | 1 hour            |

  # -------------------------------------------------------------------
  # Scenario 1: P1 Incident Creation and Auto-Classification
  # -------------------------------------------------------------------
  @Creation @Smoke
  Scenario: Create a P1 incident with required fields and validate priority engine
    When I populate the incident form with:
      | field              | value                                      |
      | caller_id          | Abel Tuter                                 |
      | short_description  | Production database cluster unreachable     |
      | description        | All primary and secondary nodes unresponsive since 03:42 UTC. Customer-facing APIs returning 503. |
      | impact             | 1 - High                                   |
      | urgency            | 1 - High                                   |
      | category           | Database                                   |
      | assignment_group   | Database                                   |
    And I submit the form
    Then the "priority" field value is "1 - Critical"
    And the "state" field value is "New"
