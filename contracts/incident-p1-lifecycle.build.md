---
name: incident-p1-lifecycle
plan: P1 Incident Lifecycle
table: incident
---

# Build Spec: P1 Incident Lifecycle

## Artifacts to Create

No new artifacts — this contract validates OOB P1 incident behavior:
- Priority auto-calculation (OOB business rule)
- State transitions on assignment (OOB business rule)
- SLA attachment (OOB SLA definitions)
- Email notifications (OOB notification rules)

Shares artifacts with `incident-auto-priority-matrix.build.md` for the priority business rule.

## Dependencies

- OOB priority calculation business rule must be active
- OOB SLA definitions for Priority 1 must exist
- OOB notification rules for incident assignment must be active

## Acceptance Criteria

| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| OOB priority rule | Priority = 1 for impact 1 + urgency 1 | P1 creation scenario |
| OOB state transition | State changes to In Progress on assignment | Assignment scenario |
| OOB SLA definitions | Task SLA records attached | SLA timer scenario |
| OOB notifications | Outbound email created | Notification scenario |

## Rollback

- No artifacts to roll back — tests validate OOB behavior
