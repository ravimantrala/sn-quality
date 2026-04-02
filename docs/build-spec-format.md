# Build Spec Format

Build specs (`.build.md`) are paired 1:1 with Gherkin contracts (`.feature`). They tell Build Agent **what to create** on the ServiceNow instance to make the contract's tests pass.

Build Agent uses skills from `dev/build-agent-skills` (installed via `sn-skills add dev/build-agent-skills`). Each artifact in the build spec maps to a specific Build Agent skill.

## File naming

```
contracts/
  incident-auto-priority.feature        ← Test contract (Gherkin)
  incident-auto-priority.build.md       ← Build spec (for Build Agent)
  hardware-checkout.feature
  hardware-checkout.build.md
```

Every `.feature` file MUST have a corresponding `.build.md`. Every `.build.md` MUST have a corresponding `.feature`. They are always generated together from the same approved plan.

## Build Agent Skill Mapping

Each artifact type maps to a Build Agent skill. Include the `skill:` field so Build Agent knows which skill to invoke.

| Artifact Type | Build Agent Skill | ServiceNow Table |
|---------------|------------------|------------------|
| Table | `sn-table` | sys_db_object |
| Business Rule | `sn-business-rule` | sys_script |
| Client Script | `sn-client-script` | sys_script_client |
| UI Policy | (part of `sn-service-catalog` for catalog, or manual for platform) | sys_ui_policy |
| Script Include | `sn-script-include` | sys_script_include |
| Scripted REST API | `sn-scripted-rest-api` | sys_ws_definition |
| Catalog Item | `sn-service-catalog` | sc_cat_item |
| Catalog Variable | `sn-service-catalog` | item_option_new |
| Variable Set | `sn-service-catalog` | item_option_new_set |
| Catalog UI Policy | `sn-service-catalog` | catalog_ui_policy |
| Catalog Client Script | `sn-service-catalog` | catalog_script_client |
| Record Producer | `sn-service-catalog` | sc_cat_item_producer |
| Flow | `sn-wfa-flow` | sys_hub_flow |
| Email Notification | `sn-email-notification` | sysevent_email_action |
| Scheduled Script | `sn-scheduled-script` | sysauto_script |
| ACL / Security | `sn-implementing-security` | sys_security_acl |
| ATF Test | `sn-implementing-tests` | sys_atf_test |
| UI Page | `sn-ui-page` | sys_ui_page |
| Module | `sn-module` | sys_app_module |
| Property | `sn-property` | sys_properties |
| Workspace | `sn-creating-workspaces` | — |

## Format

```markdown
---
name: <name matching the .feature file>
plan: <reference to the approved plan section>
table: <primary table or scope>
---

# Build Spec: <title>

## Artifacts to Create

### 1. <Artifact type>: <name>
- **Skill:** <Build Agent skill name, e.g. `sn-business-rule`, `sn-service-catalog`>
- **Table:** <ServiceNow table to create the record on>
- **Type:** <business_rule | ui_policy | client_script | catalog_item | variable | flow | etc.>
- **Trigger:** <when this artifact fires — insert, update, display, async, etc.>
- **Condition:** <when it applies>
- **Behavior:** <what it does, referencing specific plan behaviors>
- **Fields:**
  | Field | Value |
  |-------|-------|
  | field_name | value |
  | ... | ... |

### 2. <next artifact>
...

## Dependencies

- <artifact 1> must be created before <artifact 2> (e.g., catalog item before variables)
- <references to existing instance artifacts from discovery>

## Acceptance Criteria

Each artifact maps to specific Gherkin scenarios:

| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| <artifact name> | <what it proves> | <scenario name from .feature> |

## Rollback

If tests fail, these artifacts should be removed or reverted:
- <artifact 1>: delete (was created)
- <artifact 2>: restore original (was updated)
```

## Example: incident-auto-priority.build.md

```markdown
---
name: incident-auto-priority
plan: Incident Auto-Priority Assignment
table: incident
---

# Build Spec: Incident Auto-Priority Assignment

## Artifacts to Create

### 1. Business Rule: Auto Priority from Impact Urgency
- **Skill:** `sn-business-rule`
- **Table:** sys_script (creates on: incident)
- **Type:** business_rule
- **Trigger:** before insert, before update
- **Condition:** impact changes OR urgency changes
- **Behavior:** Calculates priority from 3x3 impact/urgency matrix
- **Fields:**
  | Field | Value |
  |-------|-------|
  | name | Auto Priority from Impact Urgency |
  | collection | incident |
  | when | before |
  | order | 50 |
  | active | true |
  | action_insert | true |
  | action_update | true |
  | filter_condition | impact CHANGES OR urgency CHANGES |

- **Logic (priority matrix):**
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
- **Skill:** `sn-service-catalog` (platform UI policy)
- **Table:** sys_ui_policy (applies to: incident)
- **Type:** ui_policy
- **Trigger:** on form load
- **Condition:** always (no condition)
- **Behavior:** Makes the Priority field read-only so users cannot manually override
- **Fields:**
  | Field | Value |
  |-------|-------|
  | short_description | Priority Read-Only |
  | table | incident |
  | active | true |
  | on_load | true |
  | global | true |
- **Actions:**
  | Field | Read-Only | Visible | Mandatory |
  |-------|-----------|---------|-----------|
  | priority | true | true | false |

## Dependencies

- No dependencies between artifacts — business rule and UI policy are independent
- Existing SLA definitions (P1-P5) will auto-attach based on priority value

## Acceptance Criteria

| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| Business Rule | Priority calculated from matrix | Priority is calculated from impact and urgency (9 outline examples) |
| Business Rule | Priority recalculates on update | Priority upgrades when urgency/impact is raised (3 scenarios) |
| UI Policy | Priority field is read-only | Create a P1 incident — priority field value is "1 - Critical" |

## Rollback

- Business Rule "Auto Priority from Impact Urgency": delete (new record)
- UI Policy "Priority Read-Only": delete (new record)
```
