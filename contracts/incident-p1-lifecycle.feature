@P1 @Critical @IncidentManagement
Feature: ServiceNow P1 Incident Lifecycle
  As an ITIL process owner
  I need to validate the end-to-end P1 incident flow
  So that critical outages are handled within SLA with proper escalation

  Background:
    Given I am logged in as an ITIL user

  # -------------------------------------------------------------------
  # Scenario 1: P1 Incident Creation and Auto-Classification
  # -------------------------------------------------------------------
  @Creation @Smoke
  Scenario: Create a P1 incident with required fields and validate priority engine
    When I insert a record into "incident" with:
      | field              | value                                      |
      | caller_id          | Abel Tuter                                 |
      | short_description  | Production database cluster unreachable     |
      | description        | All primary and secondary nodes unresponsive since 03:42 UTC |
      | impact             | 1 - High                                   |
      | urgency            | 1 - High                                   |
      | category           | Database                                   |
      | subcategory        | DB2                                        |
      | assignment_group   | Database                                   |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 1     |
      | state    | =        | 1     |
    And a record in "task_sla" exists where:
      | field | operator | value                          |
      | task  | =        | ${created.sys_id}              |

  # -------------------------------------------------------------------
  # Scenario 2: Assignment and State Transition to In Progress
  # -------------------------------------------------------------------
  @Assignment @StateTransition
  Scenario: Assigning the incident moves state to In Progress
    When I insert a record into "incident" with:
      | field              | value                                      |
      | caller_id          | Abel Tuter                                 |
      | short_description  | State transition test — assignment          |
      | impact             | 1 - High                                   |
      | urgency            | 1 - High                                   |
      | category           | Database                                   |
      | assignment_group   | Database                                   |
    When I update the "incident" record with:
      | field       | value     |
      | assigned_to | David Loo |
    Then the "incident" record has:
      | field       | operator | value |
      | state       | =        | 2     |

  # -------------------------------------------------------------------
  # Scenario 3: SLA Timer Is Running
  # -------------------------------------------------------------------
  @SLA @Timer
  Scenario: SLA response and resolution timers are active after P1 creation
    When I insert a record into "incident" with:
      | field              | value                                      |
      | caller_id          | Abel Tuter                                 |
      | short_description  | SLA timer test — P1 creation                |
      | impact             | 1 - High                                   |
      | urgency            | 1 - High                                   |
      | category           | Database                                   |
      | assignment_group   | Database                                   |
    Then a record in "task_sla" exists where:
      | field | operator | value             |
      | task  | =        | ${created.sys_id} |
      | stage | =        | in_progress       |

  # -------------------------------------------------------------------
  # Scenario 4: Notification Fired on Creation
  # -------------------------------------------------------------------
  @Notification
  Scenario: Stakeholders are notified when P1 incident is created
    When I insert a record into "incident" with:
      | field              | value                                      |
      | caller_id          | Abel Tuter                                 |
      | short_description  | Notification test — P1 creation             |
      | impact             | 1 - High                                   |
      | urgency            | 1 - High                                   |
      | category           | Database                                   |
      | assignment_group   | Database                                   |
    Then an outbound email was sent
