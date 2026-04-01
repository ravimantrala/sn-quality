---
name: sn-generate-contracts
description: Generate rich Gherkin quality contracts (.feature files) from developer intent and instance metadata. Use when the user wants to create test contracts for their ServiceNow app.
---

# SN Generate Contracts

Write production-quality Gherkin .feature files to the contracts/ directory based on developer intent and instance metadata.

## Workflow

1. If instance metadata isn't already available, run `/sn-discover` first to understand what artifacts exist (business rules, UI policies, ACLs, notifications, SLAs)
2. Ask the user what behavior they want to test (or infer from context)
3. Generate rich, end-to-end Gherkin contracts following the style guide below
4. Write the .feature file(s) to the `contracts/` directory using the Write tool:
   - Path: `C:/Users/ravi.mantrala/documents/claude_builds/sn-quality/contracts/<name>.feature`
   - Use kebab-case for filenames (e.g. `incident-p1-lifecycle.feature`)

## Gherkin Style Guide — ALWAYS follow this

### Tags
Every feature and scenario MUST have descriptive tags for filtering and reporting:
- Feature-level: `@P1`, `@Critical`, `@IncidentManagement`, `@ChangeManagement`, etc.
- Scenario-level: `@Smoke`, `@Creation`, `@Assignment`, `@SLA`, `@Notification`, `@Escalation`, `@UIPolicy`, `@StateTransition`, etc.

### Feature Header
Always include a proper user story:
```gherkin
@P1 @Critical @IncidentManagement
Feature: ServiceNow P1 Incident Lifecycle
  As an ITIL process owner
  I need to validate the end-to-end P1 incident flow
  So that critical outages are handled within SLA with proper escalation
```

### Background
Include preconditions with data tables for SLA definitions and plugin requirements:
```gherkin
  Background:
    Given I am logged into ServiceNow as an ITIL user
    And the Major Incident Management plugin is active
    And the following SLA definitions exist:
      | priority | response_target | resolution_target |
      | 1        | 15 minutes      | 1 hour            |
```

### Scenario Sections
Use comment dividers between scenarios for readability:
```gherkin
  # -------------------------------------------------------------------
  # Scenario 1: P1 Incident Creation and Auto-Classification
  # -------------------------------------------------------------------
```

### Data Tables for Form Population
ALWAYS use data tables when populating forms — never inline individual field steps:
```gherkin
  @Creation @Smoke
  Scenario: Create a P1 incident with required fields and validate priority engine
    When I navigate to "incident_list.do"
    And I click "New"
    And I populate the incident form with:
      | field              | value                                      |
      | caller_id          | Abel Tuter                                 |
      | short_description  | Production database cluster unreachable     |
      | description        | All primary and secondary nodes unresponsive |
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
```

### Scenario Outlines for Matrix/Combinatorial Testing
Use Scenario Outline with Examples tables for parameterized tests:
```gherkin
  @Matrix @Smoke
  Scenario Outline: Priority is calculated from impact and urgency
    When I populate the incident form with:
      | field             | value               |
      | caller_id         | Abel Tuter          |
      | short_description | Priority matrix test — impact <impact>, urgency <urgency> |
      | impact            | <impact>            |
      | urgency           | <urgency>           |
    And I submit the form
    Then the "priority" field value is "<expected_priority>"

    Examples:
      | impact     | urgency    | expected_priority |
      | 1 - High   | 1 - High   | 1 - Critical      |
      | 1 - High   | 2 - Medium | 2 - High          |
```

### Related List and Cross-Entity Verification
Validate SLAs, notifications, emails, and related records — not just form fields:
```gherkin
    When I navigate to the related list "Task SLAs"
    Then an SLA record exists with:
      | sla_definition                    | stage        |
      | Priority 1 resolution (1 hour)    | In Progress  |

    When I navigate to the related list "Emails"
    Then an email record exists matching:
      | notification_name              | recipients_include |
      | Incident assigned to my group  | Database           |
```

### State Transitions and Updates
Use update tables for modifying existing records:
```gherkin
    When I update the incident with:
      | field         | value          |
      | assigned_to   | David Loo      |
    And I save the form
    Then the "state" field value is "In Progress"
```

### End-to-End Lifecycle Coverage
Contracts should cover the full lifecycle, not isolated checks. For any feature, include scenarios for:
1. **Creation** — form population with data tables, auto-classification
2. **UI Policies** — read-only fields, mandatory fields, visibility rules
3. **State Transitions** — assignment, in progress, resolution, closure
4. **SLA Verification** — timer attachment, stage progression
5. **Notifications** — email records in related lists
6. **Recalculation/Escalation** — field changes triggering re-evaluation
7. **Cleanup references** — capture incident numbers for cleanup

### What NOT to Do
- Do NOT write bare `When I set "Field" to "Value"` steps without data tables
- Do NOT write scenarios that only check a single field in isolation
- Do NOT omit tags from features or scenarios
- Do NOT skip section comment dividers between scenarios
- Do NOT forget to verify downstream effects (SLAs, notifications, state changes)

## Reference Examples

Use these as the gold standard when generating new contracts.

### Example 1: End-to-End Lifecycle Contract (incident-p1-lifecycle.feature)

```gherkin
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
```

### Example 2: Matrix/Combinatorial Contract (incident-priority-matrix.feature)

```gherkin
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
```

### Example 3: Recalculation/Escalation Contract (incident-priority-recalculation.feature)

```gherkin
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
    And a notification is sent for "Incident Priority Raised"

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
    And a notification is sent for "Incident Priority Raised"
    And an SLA record is attached with definition "Priority 1 resolution (1 hour)"
```

## Output

Confirm which files were written and suggest running `/sn-review-contracts` to inspect them.
