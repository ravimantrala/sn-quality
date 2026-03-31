# SN Quality Demo Script

## Pre-Demo Checklist

- [ ] GitHub repo created and cloned
- [ ] `.env` configured with instance credentials
- [ ] `npm install && npm run build` complete
- [ ] MCP server added to Claude Code config
- [ ] Claude Code restarted — verify `sn_quality_*` tools appear
- [ ] Smoke test passes: `npx playwright test tests/smoke.spec.ts`
- [ ] GitHub secrets configured (SN_INSTANCE, SN_USER, SN_PASSWORD)
- [ ] Test user accounts ready (admin/itil role at minimum)

## Demo Script

### Act 1: Intent & Contracts (~5 min)

**You type:**
> Build an incident management app for ServiceNow.
> Categories: network, hardware, software.
> Route by category to the correct assignment group.
> P1 incidents should be escalated.
> Notify caller on status changes.
> Instance: [your-instance].service-now.com

**What Claude Code does:**
1. Calls `sn_quality_discover` with table="incident"
2. Reviews the metadata, calls `sn_quality_generate_contracts`
3. Presents Gherkin contracts for your review

**You say:** "Looks good, but P1 escalation should also trigger when priority is changed to 1, not just on creation."

**What Claude Code does:**
1. Calls `sn_quality_edit_contract` to update the P1 contract
2. Shows you the diff
3. You approve

### Act 2: Build (~5 min)

**You say:** "Approved. Build the app and the tests."

**What Claude Code does:**
1. Calls `sn_quality_deploy` to push business rules to instance
2. Generates Playwright `.spec.ts` files from the Gherkin contracts
3. Commits everything to the repo

### Act 3: Test & PR (~3 min)

**You say:** "Push and open a PR."

**What Claude Code does:**
1. `git push -u origin feature/incident-mgmt`
2. `gh pr create --title "Incident Management App"`
3. GitHub Actions triggers, runs Playwright tests
4. Results post to PR — some pass, some fail

### Act 4: Diagnose & Fix (~5 min)

**You say:** "The quality gate failed. What happened?"

**What Claude Code does:**
1. Reads Playwright failure output
2. Calls `sn_quality_diagnose` with the table and fields involved
3. Explains: "Business rule X fired after rule Y and overwrote the assignment..."
4. Offers to fix

**You say:** "Fix it."

**What Claude Code does:**
1. Updates the business rule via `sn_quality_deploy`
2. Pushes, CI re-runs
3. All green. "Quality gate passed. PR ready to merge."

## Talking Points for Leadership

- Every ServiceNow API call is real — this is not a mock
- Contracts are version-controlled alongside the code
- The CI/CD quality gate runs the same tests automatically
- Claude Code reasons over platform metadata to diagnose failures
- The developer never left the IDE
