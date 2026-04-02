# sn-quality — ServiceNow Quality Testing

## Project Overview

Contract-driven quality testing for ServiceNow apps. Claude Code skills for discovering instance metadata, generating Gherkin test contracts, deploying artifacts, executing tests, and diagnosing failures.

## Available Skills

These skills are available as slash commands when working in this project:

| Skill | Purpose |
|-------|---------|
| `/sn-plan` | Adaptive planning from intent — produces structured plan before contracts |
| `/sn-query` | Query any ServiceNow table |
| `/sn-check-exists` | Verify an artifact exists on the instance |
| `/sn-discover` | Scan instance metadata (business rules, UI policies, ACLs, notifications, SLAs) |
| `/sn-generate-contracts` | Write paired .feature + .build.md files to contracts/ |
| `/sn-review-contracts` | Read and display contracts for review |
| `/sn-edit-contract` | Modify an existing contract |
| `/sn-deploy` | Push artifacts to the instance (business rules, UI policies, etc.) |
| `/sn-execute` | Parse contracts into a Playwright execution plan |
| `/sn-diagnose` | Analyze a test failure using instance metadata |
| `/sn-cleanup` | Delete test records from the instance (cascade-aware) |
| `/sn-rollback` | Roll back the last deploy to original state |
| `/sn-summary` | Generate a quality coverage report |

## Critical Rules

- **NEVER run `/sn-generate-contracts` without an approved plan from `/sn-plan` first.** The plan is the source of truth — contracts are a mechanical translation of the plan, not an interpretation of raw intent.
- **NEVER deploy without running tests first (RED phase).** The TDD loop requires seeing tests fail before writing code.
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

Each behavior from the plan becomes scenarios in the `.feature` AND artifacts in the `.build.md`.

### 3. Review & Approve
Run `/sn-review-contracts` and present both contracts and build specs to the user. Wait for their approval. If they want changes, use `/sn-edit-contract`. The user can also write new contracts manually.

### 4. Execute (RED)
Run `npm run codegen && npm test` to generate Playwright specs and execute them. All tests should FAIL — nothing is deployed yet. This validates the contracts test something real.

### 5. Build Agent Builds the App
Hand off the `.build.md` files to Build Agent. Build Agent uses the build specs to generate the ServiceNow app code using Fluent/SDK, following the artifact definitions, logic, and dependencies specified.

### 6. Deploy
Use `/sn-deploy` to push the built artifacts to the ServiceNow instance. Deploy automatically snapshots the pre-deploy state for rollback.

### 7. Execute (GREEN)
Run `npm test` again. Tests should now PASS. If any fail, run `/sn-diagnose` to find the root cause.

### 8. Diagnose & Fix
If tests fail, Build Agent uses the failure output + build spec to fix the artifacts. Re-deploy and re-test until GREEN.

### 9. Summary
Run `/sn-summary` to generate the quality report — contract count, coverage %, pass rate, and quality gate status.

### 10. Commit + PR
Commit contracts, build specs, generated specs, test results, and app code. Open PR — CI quality gate validates.

### 11. Cleanup / Rollback (if needed)
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

- `src/sn-client.ts` — ServiceNow REST API client
- `src/results-writer.ts` — Test results and record registry persistence
- `src/codegen.ts` — Gherkin-to-Playwright codegen (contracts → .spec.ts)
- `src/run.ts` — CLI runner for skills
- `.claude/skills/` — Claude Code skill definitions
- `contracts/*.feature` — Gherkin test contracts (what to test)
- `contracts/*.build.md` — Build specs (what to create, for Build Agent)
- `docs/build-spec-format.md` — Build spec format documentation
- `test-results/results.json` — Structured test results (Playwright-compatible format for CI)
- `test-results/records.json` — Registry of sys_ids created during testing (for cleanup)
- `test-results/deploy-snapshot.json` — Pre-deploy state snapshot (for rollback)
- `tests/generated/` — Playwright specs generated by codegen
- `tests/` — Smoke tests
- `.github/workflows/` — CI/CD quality gate
