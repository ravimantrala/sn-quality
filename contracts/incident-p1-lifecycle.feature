@P1 @Critical @IncidentManagement
Feature: ServiceNow P1 Incident Lifecycle
  As an ITIL process owner
  I need to validate the end-to-end P1 incident flow
  So that critical outages are handled within SLA with proper escalation

  Background:
    Given I am logged into ServiceNow as an ITIL user
    And the Major Incident Management plugin is active
    And the following SLA definitions exist:
      | priority | response_target | resolution_target |
      | 1        | 15 minutes      | 1 hour            |

  # -------------------------------------------------------------------
  # Scenario 1: P1 Incident Creation and Auto-Classification
  # -------------------------------------------------------------------
  @Creation @Smoke
  Scenario: Create a P1 incident with required fields and validate priority engine
    When I navigate to "incident_list.do"
    And I click "New"
    And I populate the incident form with:
      | field              | value                                      |
      | caller_id          | Abel Tuter                                 |
      | short_description  | Production database cluster unreachable     |
      | description        | All primary and secondary nodes unresponsive since 03:42 UTC. Customer-facing APIs returning 503. |
      | impact             | 1 - High                                   |
      | urgency            | 1 - High                                   |
      | category           | Database                                   |
      | subcategory        | DB2                                        |
      | assignment_group   | Database                                   |
      | cmdb_ci            | lnux100                                    |
    And I submit the form
    Then the incident is created successfully
    And the "priority" field value is "1 - Critical"
    And the "state" field value is "New"
    And an SLA record is attached with definition "Priority 1 resolution (1 hour)"
    And the incident number is captured for subsequent steps

  # -------------------------------------------------------------------
  # Scenario 2: Priority Field is Read-Only (No Manual Override)
  # -------------------------------------------------------------------
  @UIPolicy @Priority
  Scenario: Priority field cannot be manually overridden
    Given I open the previously created P1 incident
    Then the "priority" field is read-only
    And the "priority" field value is "1 - Critical"

  # -------------------------------------------------------------------
  # Scenario 3: Assignment and State Transition to In Progress
  # -------------------------------------------------------------------
  @Assignment @StateTransition
  Scenario: Assigning the incident moves state to In Progress
    Given I open the previously created P1 incident
    When I update the incident with:
      | field         | value          |
      | assigned_to   | David Loo      |
    And I save the form
    Then the "state" field value is "In Progress"
    And the "assigned_to" field value is "David Loo"

  # -------------------------------------------------------------------
  # Scenario 4: SLA Timer Is Running
  # -------------------------------------------------------------------
  @SLA @Timer
  Scenario: SLA response and resolution timers are active
    Given I open the previously created P1 incident
    When I navigate to the related list "Task SLAs"
    Then an SLA record exists with:
      | sla_definition                    | stage        |
      | Priority 1 resolution (1 hour)    | In Progress  |
      | Priority 1 response (15 minutes)  | In Progress  |

  # -------------------------------------------------------------------
  # Scenario 5: Notification Fired on Creation
  # -------------------------------------------------------------------
  @Notification
  Scenario: Stakeholders are notified when P1 incident is created
    Given I open the previously created P1 incident
    When I navigate to the related list "Emails"
    Then an email record exists matching:
      | notification_name              | recipients_include |
      | Incident assigned to my group  | Database           |