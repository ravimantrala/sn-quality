---
name: sn-summary
description: Generate a quality report showing contract count, coverage percentage, test pass/fail stats, and artifact breakdown. Use after testing to see the overall quality posture.
---

# SN Summary

Generate a quality summary report: contract count, coverage (contracted artifacts vs. total instance artifacts), test results, and breakdown by artifact type.

## Arguments

Collect from the user (or infer from context) — at least one is recommended:
- **table** (optional): Table to compute coverage for (e.g. `incident`)
- **scope** (optional): Application scope to compute coverage for
- **contracts_dir** (optional): Path to contracts directory (default: `contracts`)

## Execution

Run this command from the sn-quality project root:

```bash
cd C:/Users/ravi.mantrala/documents/claude_builds/sn-quality && npx tsx src/run.ts summary '<JSON_ARGS>'
```

Example:
```json
{"table": "incident"}
```

## Output

Present the report clearly:
- **Contracts**: number of .feature files
- **Coverage %**: contracts vs. total instance artifacts
- **Artifact breakdown**: business rules, UI policies, ACLs, notifications
- **Test results**: total scenarios, passed, failed, pass rate (read from `test-results/results.json`)
- **Per-contract breakdown**: pass/fail counts for each contract
- **Quality gate status**: PASSED (all green) or BLOCKED (any failures)

If test results exist in `test-results/results.json`, the report includes full pass/fail statistics. If no results file exists, the test results section shows zero runs.
