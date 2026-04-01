---
name: sn-discover
description: Scan a ServiceNow instance for all configured artifacts on a table or scope. Use when the user wants to understand what business rules, UI policies, ACLs, notifications, and SLAs exist.
---

# SN Discover

Scan instance metadata for a given scope or table. Returns business rules, UI policies, ACLs, notifications, and SLA definitions.

## Arguments

Collect from the user (or infer from context) — at least one is required:
- **scope** (optional): Application scope (e.g. `x_hr_case_mgmt`)
- **table** (optional): Table name (e.g. `incident`)

## Execution

Run this command from the sn-quality project root:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts discover '<JSON_ARGS>'
```

Where `<JSON_ARGS>` is a JSON object like:
```json
{"table": "incident"}
{"scope": "x_hr_case_mgmt"}
```

## Output

Present the results as a summary table showing artifact counts, then list details per category. This data is useful for understanding the configuration landscape before generating quality contracts.
