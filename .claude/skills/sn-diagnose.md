---
name: sn-diagnose
description: Diagnose a quality contract test failure by querying instance metadata. Use when a test fails and the user wants to understand why — returns business rules, UI policies, and ACLs relevant to the failure.
---

# SN Diagnose

Analyze a test failure by pulling instance metadata relevant to the failing scenario. Returns business rules (with execution order, conditions, scripts), UI policies, and ACLs for the table involved.

## Arguments

Collect from the user (or infer from context):
- **table** (required): ServiceNow table the failing test operated on (e.g. `incident`)
- **error_message** (required): The error message from the failed test
- **scenario_name** (required): Name of the failed scenario
- **fields** (optional): Array of field names involved in the failure

## Execution

Run this command from the sn-quality project root:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts diagnose '<JSON_ARGS>'
```

Example:
```json
{"table": "incident", "fields": ["priority", "assignment_group"], "error_message": "Expected P1 but got P4", "scenario_name": "Priority auto-calculation"}
```

## Output

Analyze the diagnostic data and explain the likely root cause. Look at business rule execution order, conditions, and scripts to identify what might be interfering with the expected behavior.
