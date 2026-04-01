---
name: sn-generate-contracts
description: Generate Gherkin quality contracts (.feature files) from developer intent and instance metadata. Use when the user wants to create test contracts for their ServiceNow app.
---

# SN Generate Contracts

Write Gherkin .feature files to the contracts/ directory based on developer intent and instance metadata.

## Workflow

1. If instance metadata isn't already available, run `/sn-discover` first to understand what artifacts exist
2. Ask the user what behavior they want to test (or infer from context)
3. Generate valid Gherkin content using this format:

```gherkin
Feature: <descriptive feature name>
  <brief description>

  @<tags>
  Scenario: <scenario name>
    Given I am logged in as "<role>"
    And I create a new <Table>
    When I set "<Field>" to "<Value>"
    And I submit the form
    Then the field "<Field>" should display "<Expected>"
```

4. Write the .feature file(s) to the `contracts/` directory using the Write tool:
   - Path: `C:/Users/ravi.mantrala/documents/claude_builds/sn-quality/contracts/<name>.feature`
   - Use kebab-case for filenames (e.g. `incident-priority-routing.feature`)

## Supported Gherkin Steps

Use these step patterns (they map to Playwright actions in the execute tool):
- `Given I am logged in as "<role>"`
- `And I create a new <Table>`
- `When I set "<Field>" to "<Value>"`
- `And I submit the form`
- `Then the field "<Field>" should display "<Value>"`
- `Then the field "<Field>" should be visible`
- `Then the field "<Field>" should not be editable`
- `Given I navigate to the <Table> list`
- `Then I should only see records where "<Field>" is "<Value>"`
- `Given I open an existing <Table>`

## Output

Confirm which files were written and suggest running `/sn-review-contracts` to inspect them.
