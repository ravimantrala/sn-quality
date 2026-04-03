---
name: sn-generate-contracts
description: Generate paired Gherkin test contracts (.feature) and build specs (.build.md) from an approved plan. Every feature file gets a build spec. Uses Build Agent skills for accurate artifact definitions. Use when the user wants to create test contracts for their ServiceNow app.
allowed-tools: Read, Write, Grep, Glob
---

# SN Generate Contracts

Generate **paired** files from an approved `/sn-plan` output:
- `.feature` — Gherkin test contract (what to test, for Playwright)
- `.build.md` — Build spec (what to create, for Build Agent via `/sn-build`)

These are always 1:1. Every `.feature` MUST have a `.build.md`. They come from the same plan.

## Workflow

1. **Require an approved plan.** Do NOT generate contracts without a plan from `/sn-plan`. The plan's Behaviors become Gherkin scenarios. The plan's Decision Matrix becomes Scenario Outlines. The plan's Assumptions become background context.
2. If instance metadata isn't already available, run `/sn-discover` first
3. **Load the ATF-Gherkin mapping** from `docs/atf-gherkin-mapping.md`. Match customer intent to existing ATF step configs first. Only create custom Gherkin sentences when no ATF step covers the intent.
4. **Load Build Agent skills** for each artifact type in the plan (see Build Agent Skill Loading below)
5. Generate the `.feature` file following the Gherkin Style Guide below — **preferring ATF-mapped Gherkin sentences**
6. Generate the paired `.build.md` file following the Build Spec Format below — using Build Agent skill knowledge to ensure artifact definitions match what the skills expect
7. Write both files to the `contracts/` directory:
   - `contracts/<name>.feature` — Gherkin test contract
   - `contracts/<name>.build.md` — Build spec for Build Agent
   - Use kebab-case for filenames (e.g. `incident-auto-priority.feature` + `incident-auto-priority.build.md`)

## ATF Step Mapping (Priority One)

Before writing any Gherkin, read `docs/atf-gherkin-mapping.md`. This file maps all 104 active ATF step configs to Gherkin sentence patterns.

**Rule: ATF-mapped steps first, custom Gherkin second.**

For each scenario in the plan:
1. Identify what the scenario tests (record insert, field validation, catalog order, etc.)
2. Find the matching ATF step(s) in the mapping
3. Use the mapped Gherkin sentence pattern
4. Only write custom Gherkin when no ATF step covers the intent

**Why:** ATF-mapped Gherkin can be converted to both Playwright (off-platform) and Testing Library code (on-platform via ATF runner). Custom Gherkin only works with Playwright.

Common mappings for quick reference:

| Intent | ATF Step | Gherkin Pattern |
|--------|----------|-----------------|
| Create a record | Record Insert | `When I insert a record into "<table>" with:` |
| Update a record | Record Update | `When I update the "<table>" record with:` |
| Check field values | Record Validation | `Then the "<table>" record has:` |
| Check record exists | Record Query | `Then a record in "<table>" exists where:` |
| Open a form | Open a New Form | `When I open a new "<table>" form` |
| Set form fields | Set Field Values | `When I set the form field values:` |
| Submit form | Submit a Form | `When I submit the form` |
| Check field state | Field State Validation | `Then the "<field>" field is <state>` |
| Order catalog item | Order Catalog Item | `When I order the catalog item "<name>"` |
| Set catalog variables | Set Variable Values | `When I set the variable values:` |
| Impersonate user | Impersonate | `Given I am impersonating user "<name>"` |
| Send REST request | Send REST Request | `When I send a "<method>" request to "<endpoint>"` |
| Check response | Assert Status Code | `Then the response status code is "<code>"` |

## Build Agent Skill Loading

Before generating the `.build.md`, identify which artifact types the plan requires (business rules, UI policies, catalog items, etc.) and load the corresponding Build Agent skills from `/tmp/build-agent-skills/skills/`:

| Artifact Type | Skill to Load |
|--------------|---------------|
| Business Rule | `sn-business-rule/SKILL.md` + `references/knowledge/business-rule.md` |
| Client Script | `sn-client-script/SKILL.md` + `references/knowledge/client-script.md` |
| UI Policy | (use SDK docs — supported in SDK 4.3+) |
| Script Include | `sn-script-include/SKILL.md` + `references/knowledge/script-include.md` |
| Table | `sn-table/SKILL.md` + `references/knowledge/table.md` |
| Catalog Item/Variable | `sn-service-catalog/SKILL.md` + `references/knowledge/service-catalog.md` |
| Email Notification | `sn-email-notification/SKILL.md` + `references/knowledge/email-notification.md` |
| Scheduled Script | `sn-scheduled-script/SKILL.md` + `references/knowledge/scheduled-script.md` |
| Scripted REST API | `sn-scripted-rest-api/SKILL.md` + `references/knowledge/scripted-rest-api.md` |
| Flow | `sn-wfa-flow/SKILL.md` + `references/knowledge/wfa-flow.md` |
| ACL/Security | `sn-implementing-security/SKILL.md` + `references/knowledge/implementing-security.md` |

Read the SKILL.md to understand:
- Required and optional fields for the artifact type
- Naming conventions and best practices
- Avoidance patterns (what NOT to do)
- Correct timing/trigger values

Read the knowledge reference to understand:
- Fluent API object properties and their valid values
- Code examples showing correct syntax

Use this knowledge when writing the `.build.md` so that:
- The **Skill:** field references the correct Build Agent skill name
- The **Fields:** table uses field names that match the Fluent API
- The **Logic:** section is detailed enough for `/sn-build` to generate working code
- The **Trigger/Condition** values use valid options for that artifact type

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

## Build Spec Format — ALWAYS generate alongside the .feature file

For every `.feature` file, generate a paired `.build.md` with the same name. The build spec tells Build Agent what artifacts to create on the instance.

### Build Spec Structure

```markdown
---
name: <matching the .feature filename>
plan: <plan title from /sn-plan>
table: <primary table or scope>
---

# Build Spec: <title>

## Artifacts to Create

### 1. <Type>: <Name>
- **Table:** <ServiceNow table to create the record on>
- **Type:** <business_rule | ui_policy | client_script | catalog_item | variable | flow | etc.>
- **Trigger:** <when this fires — before insert, after update, on load, etc.>
- **Condition:** <when it applies>
- **Behavior:** <what it does — reference specific plan behaviors by number>
- **Fields:**
  | Field | Value |
  |-------|-------|
  | ... | ... |
- **Logic:** <decision tables, script pseudocode, or plain English logic>

### 2. <next artifact>
...

## Dependencies
<ordering constraints between artifacts, references to existing instance artifacts>

## Acceptance Criteria
| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| <name> | <what it proves> | <scenario from .feature> |

## Rollback
- <artifact>: delete (created) or restore (updated)
```

### Key Rules for Build Specs
- Every artifact in the build spec MUST map to at least one scenario in the `.feature` file
- Every scenario in the `.feature` file MUST be validated by at least one artifact in the build spec
- The Acceptance Criteria table makes this mapping explicit
- Include enough detail for Build Agent to generate the actual ServiceNow code (Fluent/SDK)
- Include the logic/decision matrix — don't just say "calculate priority", show the matrix
- Dependencies section tells Build Agent the creation order
- Rollback section tells `/sn-rollback` what to undo

### Build Spec Example (paired with incident-auto-priority.feature)

```markdown
---
name: incident-auto-priority
plan: Incident Auto-Priority Assignment
table: incident
---

# Build Spec: Incident Auto-Priority Assignment

## Artifacts to Create

### 1. Business Rule: Auto Priority from Impact Urgency
- **Table:** sys_script (creates on: incident)
- **Type:** business_rule
- **Trigger:** before insert, before update
- **Condition:** impact changes OR urgency changes
- **Behavior:** Calculates priority from 3x3 impact/urgency matrix (Plan behaviors 1, 2)
- **Fields:**
  | Field | Value |
  |-------|-------|
  | name | Auto Priority from Impact Urgency |
  | collection | incident |
  | when | before |
  | order | 50 |
  | active | true |
- **Logic:**
  | Impact | Urgency | → Priority |
  |--------|---------|-----------|
  | 1 | 1 | 1 (Critical) |
  | 1 | 2 | 2 (High) |
  | 1 | 3 | 3 (Moderate) |
  | 2 | 1 | 2 (High) |
  | 2 | 2 | 3 (Moderate) |
  | 2 | 3 | 4 (Low) |
  | 3 | 1 | 3 (Moderate) |
  | 3 | 2 | 4 (Low) |
  | 3 | 3 | 5 (Planning) |

### 2. UI Policy: Priority Read-Only
- **Table:** sys_ui_policy (applies to: incident)
- **Type:** ui_policy
- **Trigger:** on form load
- **Condition:** always
- **Behavior:** Makes Priority field read-only (Plan behavior 3)
- **Actions:**
  | Field | Read-Only | Visible | Mandatory |
  |-------|-----------|---------|-----------|
  | priority | true | true | false |

## Dependencies
- No dependencies between artifacts
- Existing P1-P5 SLA definitions will auto-attach based on priority

## Acceptance Criteria
| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| Business Rule | Priority auto-calculated | Priority matrix (9 outline examples) |
| Business Rule | Recalculates on change | Urgency/impact escalation (3 scenarios) |
| UI Policy | Field is read-only | P1 creation — priority is "1 - Critical" |

## Rollback
- Business Rule "Auto Priority from Impact Urgency": delete (new)
- UI Policy "Priority Read-Only": delete (new)
```

## Output

Confirm which paired files were written:
- `contracts/<name>.feature` — test contract
- `contracts/<name>.build.md` — build spec

Suggest running `/sn-review-contracts` to inspect them.
