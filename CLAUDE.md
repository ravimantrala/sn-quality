# sn-quality — ServiceNow Quality Testing

## Project Overview

AI-native TDD for ServiceNow apps. Build Agent (via loaded skills) generates contracts and builds apps using Now SDK/Fluent. sn-quality provides the test infrastructure — Gherkin-to-Playwright codegen, test execution, results tracking, cleanup, and rollback.

## Available Skills

These skills are available as slash commands when working in this project:

| Skill | Purpose |
|-------|---------|
| `/sn-plan` | Adaptive planning from intent — produces structured plan before contracts |
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
| `/sn-cleanup` | Delete test records from the instance (cascade-aware) |
| `/sn-rollback` | Roll back the last deploy to original state |
| `/sn-summary` | Generate a quality coverage report |

## Build Agent Skills

Build Agent skills are loaded from `/tmp/build-agent-skills/skills/`. They teach Claude Code how to write Fluent/Now SDK code for each ServiceNow artifact type (business rules, client scripts, catalog items, tables, etc.).

Skills are used in two places:
1. **`/sn-generate-contracts`** — reads skills to ensure `.build.md` specs use correct field names, triggers, and patterns
2. **`/sn-build`** — reads skills + knowledge references to generate `.now.ts` Fluent code

## Critical Rules

- **NEVER run `/sn-generate-contracts` without an approved plan from `/sn-plan` first.** The plan is the source of truth — contracts are a mechanical translation of the plan, not an interpretation of raw intent.
- **NEVER run `/sn-build` without running tests first (RED phase).** The TDD loop requires seeing tests fail before building.
- **`/sn-generate-contracts` MUST load Build Agent skills** for each artifact type to ensure build specs match what `/sn-build` expects.
- When a user describes what they want to build, ALWAYS start with `/sn-plan` — even if the request seems simple.
- **Contracts are PAIRED.** Every `.feature` file has a `.build.md`. Generate them together, always.

## End-to-End Workflow

When a user asks you to build a ServiceNow app, follow this workflow:

### 1. Plan (from Intent)
Run `/sn-plan` with the developer's intent. The skill classifies the domain, runs `/sn-discover` to understand what exists, asks adaptive follow-up questions, and produces a structured plan (scope, behaviors, decision matrix, assumptions). Wait for the developer to approve the plan before proceeding.

### 2. Generate Contracts + Build Specs
Run `/sn-generate-contracts` to translate the approved plan into **paired files**:
- `contracts/<name>.feature` — Gherkin test contract (what to test)
- `contracts/<name>.build.md` — Build spec (what to create)

The skill loads Build Agent skills from `/tmp/build-agent-skills/skills/` to ensure artifact definitions use correct Fluent API field names and patterns. Each behavior from the plan becomes scenarios in the `.feature` AND artifacts in the `.build.md`.

### 3. Review & Approve
Run `/sn-review-contracts` and present both contracts and build specs to the user. Wait for their approval. If they want changes, use `/sn-edit-contract`. The user can also write new contracts manually.

### 4. Execute (RED)
Run `npm run codegen && npm test` to generate Playwright specs and execute them. All tests should FAIL — nothing is deployed yet. This validates the contracts test something real.

### 5. Build + Deploy
Run `/sn-build` to process the `.build.md` files:
- Loads Build Agent skills from `/tmp/build-agent-skills/skills/`
- Generates `.now.ts` Fluent files into `app/src/fluent/`
- Runs `npm run build` in `app/` to compile
- Runs `npm run deploy` in `app/` to push to instance via Now SDK
- Falls back to REST API deploy (`/sn-deploy`) for unsupported artifact types
- Records all deployed artifacts in `deploy-snapshot.json` for rollback

### 6. Execute (GREEN)
Run `npm test` again. Tests should now PASS. If any fail, run `/sn-diagnose` to find the root cause.

### 7. Diagnose & Fix
If tests fail, use the failure output + build spec to fix the Fluent code in `app/src/fluent/`. Rebuild and re-deploy until GREEN.

### 8. Summary
Run `/sn-summary` to generate the quality report — contract count, coverage %, pass rate, and quality gate status.

### 9. Commit + PR
Commit contracts, build specs, Fluent app code (`app/src/`), generated specs, and test results. Open PR — CI quality gate validates.

### 10. Cleanup / Rollback (if needed)
Run `/sn-cleanup` to remove test records. Run `/sn-rollback` to reverse deployed artifacts to their original state.

## CLI Runner

All API skills use `src/run.ts` as the CLI entry point:

```bash
npx tsx src/run.ts <command> '<json-args>'
```

Commands: `query`, `check-exists`, `discover`, `deploy`, `cleanup`, `diagnose`, `summary`, `report`, `record`, `rollback`

## Credentials

Instance credentials are stored in `.env` (gitignored). The CLI runner loads them automatically via dotenv.

## Project Structure

- `app/` — Now SDK project for Fluent code generation (scaffolded via `npx @servicenow/sdk init`)
- `app/src/fluent/` — Generated `.now.ts` artifact definitions (business-rules/, client-scripts/, etc.)
- `app/src/server/` — Server-side script modules imported by Fluent definitions
- `app/now.config.json` — App scope and metadata (`x_snc_quality`)
- `src/sn-client.ts` — ServiceNow REST API client (fallback deploy path)
- `src/results-writer.ts` — Test results and record registry persistence
- `src/codegen.ts` — Gherkin-to-Playwright codegen (contracts → .spec.ts)
- `src/run.ts` — CLI runner for skills
- `.claude/skills/` — Claude Code skill definitions
- `contracts/*.feature` — Gherkin test contracts (what to test)
- `contracts/*.build.md` — Build specs (what to create, for `/sn-build`)
- `docs/build-spec-format.md` — Build spec format documentation
- `test-results/results.json` — Structured test results (Playwright-compatible format for CI)
- `test-results/records.json` — Registry of sys_ids created during testing (for cleanup)
- `test-results/deploy-snapshot.json` — Pre-deploy state snapshot (for rollback)
- `tests/generated/` — Playwright specs generated by codegen
- `tests/` — Smoke tests
- `.github/workflows/` — CI/CD quality gate
