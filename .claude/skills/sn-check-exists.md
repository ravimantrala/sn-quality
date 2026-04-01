---
name: sn-check-exists
description: Check if a ServiceNow artifact exists on the instance. Use when the user wants to verify tables, fields, groups, business rules, UI policies, SLAs, or notifications exist.
---

# SN Check Exists

Validate that a ServiceNow artifact exists on the instance.

## Arguments

Collect from the user (or infer from context):
- **type** (required): One of `assignment_group`, `table`, `field`, `sla_definition`, `ui_policy`, `business_rule`, `notification`
- **name** (required): Name or identifier of the artifact
- **table** (optional): Required for `field` type checks — the table the field belongs to

## Execution

Run this command from the sn-quality project root:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts check-exists '<JSON_ARGS>'
```

Where `<JSON_ARGS>` is a JSON object like:
```json
{"type": "table", "name": "incident"}
{"type": "field", "name": "priority", "table": "task"}
{"type": "business_rule", "name": "mark_closed"}
```

## Output

Report whether the artifact exists, and show any details returned (sys_id, label, active state, etc.).
