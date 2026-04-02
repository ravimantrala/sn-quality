---
name: sn-execute
description: Parse Gherkin contracts into a Playwright execution plan, execute against the live instance, and persist results + tracked records for CI and cleanup.
---

# SN Execute

Parse Gherkin quality contracts and generate a structured execution plan. Each Gherkin step maps to a Playwright browser action. Results and created records are persisted to `test-results/`.

## Arguments

- **contract** (optional): Specific contract name to execute (without .feature extension)
- **directory** (optional): Directory path (default: `contracts`)

## Before Execution

Clear previous results to start a fresh run:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts report '{"action":"clear"}'
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts record '{"action":"clear"}'
```

## Execution

1. Use the Glob tool to find `.feature` files in the contracts directory
2. Use the Read tool to read each .feature file
3. Parse the Gherkin content and map each step to a Playwright action:

### Step Mapping

| Gherkin Step | Playwright Action |
|---|---|
| `I am logged into ServiceNow as an ITIL user` | Navigate to instance, verify login |
| `I navigate to "<url>"` | Navigate to the URL |
| `I click "<element>"` | Click the element |
| `I populate the incident form with: <table>` | Fill each field from the data table |
| `I submit the form` | Click submit button |
| `the "<field>" field value is "<value>"` | Assert field value via snapshot or JS evaluate |
| `the "<field>" field is read-only` | Assert field is disabled/read-only |
| `I update the incident with: <table>` | Set each field from the data table |
| `I save the form` | Click Update/Save button |
| `I navigate to the related list "<name>"` | Click the related list tab |
| `an SLA record exists with: <table>` | Verify SLA records in related list |
| `an email record exists matching: <table>` | Query sys_email for matching notifications |
| `a notification is sent for "<name>"` | Query sys_email for the notification |
| `an SLA record is attached with definition "<name>"` | Query task_sla for the SLA |
| `the incident number is captured for subsequent steps` | Store the incident number |
| `the incident number is captured for cleanup` | Store the incident number and track for cleanup |

4. Present the execution plan showing each scenario and its browser steps
5. If Playwright MCP tools are available, execute the plan step by step against the live instance at the SN_INSTANCE URL from `.env`

## Recording Results

After executing EACH scenario, immediately persist the result:

### Record pass/fail

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts report '{"action":"append","contract":"<contract-name>","scenario":"<scenario-name>","passed":<true|false>,"tags":["@Tag1","@Tag2"],"error":"<error message if failed>","duration_ms":<milliseconds>}'
```

### Track created records

When a test creates a record (e.g., submitting an incident form, deploying a business rule), track it for cleanup:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts record '{"action":"track","table":"incident","sys_id":"<sys_id>","number":"<INC number>","purpose":"test_data","contract":"<contract-name>","scenario":"<scenario-name>"}'
```

For deployed artifacts (business rules, UI policies), use `"purpose":"deployed_artifact"`:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts record '{"action":"track","table":"sys_script","sys_id":"<sys_id>","purpose":"deployed_artifact","contract":"deploy"}'
```

## Output

Present the execution plan. For each scenario, list the steps with their mapped browser actions.

After execution:
- Results are written to `test-results/results.json` (Playwright-compatible format for CI)
- Created records are tracked in `test-results/records.json` (for cleanup)
- Suggest running `/sn-summary` for the quality report
- Suggest running `/sn-cleanup` to remove test data
