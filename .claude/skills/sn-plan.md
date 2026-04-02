---
name: sn-plan
description: Adaptive planning skill that bridges raw intent and Gherkin contracts. Classifies the domain, discovers context, asks targeted follow-ups, and produces a structured plan for review before any contracts are generated.
---

# SN Plan

Bridge the gap between raw developer intent and Gherkin contract generation. This skill produces a structured, reviewable plan through adaptive reasoning — never generate contracts without an approved plan.

## Input

Developer intent in any form — a sentence, a story description, a customer request, a vague idea. Examples:
- "I want auto-priority assignment for incidents"
- "Build a password reset widget for the employee portal"
- "Customer wants to check order status through virtual agent"

## Process

### Step 1: Classify the Intent

Determine the domain. Do NOT ask — infer from the intent:
- **Table automation** — business rules, UI policies, ACLs, client scripts
- **UI component** — service portal widget, workspace page, UI page
- **Workflow/Flow** — flow designer, orchestration, approvals
- **Integration** — REST, SOAP, MID server, import sets
- **Conversational** — virtual agent topics, NLU models, chat flows
- **Catalog** — catalog items, variables, workflows, order guides
- **Reporting/Dashboard** — performance analytics, reports, dashboards
- **Agent experience** — workspace, playbooks, agent assist

### Step 2: Discover Context

Run `/sn-discover` against the relevant scope or table to understand what already exists. If the intent doesn't map to a single table, discover across the relevant artifacts.

### Step 3: Identify Gaps

Compare the intent against discovery results. Categorize what you find:
- **Specified** — the intent clearly states this
- **Ambiguous** — the intent mentions this but not clearly enough to implement
- **Missing** — the intent doesn't mention this but it's needed
- **Conflicting** — the intent contradicts something that already exists on the instance

### Step 4: Ask Adaptive Follow-ups

Ask ONLY about what's genuinely unclear. Rules:
- Never ask questions that discovery already answered
- Never use a fixed question list — questions are driven by the specific intent and domain
- Ask about ambiguity ("you said priority — the OOB lookup or a custom calculation?")
- Ask about missing decisions ("what should happen when impact is High but urgency is Low?")
- Ask about conflicts ("there's already a business rule that sets priority — replace or extend?")
- Ask about edge cases specific to this domain ("should this apply to child incidents too?")
- Group related questions together — don't ask one at a time
- Stop asking when you have enough to produce the plan — don't over-interrogate

### Step 5: Produce the Plan

Generate a structured plan document using this format:

```markdown
## Plan: <title>

### Scope
<What's being built. Target table/component/flow. What's in scope and out of scope.>

### Behaviors
1. When <trigger>, then <outcome>
2. When <trigger>, then <outcome>
...
<Numbered list of expected behaviors in plain English. Each becomes a Gherkin scenario later.>

### Decision Matrix
| <input 1> | <input 2> | → <output> | <side effect> |
|------------|-----------|------------|---------------|
| ...        | ...       | ...        | ...           |
<Only include if the intent involves conditional logic. The matrix makes implicit logic explicit.>

### Existing Artifacts
- <name> — <how it interacts with what we're building>
<From discovery. Only list artifacts that are relevant to this plan.>

### Assumptions
- <assumption 1>
- <assumption 2>
<Anything Claude inferred that the developer didn't explicitly state. This is critical — never silently decide.>

### Open Questions
- <anything still unresolved>
<If empty, state "None — ready for contract generation.">
```

### Step 6: Developer Reviews

Present the plan and wait for approval. The developer can:
- **Approve** → proceed to `/sn-generate-contracts`
- **Modify** → update specific sections of the plan
- **Reject** → start over with refined intent

Only after approval does contract generation happen — and it translates mechanically from the approved plan, not from interpretation.

## Key Constraints

- NEVER generate contracts without an approved plan
- NEVER ask questions that could be answered by running `/sn-discover`
- NEVER use a fixed set of questions — adapt to the domain and intent
- ALWAYS surface assumptions explicitly — don't silently decide
- The plan must be readable by someone who isn't technical
- The Behaviors list directly maps to Gherkin scenarios — each behavior = one or more scenarios
- The Decision Matrix directly maps to Scenario Outline Examples tables

## Reference Examples

### Example 1: Table Automation

**Intent:** "I want auto-priority assignment for incidents based on impact and urgency"

**Classification:** Table automation — business rule on `incident`

**Discovery finds:** 39 business rules, P1-P5 SLAs, "Incident Priority Raised" notification active

**Adaptive questions:**
- Should this follow the standard 3x3 ITIL matrix or a custom mapping?
- Should priority be read-only so users can't override it?
- Should priority recalculate when impact or urgency changes on an existing incident?

**Plan output:**
```markdown
## Plan: Incident Auto-Priority Assignment

### Scope
Business rule + UI policy on the incident table. Calculates priority
from impact/urgency on insert and update.

### Behaviors
1. When an incident is created with impact and urgency set, priority is auto-calculated
2. When impact or urgency changes on an existing incident, priority recalculates
3. Priority field is read-only on the form — no manual override

### Decision Matrix
| Impact   | Urgency  | → Priority   | SLA              |
|----------|----------|-------------|------------------|
| 1 - High | 1 - High | 1 - Critical | 1hr resolution   |
| 1 - High | 2 - Med  | 2 - High     | 8hr resolution   |
| 1 - High | 3 - Low  | 3 - Moderate | 1 day resolution |
| 2 - Med  | 1 - High | 2 - High     | 8hr resolution   |
| 2 - Med  | 2 - Med  | 3 - Moderate | 1 day resolution |
| 2 - Med  | 3 - Low  | 4 - Low      | 2 day resolution |
| 3 - Low  | 1 - High | 3 - Moderate | 1 day resolution |
| 3 - Low  | 2 - Med  | 4 - Low      | 2 day resolution |
| 3 - Low  | 3 - Low  | 5 - Planning | 40hr resolution  |

### Existing Artifacts
- "Priority 1 resolution (1 hour)" SLA — already active, will attach automatically
- "Incident Priority Raised" notification — already active, fires on priority change

### Assumptions
- Using the standard ITIL 3x3 matrix (not custom)
- Applies globally, not scoped to a specific assignment group

### Open Questions
- None
```

### Example 2: Service Portal Widget

**Intent:** "Build a password reset widget for the employee service portal"

**Classification:** UI component — service portal widget

**Discovery finds:** Employee Service Portal exists, "Reset Password" catalog item active, no existing password reset widget

**Adaptive questions:**
- Should this be self-service only, or can help desk agents use it too?
- Does it verify identity before resetting (security questions, manager approval)?
- Should it integrate with the existing "Reset Password" catalog item or replace it?
- What happens if the user account is locked vs. just expired?

**Plan output:**
```markdown
## Plan: Employee Password Reset Widget

### Scope
Service portal widget on the Employee Service Portal.
Self-service password reset with identity verification.

### Behaviors
1. Employee searches for their account by username or email
2. System verifies identity via security question
3. On success, password reset email is sent to the user's registered email
4. On failure (wrong answer), account is not locked — user gets 3 attempts
5. If account is already locked, widget shows "Contact IT" message with help desk number
6. Activity is logged to the incident table as a password reset request

### Decision Matrix
| Account State | Identity Check | → Outcome          |
|---------------|---------------|---------------------|
| Active        | Pass          | Reset email sent    |
| Active        | Fail (< 3)    | Retry prompt        |
| Active        | Fail (3rd)    | Locked + contact IT |
| Locked        | N/A           | Contact IT message  |
| Not found     | N/A           | Generic error       |

### Existing Artifacts
- "Reset Password" catalog item — currently active, widget will replace the portal experience but keep the catalog item for backend fulfillment
- "Reset Password" notification — reuse for sending reset emails

### Assumptions
- Security question is the identity verification method (not MFA/manager approval)
- 3 failed attempts locks the account
- Widget lives on the existing Employee Service Portal, not a new portal

### Open Questions
- Which security questions are configured in the instance?
- Is there a password policy (min length, complexity) to display?
```

### Example 3: Virtual Agent Topic

**Intent:** "Customer wants to check their order status through virtual agent"

**Classification:** Conversational — virtual agent topic

**Discovery finds:** Virtual Agent active, CSM plugin installed, sn_customerservice_case table has order-related fields, no existing order status topic

**Adaptive questions:**
- How does the customer identify themselves — email, order number, or authenticated session?
- What order data should be shown — status only, or also ETA, tracking, and items?
- What if there are multiple open orders?
- Should the agent offer escalation to a live agent if the order is delayed?

**Plan output:**
```markdown
## Plan: Order Status Virtual Agent Topic

### Scope
Virtual agent topic for customer-facing order status lookup.
Integrates with CSM case and order tables.

### Behaviors
1. Agent greets customer and asks for order number
2. If authenticated, agent pre-fills customer context
3. Agent looks up order by number in sn_customerservice_order
4. If found, displays: order status, ETA, line items, tracking link
5. If multiple orders match, agent presents a list to choose from
6. If order is delayed (past ETA), agent offers escalation to live agent
7. If order not found, agent asks to verify and retry once, then offers live agent

### Decision Matrix
| Auth State      | Order Found | Order Status | → Response                     |
|-----------------|-------------|-------------|--------------------------------|
| Authenticated   | Yes (1)     | On track    | Show status + ETA              |
| Authenticated   | Yes (1)     | Delayed     | Show status + offer escalation |
| Authenticated   | Yes (many)  | Any         | Show list → user picks         |
| Authenticated   | No          | N/A         | Retry once → live agent        |
| Unauthenticated | Yes         | Any         | Verify email first → then show |
| Unauthenticated | No          | N/A         | Ask to verify → live agent     |

### Existing Artifacts
- CSM plugin active — sn_customerservice_case and sn_customerservice_order tables available
- No existing order status topic — this is net new

### Assumptions
- Order number is the primary lookup key (not case number)
- "Delayed" means current date is past the ETA field value
- Escalation creates a CSM case assigned to the customer service queue

### Open Questions
- Is tracking info stored in ServiceNow or an external system?
- Should the agent handle order cancellation requests or just status?
```

## Integration with Workflow

The updated end-to-end workflow becomes:

```
1. /sn-plan          → Adaptive planning from intent
2. Developer reviews  → Approves/modifies the plan
3. /sn-generate-contracts → Mechanical translation from approved plan
4. npm test           → RED (nothing deployed)
5. /sn-deploy         → Build minimal code to pass first contract
6. npm test           → GREEN
7. Repeat 5-6 for remaining contracts
8. /sn-summary        → Quality report
9. Commit + PR        → Quality gate in CI
```
