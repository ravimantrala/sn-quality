---
name: incident-auto-priority-matrix
plan: Incident Auto-Priority Assignment
table: incident
---

# Build Spec: Incident Auto-Priority Matrix

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
  | table | incident |
  | when | before |
  | action | insert, update |
  | order | 50 |
  | active | true |
  | filterCondition | impactCHANGES^ORurgencyCHANGES |
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

## Dependencies

- No dependencies — single artifact

## Acceptance Criteria

| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| Business Rule | Priority auto-calculated from matrix | All 9 impact/urgency combinations |

## Rollback

- Business Rule "Auto Priority from Impact Urgency": delete (new record)
