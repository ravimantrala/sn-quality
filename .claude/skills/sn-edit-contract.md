---
name: sn-edit-contract
description: Edit an existing Gherkin quality contract. Use when the user wants to modify a test contract — add scenarios, change steps, update values.
---

# SN Edit Contract

Update an existing .feature file with new Gherkin content.

## Arguments

Collect from the user:
- **name** (required): Contract name (without .feature extension)
- **changes**: What the user wants to change (plain English)

## Execution

1. Read the current contract using the Read tool:
   - Path: `C:/Users/ravi.mantrala/documents/claude_builds/sn-quality/contracts/<name>.feature`

2. Apply the user's requested changes to the Gherkin content

3. Write the updated content using the Edit tool (or Write tool for full rewrites)

4. Show a diff of what changed

## Output

Show the changes made and the updated contract. Suggest `/sn-review-contracts` to see the full result.
