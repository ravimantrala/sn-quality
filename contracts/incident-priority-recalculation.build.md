---
name: incident-priority-recalculation
plan: Incident Auto-Priority Assignment
table: incident
---

# Build Spec: Priority Recalculation on Change

## Artifacts to Create

No additional artifacts — this contract validates the same business rule from `incident-auto-priority-matrix.build.md` but tests recalculation on update (not just insert).

## Dependencies

- Business Rule "Auto Priority from Impact Urgency" must be active (from `incident-auto-priority-matrix.build.md`)

## Acceptance Criteria

| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| Business Rule | Priority recalculates when urgency changes | Urgency escalation scenario |
| Business Rule | Priority recalculates when impact changes | Impact escalation scenario |
| Business Rule | Priority recalculates when both change | Double escalation scenario |

## Rollback

- No additional rollback — handled by `incident-auto-priority-matrix.build.md`
