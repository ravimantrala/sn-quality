---
name: sn-review-contracts
description: Read and display Gherkin quality contracts from the contracts/ directory. Use when the user wants to review existing test contracts.
---

# SN Review Contracts

Read and display all .feature files from the contracts directory for developer review.

## Arguments

- **name** (optional): Specific contract name to review (without .feature extension)
- **directory** (optional): Directory path (default: `C:/Users/ravi.mantrala/documents/claude_builds/sn-quality/contracts`)

## Execution

1. Use the Glob tool to find `.feature` files:
   - Pattern: `contracts/*.feature` (or specific name if provided)
   - Path: `C:/Users/ravi.mantrala/documents/claude_builds/sn-quality`

2. Use the Read tool to read each .feature file

3. Present each contract with:
   - Contract name (filename without extension)
   - Full Gherkin content in a code block
   - Count of scenarios

## Output

Display each contract formatted as:

```
## Contract: <name>

```gherkin
<full content>
```

Scenarios: <count>
```

Suggest `/sn-edit-contract` if the user wants to make changes.
