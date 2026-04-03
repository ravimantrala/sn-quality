---
name: incident-priority-readonly
plan: Incident Auto-Priority Assignment
table: incident
---

# Build Spec: Priority Field Read-Only

## Artifacts to Create

Shares the UI Policy artifact from `incident-auto-priority-matrix.build.md`:

### 1. UI Policy: Priority Read-Only
- **Skill:** (SDK Fluent — supported in SDK 4.3+)
- **Table:** sys_ui_policy (applies to: incident)
- **Type:** ui_policy
- **Trigger:** on form load
- **Condition:** always
- **Behavior:** Makes the Priority field read-only
- **Actions:**
  | Field | Read-Only | Visible | Mandatory |
  |-------|-----------|---------|-----------|
  | priority | true | true | false |

## Dependencies

- No dependencies

## Acceptance Criteria

| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| UI Policy | Priority field is read-only on new form | Scenario 1 |
| UI Policy | Priority field is read-only on existing record | Scenario 2 |

## Rollback

- UI Policy "Priority Read-Only": delete (new record)
