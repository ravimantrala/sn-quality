---
name: sn-execute
description: Parse Gherkin contracts into a Playwright execution plan. Use when the user wants to run their quality contracts against the live instance.
---

# SN Execute

Parse Gherkin quality contracts and generate a structured execution plan. Each Gherkin step maps to a Playwright browser action.

## Arguments

- **contract** (optional): Specific contract name to execute (without .feature extension)
- **directory** (optional): Directory path (default: `contracts`)

## Execution

1. Use the Glob tool to find `.feature` files in the contracts directory
2. Use the Read tool to read each .feature file
3. Parse the Gherkin content and map each step to a Playwright action:

### Step Mapping

| Gherkin Step | Playwright Action |
|---|---|
| `I am logged in as "<role>"` | Navigate to instance, login |
| `I create a new <Table>` | Navigate to `/<table>.do` |
| `I set "<Field>" to "<Value>"` | Type into field |
| `I submit the form` | Click submit button |
| `the field "<Field>" should display "<Value>"` | Assert field value via snapshot |
| `the field "<Field>" should be visible` | Assert field visibility |
| `the field "<Field>" should not be editable` | Assert field is read-only |
| `I navigate to the <Table> list` | Navigate to list view |
| `I should only see records where "<Field>" is "<Value>"` | Assert list filter |
| `I open an existing <Table>` | Open existing record |

4. Present the execution plan showing each scenario and its browser steps
5. If Playwright MCP tools are available, execute the plan step by step against the live instance at the SN_INSTANCE URL from `.env`

## Output

Present the execution plan. For each scenario, list the steps with their mapped browser actions. After execution, record PASS/FAIL for each scenario and suggest running `/sn-summary` for the quality report.
