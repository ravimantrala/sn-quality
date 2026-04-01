# sn-quality — ServiceNow Quality Testing

Contract-driven quality testing for ServiceNow apps, powered by Claude Code skills.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your ServiceNow instance credentials
   ```

3. Open Claude Code in this directory:
   ```bash
   cd sn-quality
   claude
   ```

4. Tell Claude Code what app you want to build. It will orchestrate the full workflow automatically.

## Skills

| Skill | Purpose |
|-------|---------|
| `/sn-query` | Query any ServiceNow table |
| `/sn-check-exists` | Verify an artifact exists on the instance |
| `/sn-discover` | Scan instance metadata (business rules, UI policies, ACLs, notifications, SLAs) |
| `/sn-generate-contracts` | Write Gherkin .feature files to contracts/ |
| `/sn-review-contracts` | Read and display contracts for review |
| `/sn-edit-contract` | Modify an existing contract |
| `/sn-deploy` | Push artifacts to the instance |
| `/sn-execute` | Parse contracts into a Playwright execution plan |
| `/sn-diagnose` | Analyze a test failure using instance metadata |
| `/sn-cleanup` | Delete test records from the instance |
| `/sn-summary` | Generate a quality coverage report |

## End-to-End Flow

1. Tell Claude Code what app you want to build
2. Claude discovers your instance metadata and generates Gherkin contracts
3. Review and approve the contracts
4. Claude deploys the app artifacts to your instance
5. Claude executes contracts via Playwright against the live instance
6. If tests fail, Claude diagnoses and fixes
7. Quality report generated

## CLI Runner

The skills use `src/run.ts` under the hood:

```bash
npx tsx src/run.ts <command> '<json-args>'
```

Commands: `query`, `check-exists`, `discover`, `deploy`, `cleanup`, `diagnose`, `summary`

## Smoke Test

```bash
npm run smoke
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SN_INSTANCE` | ServiceNow instance URL (e.g. `https://your-instance.service-now.com`) |
| `SN_USER` | ServiceNow username |
| `SN_PASSWORD` | ServiceNow password |
