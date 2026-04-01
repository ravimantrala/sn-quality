# sn-quality — ServiceNow Quality Testing

## Project Overview

Contract-driven quality testing for ServiceNow apps. Claude Code skills for discovering instance metadata, generating Gherkin test contracts, deploying artifacts, executing tests, and diagnosing failures.

## Available Skills

These skills are available as slash commands when working in this project:

| Skill | Purpose |
|-------|---------|
| `/sn-query` | Query any ServiceNow table |
| `/sn-check-exists` | Verify an artifact exists on the instance |
| `/sn-discover` | Scan instance metadata (business rules, UI policies, ACLs, notifications, SLAs) |
| `/sn-generate-contracts` | Write Gherkin .feature files to contracts/ |
| `/sn-review-contracts` | Read and display contracts for review |
| `/sn-edit-contract` | Modify an existing contract |
| `/sn-deploy` | Push artifacts to the instance (business rules, UI policies, etc.) |
| `/sn-execute` | Parse contracts into a Playwright execution plan |
| `/sn-diagnose` | Analyze a test failure using instance metadata |
| `/sn-cleanup` | Delete test records from the instance |
| `/sn-summary` | Generate a quality coverage report |

## End-to-End Workflow

When a user asks you to build a ServiceNow app, follow this workflow:

### 1. Discover
Run `/sn-discover` with the target table to understand what already exists on the instance — business rules, UI policies, ACLs, notifications, SLAs. Present a summary to the user.

### 2. Generate Contracts
Based on the user's intent and the discovered metadata, run `/sn-generate-contracts` to write Gherkin .feature files to `contracts/`. Each contract defines the expected behavior of the app.

### 3. Review & Approve
Run `/sn-review-contracts` and present the contracts to the user. Wait for their approval. If they want changes, use `/sn-edit-contract`.

### 4. Deploy
Use `/sn-deploy` to push the app artifacts (business rules, UI policies, client scripts, etc.) to the ServiceNow instance. Save all returned sys_ids for potential cleanup.

### 5. Execute
Run `/sn-execute` to parse the contracts into a Playwright execution plan. If Playwright MCP tools are available, execute the plan against the live instance. Record PASS/FAIL for each scenario.

### 6. Diagnose & Fix
If any tests fail, run `/sn-diagnose` with the table, error message, and scenario name. Analyze the diagnostic data to identify the root cause. Fix the app artifacts and re-test.

### 7. Summary
Run `/sn-summary` to generate the quality report — contract count, coverage %, pass rate, and quality gate status.

### 8. Cleanup (if needed)
Run `/sn-cleanup` to remove any test records or artifacts that should not persist on the instance.

## CLI Runner

All API skills use `src/run.ts` as the CLI entry point:

```bash
npx tsx src/run.ts <command> '<json-args>'
```

Commands: `query`, `check-exists`, `discover`, `deploy`, `cleanup`, `diagnose`, `summary`

## Credentials

Instance credentials are stored in `.env` (gitignored). The CLI runner loads them automatically via dotenv.

## Project Structure

- `src/sn-client.ts` — ServiceNow REST API client
- `src/run.ts` — CLI runner for skills
- `.claude/skills/` — Claude Code skill definitions
- `contracts/` — Generated Gherkin .feature files
- `tests/` — Smoke tests
- `.github/workflows/` — CI/CD quality gate
