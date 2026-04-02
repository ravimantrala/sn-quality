# sn-quality — AI-Native Dev-Test for ServiceNow

sn-quality is an AI-native development experience for building ServiceNow apps in Claude Code. Describe what you want, Claude discovers your instance, generates Gherkin contracts, builds the app, tests it against the live instance, and opens a PR with tests packaged alongside app code through the CI/CD quality gate.

**Gherkin contracts → Playwright .spec.ts → `npm test` → results.json**

The entire build-test-deploy loop stays in the conversation.

## Quick Start

```bash
npm install
cp .env.example .env   # Add your ServiceNow instance credentials
npx playwright install chromium
claude                  # Open Claude Code
```

Then tell Claude what you want to build:

> "I want auto-priority assignment for incidents based on impact and urgency"

## What Happens Next

```
You: "Build me a hardware checkout catalog item"
                    │
        ┌───────────▼───────────┐
        │  1. Claude asks a few │  ← Adaptive, not a fixed form
        │     targeted questions│
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  2. You review and    │  ← Structured plan with behaviors,
        │     approve the plan  │    decision matrix, assumptions
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  3. Claude generates  │  ← Gherkin contracts (plain English)
        │     test contracts    │    + Playwright specs (runnable code)
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  4. Tests run → RED   │  ← Nothing deployed yet — tests
        │     (all fail)        │    prove they test something real
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  5. Claude builds and │  ← Business rules, catalog items,
        │     deploys the app   │    variables — any ServiceNow table
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  6. Tests run → GREEN │  ← App works as designed
        │     (all pass)        │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  7. PR opened with    │  ← Tests travel with the code
        │     CI quality gate   │    through the pipeline
        └───────────────────────┘
```

You stay in the conversation the whole time. Claude handles discovery, planning, coding, testing, and deployment.

## TDD Workflow (Detail)

```
1. /sn-plan              → Adaptive planning from intent
2. Developer reviews      → Approves the plan
3. /sn-generate-contracts → Gherkin .feature files from the approved plan
4. npm run codegen        → Generate Playwright .spec.ts files
5. npm test               → RED (nothing deployed yet — tests should fail)
6. /sn-deploy             → Push artifacts to the instance
7. npm test               → GREEN (tests pass)
8. Repeat 6-7             → Until all contracts pass
9. /sn-summary            → Quality report
10. git push + PR          → CI quality gate validates
```

## Skills

| Skill | Purpose |
|-------|---------|
| `/sn-plan` | Adaptive planning from intent — structured plan before contracts |
| `/sn-query` | Query any ServiceNow table |
| `/sn-check-exists` | Verify an artifact exists on the instance |
| `/sn-discover` | Scan instance metadata (business rules, UI policies, ACLs, notifications, SLAs) |
| `/sn-generate-contracts` | Write Gherkin .feature files from approved plan |
| `/sn-review-contracts` | Read and display contracts for review |
| `/sn-edit-contract` | Modify an existing contract |
| `/sn-deploy` | Push any record to the instance (table-agnostic) |
| `/sn-execute` | Parse contracts into a Playwright execution plan |
| `/sn-diagnose` | Analyze a test failure using instance metadata |
| `/sn-cleanup` | Delete test records (cascade-aware) |
| `/sn-rollback` | Roll back the last deploy to original state |
| `/sn-summary` | Generate a quality coverage report |

## How Tests Work

Contracts are written in Gherkin (plain English), then code-generated into Playwright Test specs:

```
contracts/*.feature          → Source of truth (Gherkin)
    ↓ npm run codegen
tests/generated/*.spec.ts   → Runnable Playwright specs
    ↓ npm test
test-results/results.json   → Pass/fail results for CI
```

Tests run autonomously via `npm test` — no Claude Code in the loop. Anyone on the team can run them.

## CLI Runner

```bash
npx tsx src/run.ts <command> '<json-args>'
```

| Command | Purpose |
|---------|---------|
| `query` | Query any ServiceNow table |
| `check-exists` | Verify an artifact exists |
| `discover` | Scan instance metadata |
| `deploy` | Create/update records on any table |
| `cleanup` | Delete tracked test records (cascade) |
| `rollback` | Reverse last deploy from snapshot |
| `diagnose` | Analyze failure with instance metadata |
| `summary` | Quality report with pass/fail stats |
| `report` | Append/clear/stats for test results |
| `record` | Track/list/clear created record sys_ids |

## Deploy (Table-Agnostic)

Deploy works with **any** ServiceNow table — not just business rules and UI policies:

```json
{"records": [
  {"target_table": "sc_cat_item", "lookup": "name=My Item", "label": "My catalog item",
   "fields": {"name": "My Item", "active": "true"}},
  {"target_table": "item_option_new", "label": "Device type variable",
   "fields": {"cat_item": "<sys_id>", "name": "device_type", "type": "5"}},
  {"target_table": "sys_script", "lookup": "name=My Rule^collection=incident",
   "label": "My business rule",
   "fields": {"name": "My Rule", "collection": "incident", "when": "before", "script": "..."}}
]}
```

Every deploy snapshots the pre-deploy state. Run `/sn-rollback` to undo.

## Project Structure

```
src/
  sn-client.ts          — ServiceNow REST API client
  codegen.ts            — Gherkin → Playwright .spec.ts codegen
  results-writer.ts     — Test results + record tracking persistence
  run.ts                — CLI runner for all commands
.claude/skills/         — Claude Code skill definitions
contracts/              — Gherkin .feature files (source of truth)
tests/generated/        — Playwright specs (generated by codegen)
test-results/
  results.json          — Test results (Playwright format, read by CI)
  records.json          — Tracked sys_ids for cleanup
  deploy-snapshot.json  — Pre-deploy state for rollback
playwright.config.ts    — Playwright Test configuration
.github/workflows/      — CI/CD quality gate
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SN_INSTANCE` | ServiceNow instance URL (e.g. `https://your-instance.service-now.com`) |
| `SN_USER` | ServiceNow username |
| `SN_PASSWORD` | ServiceNow password |

## CI/CD

On every PR, the quality gate workflow:
1. Reads `test-results/results.json`
2. Posts a quality report as a PR comment
3. Blocks merge if any tests failed

Tests are committed with the code — CI validates, it doesn't re-run.
