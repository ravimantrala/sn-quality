---
name: sn-deploy
description: Deploy ServiceNow artifacts (business rules, UI policies, ACLs, notifications, client scripts) to the instance via REST API. Use when the user wants to push app configuration to their instance.
---

# SN Deploy

Deploy application artifacts to the ServiceNow instance. Creates new records or updates existing ones.

## Arguments

Collect from the user (or infer from context):
- **artifacts** (required): Array of artifacts, each with:
  - **type**: One of `business_rule`, `ui_policy`, `acl`, `notification`, `client_script`
  - **name**: Artifact name
  - **table**: Target table (e.g. `incident`)
  - **config**: Object of field values for the record
- **scope** (optional): Application scope

## Execution

Run this command from the sn-quality project root:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts deploy '<JSON_ARGS>'
```

Example:
```json
{"artifacts": [{"type": "business_rule", "name": "My Rule", "table": "incident", "config": {"active": "true", "when": "before", "order": "100", "script": "// rule logic"}}]}
```

## Output

Report what was created vs updated, with sys_ids. Warn the user to save sys_ids for cleanup later.

## Safety

Always confirm with the user before deploying. Show them exactly what will be created/updated.
