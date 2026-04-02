---
name: sn-build
description: Build and deploy ServiceNow app from .build.md specs using Now SDK Fluent code. Reads build specs, loads Build Agent skills, generates .now.ts files, builds with Now SDK, deploys to instance. Falls back to REST API for unsupported artifacts. Use after contracts are approved and RED tests pass.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# SN Build

Build ServiceNow artifacts from `.build.md` specs using the Now SDK Fluent API, guided by Build Agent skills.

## When to Use

- After contracts are approved and RED tests have run (all fail)
- Step 5 of the TDD workflow: build and deploy the app

## Prerequisites

- Approved `.build.md` files in `contracts/`
- RED test run completed (`npm test` — all fail, proving contracts test something real)
- Now SDK project scaffolded at `app/` (if not, scaffold it — see Setup below)
- Auth configured: `cd app && npx now-sdk auth --list`

## Setup (one-time)

If `app/` doesn't exist yet:

```bash
mkdir app && cd app
npx @servicenow/sdk@4.5.0 init \
  --appName "SN Quality App" \
  --packageName "sn-quality-app" \
  --scopeName "x_snc_quality" \
  --template "typescript.basic"
npm install
```

Verify auth:
```bash
cd app && npx now-sdk auth --list
```

If no credentials, STOP and tell the user to run in a separate terminal:
```bash
cd app && npx now-sdk auth --add https://<instance>.service-now.com --type basic
```

## Process

### Step 1: Parse Build Specs

1. Glob for `contracts/*.build.md`
2. Read each `.build.md` and parse:
   - **Frontmatter:** name, plan, table
   - **Artifacts:** each `### N. <Type>: <Name>` section — extract type, table, trigger, condition, behavior, fields, logic
   - **Dependencies:** ordering constraints between artifacts
3. Build an ordered artifact list respecting dependencies

### Step 2: Load Build Agent Skills

For each artifact, load the corresponding Build Agent skill:

| Build Spec Type | Build Agent Skill | Skill Path |
|----------------|------------------|------------|
| business_rule | sn-business-rule | `/tmp/build-agent-skills/skills/sn-business-rule/` |
| client_script | sn-client-script | `/tmp/build-agent-skills/skills/sn-client-script/` |
| ui_policy | (SDK Fluent — see SDK 4.3+ docs) | — |
| script_include | sn-script-include | `/tmp/build-agent-skills/skills/sn-script-include/` |
| table | sn-table | `/tmp/build-agent-skills/skills/sn-table/` |
| catalog_item | sn-service-catalog | `/tmp/build-agent-skills/skills/sn-service-catalog/` |
| catalog_variable | sn-service-catalog | `/tmp/build-agent-skills/skills/sn-service-catalog/` |
| catalog_ui_policy | sn-service-catalog | `/tmp/build-agent-skills/skills/sn-service-catalog/` |
| catalog_client_script | sn-service-catalog | `/tmp/build-agent-skills/skills/sn-service-catalog/` |
| record_producer | sn-service-catalog | `/tmp/build-agent-skills/skills/sn-service-catalog/` |
| email_notification | sn-email-notification | `/tmp/build-agent-skills/skills/sn-email-notification/` |
| scheduled_script | sn-scheduled-script | `/tmp/build-agent-skills/skills/sn-scheduled-script/` |
| scripted_rest_api | sn-scripted-rest-api | `/tmp/build-agent-skills/skills/sn-scripted-rest-api/` |
| flow | sn-wfa-flow | `/tmp/build-agent-skills/skills/sn-wfa-flow/` |
| module | sn-module | `/tmp/build-agent-skills/skills/sn-module/` |
| property | sn-property | `/tmp/build-agent-skills/skills/sn-property/` |
| acl | sn-implementing-security | `/tmp/build-agent-skills/skills/sn-implementing-security/` |
| atf_test | sn-implementing-tests | `/tmp/build-agent-skills/skills/sn-implementing-tests/` |
| ui_page | sn-ui-page | `/tmp/build-agent-skills/skills/sn-ui-page/` |

For each artifact:
1. Read `SKILL.md` from the skill directory
2. Read `references/knowledge/<type>.md` for Fluent API patterns and code examples
3. Read any additional references (`references/*.md`) if the skill instructs you to

### Step 3: Generate Fluent Code

For each artifact (in dependency order):

1. **Create the `.now.ts` file** in the appropriate subdirectory:
   - `app/src/fluent/business-rules/<kebab-name>.now.ts`
   - `app/src/fluent/client-scripts/<kebab-name>.now.ts`
   - `app/src/fluent/ui-policies/<kebab-name>.now.ts`
   - `app/src/fluent/tables/<kebab-name>.now.ts`
   - `app/src/fluent/catalog/<kebab-name>.now.ts`
   - `app/src/fluent/script-includes/<kebab-name>.now.ts`
   - `app/src/fluent/notifications/<kebab-name>.now.ts`
   - `app/src/fluent/rest-api/<kebab-name>.now.ts`
   - `app/src/fluent/flows/<kebab-name>.now.ts`
   - `app/src/fluent/modules/<kebab-name>.now.ts`
   - `app/src/fluent/properties/<kebab-name>.now.ts`
   - `app/src/fluent/scheduled/<kebab-name>.now.ts`

2. **Create server-side scripts** when the artifact has non-trivial logic:
   - `app/src/server/<kebab-name>.ts`
   - Import and reference from the `.now.ts` file via the `script` property

3. **Follow the Fluent API patterns** from the Build Agent skill's knowledge references:
   ```typescript
   import '@servicenow/sdk/global'
   import { BusinessRule } from '@servicenow/sdk/core'
   import { myFunction } from '../../server/my-function.js'

   BusinessRule({
     $id: Now.ID['my-rule'],
     name: 'My Rule',
     table: 'incident',
     when: 'before',
     action: ['insert', 'update'],
     order: 100,
     active: true,
     script: myFunction,
   })
   ```

4. **Register the file** — ensure it's imported from `app/src/fluent/index.now.ts` (the main entry point)

### Step 4: Build

```bash
cd app && npm run build
```

If the build fails:
1. Read the error output carefully
2. Check the Build Agent skill's knowledge reference for correct syntax
3. Fix the generated code
4. Rebuild (max 3 attempts)

### Step 5: Deploy

**Primary path — Now SDK:**
```bash
cd app && npm run deploy
```

This runs `npx now-sdk install` which pushes all compiled Fluent artifacts to the instance.

**Fallback path — REST API:**

If the Now SDK deploy fails for specific artifacts, OR the artifact type has no Fluent support, fall back to `/sn-deploy`:

```bash
npx tsx src/run.ts deploy '<JSON>'
```

Construct the JSON payload from the `.build.md` fields:
```json
{
  "records": [{
    "target_table": "<table from build spec>",
    "lookup": "<name>=<value>^collection=<table>",
    "label": "<artifact name>",
    "fields": { "<field>": "<value>", ... }
  }]
}
```

### Step 6: Record Deploy State

**Critical:** Write `deploy-snapshot.json` entries for ALL deployed artifacts, regardless of whether they went through SDK or REST. This ensures `/sn-rollback` works for everything.

For SDK-deployed artifacts, query the instance after deploy to get the sys_ids:
```bash
npx tsx src/run.ts query '{"table":"<table>","query":"name=<artifact-name>^scope=x_snc_quality","fields":["sys_id","name"]}'
```

Then record them:
```bash
npx tsx src/run.ts record '{"action":"track","table":"<table>","sys_id":"<id>","purpose":"build-artifact","contract":"<contract-name>"}'
```

## Output

Report to the user:
- **Artifacts generated:** N files in `app/src/fluent/`
- **Build:** pass/fail
- **Deploy:** N artifacts deployed (M via SDK, K via REST API)
- **Next step:** Run `npm test` for GREEN phase

## Error Handling

- **Build errors:** Read error, consult Build Agent skill knowledge reference, fix, rebuild
- **Deploy errors:** Try REST API fallback, report which artifacts succeeded/failed
- **Auth errors:** STOP — tell user to authenticate in a separate terminal
- **Skill not found:** If no Build Agent skill exists for an artifact type, use REST API fallback with fields from the `.build.md`
