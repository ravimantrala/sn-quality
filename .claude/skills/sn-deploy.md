---
name: sn-deploy
description: Deploy any ServiceNow record to the instance via REST API. Table-agnostic — works with any table the API exposes. Use when the user wants to push app configuration to their instance.
---

# SN Deploy

Deploy records to any ServiceNow table. Creates new records or updates existing ones. Automatically snapshots pre-deploy state for rollback.

## Arguments

- **records** (required): Array of records to deploy, each with:
  - **target_table**: ServiceNow table name (e.g. `sys_script`, `sc_cat_item`, `item_option_new`, `question_choice`, `sys_ui_policy`, `change_request`, anything)
  - **lookup** (optional): Encoded query to find an existing record to update (e.g. `name=My Rule^collection=incident`). If omitted, always inserts.
  - **fields**: Object of field name → value pairs to set on the record
  - **label** (optional): Human-readable label for logging (e.g. "Auto Priority Business Rule")

## Execution

Run this command from the sn-quality project root:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts deploy '<JSON_ARGS>'
```

### Examples

**Business rule:**
```json
{"records": [{"target_table": "sys_script", "lookup": "name=My Rule^collection=incident", "label": "My Rule", "fields": {"name": "My Rule", "collection": "incident", "when": "before", "order": "100", "active": "true", "script": "// rule logic"}}]}
```

**Catalog item:**
```json
{"records": [{"target_table": "sc_cat_item", "lookup": "name=Hardware Checkout", "label": "Hardware Checkout catalog item", "fields": {"name": "Hardware Checkout", "short_description": "Request hardware devices", "category": "d258b953c611227a0146101fb1be7c31", "active": "true"}}]}
```

**Catalog variable:**
```json
{"records": [{"target_table": "item_option_new", "label": "device_type variable", "fields": {"cat_item": "<cat_item_sys_id>", "name": "device_type", "question_text": "Device Type", "type": "5", "mandatory": "true"}}]}
```

**Variable choice:**
```json
{"records": [{"target_table": "question_choice", "label": "Mac Laptop choice", "fields": {"question": "<variable_sys_id>", "value": "mac_laptop", "text": "Mac Laptop", "order": "100"}}]}
```

**Any other table** — just provide `target_table` and `fields`. The deploy command works with any table the ServiceNow REST API exposes.

## Behavior

- If `lookup` is provided and a matching record exists → **snapshot original state** then **update**
- If `lookup` is provided and no match → **insert**
- If no `lookup` → **always insert**
- All actions are recorded in `test-results/deploy-snapshot.json` for `/sn-rollback`
- Deploy returns sys_ids for each created/updated record — use these for dependent records (e.g. variable needs catalog item sys_id)

## Multi-step deploys

When deploying dependent records (e.g. catalog item → variables → choices), deploy in order and use the returned sys_ids:

1. Deploy the catalog item → get `cat_item_sys_id`
2. Deploy variables with `cat_item: cat_item_sys_id` → get `variable_sys_id`
3. Deploy choices with `question: variable_sys_id`

## Output

Report what was created vs updated, with sys_ids and table names.

## Safety

Always confirm with the user before deploying. Show them exactly what will be created/updated.
