# sn-quality — AI-Native Dev-Test for ServiceNow

sn-quality is an AI-native TDD experience for building ServiceNow apps. Describe what you want, Claude discovers your instance, generates Gherkin contracts and build specs using Build Agent skills, builds the app with Now SDK/Fluent, tests it against the live instance, and opens a PR through the CI quality gate with tests packaged alongside app code.

**Gherkin contracts → Playwright .spec.ts → `npm test` → results.json**

The entire plan-test-build-deploy loop stays in the conversation. Claude Code does everything, guided by Build Agent skills for ServiceNow-specific knowledge.

## Quick Start

```bash
npm install
cp .env.example .env   # Add your ServiceNow instance credentials
npx playwright install chromium
claude                  # Open Claude Code
```

### Now SDK Setup (one-time)

The app is built and deployed using the ServiceNow SDK. Authenticate against your instance:

```bash
cd app
npx now-sdk auth --add https://your-instance.service-now.com --type basic
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
        │  3. Claude generates  │  ← Gherkin contracts + build specs
        │     contracts using   │    guided by Build Agent skills
        │     Build Agent skills│    + Playwright specs (runnable code)
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  4. You review and    │  ← Approve contracts before testing
        │     approve contracts │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  5. Tests run → RED   │  ← Nothing deployed yet — tests
        │     (all fail)        │    prove they test something real
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  6. Claude builds +   │  ← Now SDK/Fluent generates .now.ts
        │     deploys using     │    artifacts, deploys to instance
        │     Build Agent skills│
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  7. Tests run → GREEN │  ← App works as designed
        │     (all pass)        │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  8. PR opened with    │  ← Tests travel with the code
        │     CI quality gate   │    through the pipeline
        └───────────────────────┘
```

You stay in the conversation the whole time. Claude Code handles everything — discovery, planning, contract generation, building, testing, and deployment — using Build Agent skills for ServiceNow platform knowledge.

## TDD Workflow (Detail)

```
1.  /sn-plan              → Adaptive planning from intent
2.  Developer reviews      → Approves the plan
3.  /sn-generate-contracts → Gherkin .feature + .build.md from approved plan
                              (loads Build Agent skills for accurate specs)
4.  Developer reviews      → Approves contracts
5.  npm run codegen        → Generate Playwright .spec.ts files
6.  npm test               → RED (nothing deployed yet — tests should fail)
7.  /sn-build              → Fluent code → npm run build → npm run deploy
                              (Now SDK primary, REST API fallback)
8.  npm test               → GREEN (tests pass)
9.  Repeat 7-8             → Until all contracts pass
10. /sn-summary            → Quality report
11. git push + PR          → CI quality gate validates
```

## Build Agent Skills

Build Agent skills are instruction files (from `/tmp/build-agent-skills/skills/`) that teach Claude Code how to work with ServiceNow platform concepts — tables, business rules, client scripts, catalog items, etc. They provide Fluent API patterns, field mappings, and best practices.

Claude Code loads these skills in two places:

- **`/sn-generate-contracts`** — reads skills to ensure `.build.md` specs use correct field names and patterns
- **`/sn-build`** — reads skills + knowledge references to generate `.now.ts` Fluent code in `app/src/fluent/`

The build/deploy pipeline:

```
contracts/*.build.md          → Build specs (what to create)
    ↓ /sn-build
app/src/fluent/*.now.ts       → Fluent artifact definitions
    ↓ npm run build (in app/)
app/dist/                     → Compiled XML update set
    ↓ npm run deploy (in app/)
Instance                      → Artifacts installed via Now SDK
```

For artifacts the SDK doesn't support, `/sn-build` falls back to REST API deploy via `/sn-deploy`.

## Skills

| Skill | Purpose |
|-------|---------|
| `/sn-plan` | Adaptive planning from intent — structured plan before contracts |
| `/sn-query` | Query any ServiceNow table |
| `/sn-check-exists` | Verify an artifact exists on the instance |
| `/sn-discover` | Scan instance metadata (business rules, UI policies, ACLs, notifications, SLAs) |
| `/sn-generate-contracts` | Write paired .feature + .build.md files using Build Agent skills |
| `/sn-review-contracts` | Read and display contracts for review |
| `/sn-edit-contract` | Modify an existing contract |
| `/sn-build` | Generate Fluent code from .build.md, build with Now SDK, deploy to instance |
| `/sn-deploy` | Push artifacts via REST API (fallback for artifacts without Fluent support) |
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

## Project Structure

```
app/                        — Now SDK project (Fluent code generation)
  src/fluent/               — Generated .now.ts artifact definitions
    business-rules/         — Business rule artifacts
    client-scripts/         — Client script artifacts
    ...                     — Other artifact types as needed
  src/server/               — Server-side script modules
  now.config.json           — App scope (x_snc_quality) and metadata
  package.json              — Now SDK dependencies
src/
  sn-client.ts              — ServiceNow REST API client
  codegen.ts                — Gherkin → Playwright .spec.ts codegen
  results-writer.ts         — Test results + record tracking persistence
  run.ts                    — CLI runner for all commands
.claude/skills/             — Claude Code skill definitions
contracts/
  *.feature                 — Gherkin test contracts (what to test)
  *.build.md                — Build specs (what to create, for /sn-build)
tests/generated/            — Playwright specs (generated by codegen)
test-results/
  results.json              — Test results (Playwright format, read by CI)
  records.json              — Tracked sys_ids for cleanup
  deploy-snapshot.json      — Pre-deploy state for rollback
docs/
  build-spec-format.md      — Build spec format documentation
playwright.config.ts        — Playwright Test configuration
.github/workflows/          — CI/CD quality gate
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SN_INSTANCE` | ServiceNow instance URL (e.g. `https://your-instance.service-now.com`) |
| `SN_USER` | ServiceNow username |
| `SN_PASSWORD` | ServiceNow password |

Now SDK auth is managed separately via `npx now-sdk auth` in the `app/` directory.

## CI/CD

On every PR, the quality gate workflow:
1. Reads `test-results/results.json`
2. Posts a quality report as a PR comment
3. Blocks merge if any tests failed

Tests are committed with the code — CI validates, it doesn't re-run.
