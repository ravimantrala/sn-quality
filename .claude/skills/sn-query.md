---
name: sn-query
description: Query any ServiceNow table via the Table API. Use when the user wants to look up records, search tables, or retrieve data from their instance.
---

# SN Query

Query the ServiceNow Table API and return matching records.

## Arguments

Collect from the user (or infer from context):
- **table** (required): ServiceNow table name (e.g. `incident`, `sys_script`, `sys_user`)
- **query** (optional): Encoded query string (e.g. `active=true^priority=1`)
- **fields** (optional): Array of field names to return (e.g. `["number", "short_description"]`)
- **limit** (optional): Max records, default 20

## Execution

Run this command from the sn-quality project root:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts query '<JSON_ARGS>'
```

Where `<JSON_ARGS>` is a JSON object like:
```json
{"table": "incident", "query": "active=true", "fields": ["number", "short_description"], "limit": 10}
```

## Output

Present the JSON results in a readable table or summary. Highlight record count and key fields.
