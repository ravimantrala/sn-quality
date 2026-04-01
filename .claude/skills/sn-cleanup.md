---
name: sn-cleanup
description: Delete test records from a ServiceNow instance. Use after testing to remove artifacts created by sn-deploy or test execution.
---

# SN Cleanup

Batch delete records from the ServiceNow instance by table + sys_id. This is the rollback mechanism for removing test data.

## Arguments

Collect from the user (or infer from context):
- **records** (required): Array of objects, each with:
  - **table**: ServiceNow table name (e.g. `sys_script`)
  - **sys_id**: Record sys_id to delete

## Execution

Run this command from the sn-quality project root:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts cleanup '<JSON_ARGS>'
```

Example:
```json
{"records": [{"table": "sys_script", "sys_id": "abc123def456"}]}
```

## Output

Report how many records were deleted vs errors.

## Safety

Always confirm with the user before deleting. This is a destructive operation — records cannot be recovered.
