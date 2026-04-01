---
name: sn-summary
description: Generate a quality report showing contract count, coverage percentage, and artifact breakdown. Use after testing to see the overall quality posture.
---

# SN Summary

Generate a quality summary report: contract count, coverage (contracted artifacts vs. total instance artifacts), and breakdown by artifact type.

## Arguments

Collect from the user (or infer from context) — at least one is recommended:
- **table** (optional): Table to compute coverage for (e.g. `incident`)
- **scope** (optional): Application scope to compute coverage for
- **contracts_dir** (optional): Path to contracts directory (default: `contracts`)

## Execution

Run this command from the sn-quality project root:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts summary '<JSON_ARGS>'
```

Example:
```json
{"table": "incident"}
```

## Output

Present the report clearly: contract count, coverage %, artifact breakdown, and whether the quality gate passes or is blocked.
