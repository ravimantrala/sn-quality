---
name: sn-rollback
description: Roll back the last deploy by restoring updated records to their original state and deleting created records. Reads from test-results/deploy-snapshot.json.
---

# SN Rollback

Reverse the last deploy operation. Records that were **created** get **deleted**. Records that were **updated** get **restored** to their pre-deploy state from the snapshot.

## How it works

Every `/sn-deploy` automatically captures a snapshot in `test-results/deploy-snapshot.json`:
- For **new** records: stores the sys_id and table (rollback = delete)
- For **updated** records: stores the full original record values before overwriting (rollback = restore)

## Arguments

- **dry_run** (optional): Set to `true` to preview what would happen without making changes

## Execution

```bash
# Preview what will be rolled back:
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts rollback '{"dry_run":true}'

# Execute the rollback:
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts rollback '{}'
```

## Output

Reports each artifact rolled back:
- **deleted** — record was created by deploy, now removed
- **restored** — record was updated by deploy, now restored to original state
- **error** — rollback failed for this record (details provided)

The snapshot is cleared after a successful rollback to prevent accidental double-rollback.

## Safety

Always run with `dry_run: true` first and confirm with the user before executing. Show them what will be rolled back. This operation modifies live instance data.

## Limitations

- Rollback reverses ALL entries in the snapshot (no partial rollback)
- `sys_*` metadata fields are not restored (they are system-managed)
- If the record was modified by someone else after deploy, rollback overwrites those changes too
