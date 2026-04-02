---
name: sn-cleanup
description: Delete test records from a ServiceNow instance. Reads from test-results/records.json or accepts explicit records. Use after testing to remove artifacts.
---

# SN Cleanup

Batch delete records from the ServiceNow instance. Can read tracked records automatically from `test-results/records.json` (populated by `/sn-execute`), or accept explicit records.

## Arguments

- **records** (optional): Array of objects, each with:
  - **table**: ServiceNow table name (e.g. `sys_script`)
  - **sys_id**: Record sys_id to delete
- **purpose** (optional): Filter tracked records by purpose — `test_data` or `deployed_artifact`. Only applies when reading from the registry.

If no records are provided, the command reads from `test-results/records.json`.

## Execution

Run this command from the sn-quality project root:

```bash
# Auto-read from registry (all tracked records):
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts cleanup '{}'

# Auto-read, test data only (preserves deployed artifacts):
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts cleanup '{"purpose":"test_data"}'

# Explicit records:
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts cleanup '{"records":[{"table":"sys_script","sys_id":"abc123def456"}]}'
```

## Listing tracked records

To see what records are tracked before cleaning up:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts record '{"action":"list"}'

# Filter by purpose:
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts record '{"action":"list","purpose":"test_data"}'
```

## Output

Report how many records were deleted vs errors. After cleanup from the registry, the registry is automatically cleared.

## Safety

Always confirm with the user before deleting. This is a destructive operation — records cannot be recovered.
