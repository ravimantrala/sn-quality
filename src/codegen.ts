/**
 * Gherkin-to-Playwright codegen — table-agnostic.
 *
 * Reads .feature files from contracts/ and generates runnable .spec.ts
 * files in tests/generated/. Works with any ServiceNow table/artifact.
 *
 * Usage: npx tsx src/codegen.ts [contract-name]
 */

import "dotenv/config";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

// ---------------------------------------------------------------------------
// Gherkin parser
// ---------------------------------------------------------------------------

interface DataTableRow { [key: string]: string }
interface Step { keyword: string; text: string; dataTable?: DataTableRow[] }
interface Scenario { name: string; tags: string[]; steps: Step[] }
interface ScenarioOutline { name: string; tags: string[]; steps: Step[]; examples: DataTableRow[] }
interface Feature { name: string; tags: string[]; background: Step[]; scenarios: Scenario[]; outlines: ScenarioOutline[] }

function parseDataTable(lines: string[], startIdx: number): { rows: DataTableRow[]; endIdx: number } {
  const rows: DataTableRow[] = [];
  let headers: string[] = [];
  let i = startIdx;
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    const cells = lines[i].trim().split("|").filter(Boolean).map((c) => c.trim());
    if (headers.length === 0) headers = cells;
    else {
      const row: DataTableRow = {};
      cells.forEach((cell, idx) => { row[headers[idx]] = cell; });
      rows.push(row);
    }
    i++;
  }
  return { rows, endIdx: i };
}

function parseFeature(content: string): Feature {
  const lines = content.split("\n");
  const feature: Feature = { name: "", tags: [], background: [], scenarios: [], outlines: [] };
  let i = 0;
  let currentTags: string[] = [];

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith("@")) { currentTags = line.split(/\s+/).filter((t) => t.startsWith("@")); i++; continue; }
    if (line.startsWith("Feature:")) { feature.name = line.replace("Feature:", "").trim(); feature.tags = currentTags; currentTags = []; i++; continue; }

    if (line.startsWith("Background:")) {
      i++;
      while (i < lines.length) {
        const sl = lines[i].trim();
        if (!sl || sl.startsWith("#") || sl.startsWith("Scenario") || sl.startsWith("@")) break;
        const m = sl.match(/^(Given|When|Then|And)\s+(.*)/);
        if (m) { const step: Step = { keyword: m[1], text: m[2] }; i++; if (i < lines.length && lines[i].trim().startsWith("|")) { const { rows, endIdx } = parseDataTable(lines, i); step.dataTable = rows; i = endIdx; } feature.background.push(step); }
        else i++;
      }
      continue;
    }

    if (line.startsWith("Scenario Outline:")) {
      const outline: ScenarioOutline = { name: line.replace("Scenario Outline:", "").trim(), tags: currentTags, steps: [], examples: [] };
      currentTags = []; i++;
      while (i < lines.length) {
        const sl = lines[i].trim();
        if (sl.startsWith("Examples:")) { i++; if (i < lines.length && lines[i].trim().startsWith("|")) { const { rows, endIdx } = parseDataTable(lines, i); outline.examples = rows; i = endIdx; } continue; }
        if (!sl || sl.startsWith("#")) { i++; continue; }
        if (sl.startsWith("Scenario") || sl.startsWith("@")) break;
        const m = sl.match(/^(Given|When|Then|And)\s+(.*)/);
        if (m) { const step: Step = { keyword: m[1], text: m[2] }; i++; if (i < lines.length && lines[i].trim().startsWith("|")) { const { rows, endIdx } = parseDataTable(lines, i); step.dataTable = rows; i = endIdx; } outline.steps.push(step); }
        else i++;
      }
      feature.outlines.push(outline); continue;
    }

    if (line.startsWith("Scenario:")) {
      const scenario: Scenario = { name: line.replace("Scenario:", "").trim(), tags: currentTags, steps: [] };
      currentTags = []; i++;
      while (i < lines.length) {
        const sl = lines[i].trim();
        if (!sl || sl.startsWith("#")) { i++; continue; }
        if (sl.startsWith("Scenario") || sl.startsWith("@")) break;
        const m = sl.match(/^(Given|When|Then|And)\s+(.*)/);
        if (m) { const step: Step = { keyword: m[1], text: m[2] }; i++; if (i < lines.length && lines[i].trim().startsWith("|")) { const { rows, endIdx } = parseDataTable(lines, i); step.dataTable = rows; i = endIdx; } scenario.steps.push(step); }
        else i++;
      }
      feature.scenarios.push(scenario); continue;
    }
    i++;
  }
  return feature;
}

// ---------------------------------------------------------------------------
// Step interpreter — table-agnostic
//
// Each step is classified by INTENT, not by specific wording.
// The interpreter produces CodeAction objects that the generator
// translates to Playwright API calls.
// ---------------------------------------------------------------------------

type CodeAction =
  | { type: "create"; table: string; data: Record<string, string>; varName: string; catalogItemName?: string }
  | { type: "update"; sysIdExpr: string; table: string; data: Record<string, string>; varName: string }
  | { type: "query"; table: string; query: string; varName: string }
  | { type: "assert_field"; varName: string; field: string; value: string }
  | { type: "assert_exists"; description: string; queryTable: string; query: string }
  | { type: "assert_not_empty"; varName: string; description: string }
  | { type: "capture"; varName: string; field: string; targetVar: string }
  | { type: "delete"; table: string; sysIdExpr: string }
  | { type: "track_cleanup"; table: string; sysIdExpr: string }
  | { type: "comment"; text: string }
  | { type: "approve"; sysIdExpr: string }
  | { type: "reject"; sysIdExpr: string };

// Table detection from step text
const TABLE_PATTERNS: Record<string, string> = {
  incident: "incident",
  "catalog item": "sc_cat_item",
  "requested item": "sc_req_item",
  ritm: "sc_req_item",
  "change request": "change_request",
  change: "change_request",
  problem: "problem",
  task: "sc_task",
  "fulfillment task": "sc_task",
  "catalog task": "sc_task",
  approval: "sysapproval_approver",
  email: "sys_email",
  notification: "sys_email",
  sla: "task_sla",
  "knowledge article": "kb_knowledge",
  user: "sys_user",
  group: "sys_user_group",
};

// Map display values to API values for common ServiceNow fields
function mapToApiValue(field: string, displayValue: string): string {
  // Fields where "N - Label" format should map to just "N"
  if (["priority", "impact", "urgency", "severity"].includes(field)) {
    const num = displayValue.match(/^(\d)/)?.[1];
    if (num) return num;
  }
  // State fields: display label → numeric code
  const stateMap: Record<string, string> = {
    "New": "1", "In Progress": "2", "On Hold": "3", "Resolved": "6", "Closed": "7", "Canceled": "8",
  };
  if (["state", "incident_state"].includes(field) && stateMap[displayValue]) {
    return stateMap[displayValue];
  }
  return displayValue;
}

function detectTable(text: string): string | null {
  const lower = text.toLowerCase();
  // Check longest patterns first to avoid partial matches
  const sorted = Object.keys(TABLE_PATTERNS).sort((a, b) => b.length - a.length);
  for (const pattern of sorted) {
    if (lower.includes(pattern)) return TABLE_PATTERNS[pattern];
  }
  return null;
}

// Approval state mapping
const APPROVAL_STATES: Record<string, string> = {
  approved: "approved",
  rejected: "rejected",
  requested: "requested",
  "not requested": "not requested",
  "not yet requested": "not yet requested",
};

function interpretSteps(steps: Step[], feature: Feature): CodeAction[] {
  const actions: CodeAction[] = [];
  let createCount = 0;
  let queryCount = 0;
  let lastCreateVar = "created";
  let lastUpdateVar = "";
  let lastQueryVar = "";
  // Track which table we're operating on
  let contextTable = detectTable(feature.name) || "incident";

  for (const step of steps) {
    const text = step.text;

    // --- SUBMIT / CREATE with data table ---
    // "I submit the <X> catalog item with:" or "I populate the <X> form with:" or "<X> exists with:"
    const submitMatch = text.match(/submit the (.+?) (?:catalog item|form) with/i)
      || text.match(/populate the (.+?) form with/i)
      || text.match(/(.+?) exists with/i);
    if (submitMatch && step.dataTable) {
      const tableHint = detectTable(submitMatch[1]) || detectTable(text) || contextTable;
      // For catalog item submissions, create via the cart API or sc_req_item
      const isCartSubmit = text.toLowerCase().includes("catalog item");
      const data: Record<string, string> = {};
      const headerKey = step.dataTable[0] && Object.keys(step.dataTable[0])[0];
      const isVariableTable = headerKey === "variable" || headerKey === "field";

      for (const row of step.dataTable) {
        if (isVariableTable) {
          const key = row.variable || row.field;
          data[key] = isCartSubmit ? row.value : mapToApiValue(key, row.value);
        } else {
          // Use first column as key, second as value
          const keys = Object.keys(row);
          data[keys[0]] = mapToApiValue(keys[0], row[keys[0]]);
        }
      }

      createCount++;
      const varName = createCount === 1 ? "created" : `created${createCount}`;
      lastCreateVar = varName;

      if (isCartSubmit) {
        // Extract catalog item name from step text (e.g. "submit the Hardware Checkout catalog item")
        const catNameMatch = text.match(/submit the (.+?) catalog item/i);
        const catalogItemName = catNameMatch ? catNameMatch[1] : feature.name;
        actions.push({ type: "comment", text: `Submit catalog item: ${catalogItemName}` });
        actions.push({ type: "create", table: "__catalog_order__", data, varName, catalogItemName });
      } else {
        actions.push({ type: "create", table: tableHint, data, varName });
      }
      actions.push({ type: "track_cleanup", table: isCartSubmit ? "sc_req_item" : tableHint, sysIdExpr: `${varName}.sys_id` });
      continue;
    }

    // --- QUERY a record ---
    const queryMatch = text.match(/I query the (?:catalog item|record) "(.+?)"/i);
    if (queryMatch) {
      queryCount++;
      const varName = queryCount === 1 ? "queried" : `queried${queryCount}`;
      lastQueryVar = varName;
      const table = detectTable(text) || "sc_cat_item";
      actions.push({ type: "query", table, query: `name=${queryMatch[1]}^active=true`, varName });
      continue;
    }

    // --- UPDATE with data table ---
    const updateMatch = text.match(/update the (.+?) with/i) || text.match(/I change (.+?) to/i);
    if (updateMatch && step.dataTable) {
      const data: Record<string, string> = {};
      for (const row of step.dataTable) {
        const key = row.variable || row.field;
        data[key] = mapToApiValue(key, row.value);
      }
      const varName = `updated${createCount > 1 ? createCount : ""}`;
      lastUpdateVar = varName;
      const table = detectTable(updateMatch[1]) || contextTable;
      actions.push({ type: "update", table, sysIdExpr: `${lastCreateVar}.sys_id`, data, varName });
      continue;
    }

    // --- APPROVAL actions ---
    if (text.match(/manager approves/i) || text.match(/approve the/i)) {
      actions.push({ type: "approve", sysIdExpr: `${lastCreateVar}.sys_id` });
      continue;
    }
    if (text.match(/manager rejects/i) || text.match(/reject the/i)) {
      actions.push({ type: "reject", sysIdExpr: `${lastCreateVar}.sys_id` });
      continue;
    }

    // --- ASSERT: approval state ---
    const approvalMatch = text.match(/approval state is "(.+?)"/i);
    if (approvalMatch) {
      const resultVar = lastUpdateVar || lastCreateVar;
      actions.push({ type: "assert_field", varName: resultVar, field: "approval", value: APPROVAL_STATES[approvalMatch[1].toLowerCase()] || approvalMatch[1] });
      continue;
    }

    // --- ASSERT: field value (generic) ---
    // "the <field> field value is <value>" or "the RITM variable <field> is <value>"
    const fieldAssert = text.match(/(?:the )?"(\w+)" (?:field value is|is) "(.+?)"/i)
      || text.match(/variable "(\w+)" is "(.+?)"/i);
    if (fieldAssert) {
      const resultVar = lastUpdateVar || lastCreateVar;
      actions.push({ type: "assert_field", varName: resultVar, field: fieldAssert[1], value: fieldAssert[2] });
      continue;
    }

    // --- ASSERT: record exists (catalog item, fulfillment task, approval, SLA, email) ---
    if (text.match(/catalog item exists/i) || text.match(/catalog item .+ is active/i)) {
      actions.push({ type: "assert_not_empty", varName: lastQueryVar || "queried", description: "catalog item exists and is active" });
      continue;
    }

    const fulfillMatch = text.match(/fulfillment task is assigned to "(.+?)"/i);
    if (fulfillMatch) {
      actions.push({ type: "assert_exists", description: `fulfillment task assigned to ${fulfillMatch[1]}`, queryTable: "sc_task", query: `request_item=\${${lastCreateVar}.sys_id}^assignment_group.name=${fulfillMatch[1]}` });
      continue;
    }

    if (text.match(/fulfillment task exists/i)) {
      actions.push({ type: "assert_exists", description: "fulfillment task exists", queryTable: "sc_task", query: `request_item=\${${lastCreateVar}.sys_id}` });
      continue;
    }

    const approvalExistsMatch = text.match(/approval record exists for (.+)/i);
    if (approvalExistsMatch) {
      actions.push({ type: "assert_exists", description: `approval record exists`, queryTable: "sysapproval_approver", query: `sysapproval=\${${lastCreateVar}.sys_id}` });
      continue;
    }

    if (text.match(/email notification is sent/i) || text.match(/notification.*sent/i)) {
      actions.push({ type: "assert_exists", description: "email notification sent", queryTable: "sys_email", query: `instance=\${${lastCreateVar}.sys_id}` });
      continue;
    }

    const slaMatch = text.match(/SLA record is attached with definition "(.+?)"/i);
    if (slaMatch) {
      actions.push({ type: "assert_exists", description: `SLA ${slaMatch[1]} attached`, queryTable: "task_sla", query: `task=\${${lastCreateVar}.sys_id}^sla.nameLIKE${slaMatch[1]}` });
      continue;
    }

    // --- ASSERT: has variable/choices (catalog item specific) ---
    const hasVarMatch = text.match(/has a variable "(\w+)" of type "(.+?)"/i);
    if (hasVarMatch) {
      actions.push({ type: "assert_exists", description: `variable ${hasVarMatch[1]} exists`, queryTable: "item_option_new", query: `cat_item=\${${lastQueryVar || "queried"}.sys_id}^name=${hasVarMatch[1]}` });
      continue;
    }

    if (text.match(/variable .+ has choices/i) && step.dataTable) {
      for (const row of step.dataTable) {
        const val = row.value || row.label;
        actions.push({ type: "comment", text: `Verify choice: ${val}` });
      }
      continue;
    }

    // --- CAPTURE for cleanup ---
    if (text.match(/captured for (?:cleanup|subsequent)/i) || text.match(/number is captured/i)) {
      actions.push({ type: "comment", text: "Record tracked for cleanup" });
      continue;
    }

    // --- ASSERT: generic "is created" ---
    if (text.match(/is created/i)) {
      actions.push({ type: "comment", text: "Record creation verified by API response" });
      continue;
    }

    // --- DEFAULT: unrecognized step → TODO comment ---
    actions.push({ type: "comment", text: `TODO: ${text}` });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Code emitter — turns CodeActions into Playwright TypeScript
// ---------------------------------------------------------------------------

function emitActions(actions: CodeAction[], indent: string): string {
  const lines: string[] = [];
  let refetchCounter = 0;

  for (const action of actions) {
    switch (action.type) {
      case "create": {
        if (action.table === "__catalog_order__") {
          // Service Catalog order via Cart API
          const catName = action.catalogItemName || "Unknown";
          lines.push(`${indent}// Order catalog item via Service Catalog API`);
          lines.push(`${indent}// First, find the catalog item`);
          lines.push(`${indent}const catItemRes = await request.get(\`/api/now/table/sc_cat_item?sysparm_query=name=${catName}^active=true&sysparm_fields=sys_id&sysparm_limit=1\`);`);
          lines.push(`${indent}const catItems = (await catItemRes.json()).result;`);
          lines.push(`${indent}expect(catItems.length).toBeGreaterThan(0);`);
          lines.push(`${indent}const catItemId = catItems[0].sys_id;`);
          lines.push(``);
          lines.push(`${indent}// Submit order via cart API`);
          lines.push(`${indent}const orderRes = await request.post(\`/api/sn_sc/servicecatalog/items/\${catItemId}/order_now\`, {`);
          lines.push(`${indent}  headers: { "Content-Type": "application/json", Accept: "application/json" },`);
          lines.push(`${indent}  data: {`);
          lines.push(`${indent}    sysparm_quantity: ${action.data.quantity || "1"},`);
          lines.push(`${indent}    variables: ${JSON.stringify(Object.fromEntries(Object.entries(action.data).filter(([k]) => k !== "quantity")), null, 6).replace(/\n/g, "\n" + indent + "    ")}`);
          lines.push(`${indent}  },`);
          lines.push(`${indent}});`);
          lines.push(`${indent}expect(orderRes.ok()).toBeTruthy();`);
          lines.push(`${indent}const orderData = await orderRes.json();`);
          lines.push(`${indent}const requestId = orderData.result?.request_id || orderData.result?.sys_id;`);
          lines.push(``);
          lines.push(`${indent}// Get the RITM from the request`);
          lines.push(`${indent}const ritmRes = await request.get(\`/api/now/table/sc_req_item?sysparm_query=request=\${requestId}&sysparm_limit=1\`);`);
          lines.push(`${indent}const ritms = (await ritmRes.json()).result;`);
          lines.push(`${indent}expect(ritms.length).toBeGreaterThan(0);`);
          lines.push(`${indent}const ${action.varName} = ritms[0];`);
        } else {
          lines.push(`${indent}// Create ${action.table} record`);
          lines.push(`${indent}const ${action.varName}Res = await request.post(\`/api/now/table/${action.table}\`, {`);
          lines.push(`${indent}  headers: { "Content-Type": "application/json", Accept: "application/json" },`);
          lines.push(`${indent}  data: ${JSON.stringify(action.data, null, 6).replace(/\n/g, "\n" + indent + "  ")},`);
          lines.push(`${indent}});`);
          lines.push(`${indent}expect(${action.varName}Res.ok()).toBeTruthy();`);
          lines.push(`${indent}const ${action.varName} = (await ${action.varName}Res.json()).result;`);
        }
        lines.push(``);
        break;
      }

      case "update": {
        lines.push(`${indent}// Update ${action.table} record`);
        lines.push(`${indent}const ${action.varName}Res = await request.patch(\`/api/now/table/${action.table}/\${${action.sysIdExpr}}\`, {`);
        lines.push(`${indent}  headers: { "Content-Type": "application/json", Accept: "application/json" },`);
        lines.push(`${indent}  data: ${JSON.stringify(action.data, null, 6).replace(/\n/g, "\n" + indent + "  ")},`);
        lines.push(`${indent}});`);
        lines.push(`${indent}expect(${action.varName}Res.ok()).toBeTruthy();`);
        lines.push(`${indent}const ${action.varName} = (await ${action.varName}Res.json()).result;`);
        lines.push(``);
        break;
      }

      case "query": {
        lines.push(`${indent}// Query ${action.table}`);
        lines.push(`${indent}const ${action.varName}Res = await request.get(\`/api/now/table/${action.table}?sysparm_query=${action.query}&sysparm_limit=1\`);`);
        lines.push(`${indent}expect(${action.varName}Res.ok()).toBeTruthy();`);
        lines.push(`${indent}const ${action.varName}List = (await ${action.varName}Res.json()).result;`);
        lines.push(`${indent}const ${action.varName} = ${action.varName}List[0];`);
        lines.push(``);
        break;
      }

      case "assert_field": {
        // Map ServiceNow display values to API values
        const apiValue = mapToApiValue(action.field, action.value);
        // Re-fetch the record to capture server-side computed fields (business rules, etc.)
        const refetchVar = `refetch${refetchCounter++}`;
        lines.push(`${indent}const ${refetchVar}Res = await request.get(\`/api/now/table/\${${action.varName}.sys_class_name || "incident"}/\${${action.varName}.sys_id}?sysparm_fields=${action.field}\`);`);
        lines.push(`${indent}const ${refetchVar} = (await ${refetchVar}Res.json()).result;`);
        lines.push(`${indent}expect(${refetchVar}.${action.field}).toBe("${apiValue}");`);
        break;
      }

      case "assert_exists": {
        lines.push(`${indent}// Assert: ${action.description}`);
        lines.push(`${indent}const ${action.description.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)}Res = await request.get(\`/api/now/table/${action.queryTable}?sysparm_query=${action.query}&sysparm_limit=5\`);`);
        lines.push(`${indent}const ${action.description.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)}Data = (await ${action.description.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)}Res.json()).result;`);
        lines.push(`${indent}expect(${action.description.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)}Data.length).toBeGreaterThan(0);`);
        lines.push(``);
        break;
      }

      case "assert_not_empty": {
        lines.push(`${indent}expect(${action.varName}).toBeTruthy();`);
        break;
      }

      case "track_cleanup": {
        lines.push(`${indent}createdIds.push({ table: "${action.table}", id: ${action.sysIdExpr} });`);
        break;
      }

      case "approve": {
        lines.push(`${indent}// Approve: find and approve the approval record`);
        lines.push(`${indent}const approvalRes = await request.get(\`/api/now/table/sysapproval_approver?sysparm_query=sysapproval=\${${action.sysIdExpr}}&sysparm_limit=1\`);`);
        lines.push(`${indent}const approvals = (await approvalRes.json()).result;`);
        lines.push(`${indent}expect(approvals.length).toBeGreaterThan(0);`);
        lines.push(`${indent}await request.patch(\`/api/now/table/sysapproval_approver/\${approvals[0].sys_id}\`, {`);
        lines.push(`${indent}  headers: { "Content-Type": "application/json", Accept: "application/json" },`);
        lines.push(`${indent}  data: { state: "approved" },`);
        lines.push(`${indent}});`);
        lines.push(`${indent}// Re-fetch the record to get updated state`);
        lines.push(`${indent}const refreshRes = await request.get(\`/api/now/table/sc_req_item/\${${action.sysIdExpr}}\`);`);
        lines.push(`${indent}Object.assign(${action.sysIdExpr.replace(".sys_id", "")}, (await refreshRes.json()).result);`);
        lines.push(``);
        break;
      }

      case "reject": {
        lines.push(`${indent}// Reject: find and reject the approval record`);
        lines.push(`${indent}const rejectRes = await request.get(\`/api/now/table/sysapproval_approver?sysparm_query=sysapproval=\${${action.sysIdExpr}}&sysparm_limit=1\`);`);
        lines.push(`${indent}const rejectApprovals = (await rejectRes.json()).result;`);
        lines.push(`${indent}expect(rejectApprovals.length).toBeGreaterThan(0);`);
        lines.push(`${indent}await request.patch(\`/api/now/table/sysapproval_approver/\${rejectApprovals[0].sys_id}\`, {`);
        lines.push(`${indent}  headers: { "Content-Type": "application/json", Accept: "application/json" },`);
        lines.push(`${indent}  data: { state: "rejected" },`);
        lines.push(`${indent}});`);
        lines.push(`${indent}// Re-fetch the record to get updated state`);
        lines.push(`${indent}const refreshRejectRes = await request.get(\`/api/now/table/sc_req_item/\${${action.sysIdExpr}}\`);`);
        lines.push(`${indent}Object.assign(${action.sysIdExpr.replace(".sys_id", "")}, (await refreshRejectRes.json()).result);`);
        lines.push(``);
        break;
      }

      case "comment": {
        lines.push(`${indent}// ${action.text}`);
        break;
      }
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Spec file generator
// ---------------------------------------------------------------------------

function generateSpec(feature: Feature): string {
  const lines: string[] = [];

  lines.push(`import { test, expect } from "@playwright/test";`);
  lines.push(`import "dotenv/config";`);
  lines.push(``);
  lines.push(`test.describe("${feature.name}", () => {`);
  lines.push(`  const createdIds: Array<{ table: string; id: string }> = [];`);
  lines.push(``);

  // Cleanup helper using raw fetch
  lines.push(`  const baseUrl = process.env.SN_INSTANCE!;`);
  lines.push(`  const authHeader = "Basic " + Buffer.from(\`\${process.env.SN_USER}:\${process.env.SN_PASSWORD}\`).toString("base64");`);
  lines.push(``);
  lines.push(`  async function apiDelete(path: string) {`);
  lines.push(`    await fetch(\`\${baseUrl}\${path}\`, { method: "DELETE", headers: { Authorization: authHeader, Accept: "application/json" } });`);
  lines.push(`  }`);
  lines.push(``);
  lines.push(`  test.afterAll(async () => {`);
  lines.push(`    for (const rec of createdIds) {`);
  lines.push(`      await apiDelete(\`/api/now/table/\${rec.table}/\${rec.id}\`).catch(() => {});`);
  lines.push(`    }`);
  lines.push(`  });`);
  lines.push(``);

  // Scenario Outlines
  for (const outline of feature.outlines) {
    lines.push(generateOutlineSpec(outline, feature));
  }

  // Regular Scenarios
  for (const scenario of feature.scenarios) {
    const tags = scenario.tags.length ? ` /* ${scenario.tags.join(" ")} */` : "";
    const actions = interpretSteps(scenario.steps, feature);

    lines.push(`  test("${scenario.name}",${tags} async ({ request }) => {`);
    lines.push(emitActions(actions, "    "));
    lines.push(`  });`);
    lines.push(``);
  }

  lines.push(`});`);
  lines.push(``);
  return lines.join("\n");
}

function generateOutlineSpec(outline: ScenarioOutline, feature: Feature): string {
  const lines: string[] = [];

  for (const example of outline.examples) {
    const exampleLabel = Object.entries(example).map(([k, v]) => `${k}=${v}`).join(", ");
    const testName = `${outline.name} (${exampleLabel})`;

    // Substitute <placeholders> in steps
    const substitutedSteps: Step[] = outline.steps.map((step) => {
      let text = step.text;
      text = text.replace(/<(\w+)>/g, (_, key) => example[key] || key);
      let dataTable = step.dataTable;
      if (dataTable) {
        dataTable = dataTable.map((row) => {
          const newRow: DataTableRow = {};
          for (const [k, v] of Object.entries(row)) {
            newRow[k] = v.replace(/<(\w+)>/g, (_, key) => example[key] || key);
          }
          return newRow;
        });
      }
      return { ...step, text, dataTable };
    });

    const actions = interpretSteps(substitutedSteps, feature);

    // Add assertion for any example column that looks like expected_*
    for (const [key, value] of Object.entries(example)) {
      if (key.startsWith("expected_")) {
        const field = key.replace("expected_", "");
        const numVal = value.match(/^(\d)/)?.[1];
        actions.push({ type: "assert_field", varName: "created", field, value: numVal || value });
      }
    }

    lines.push(`  test("${testName}", async ({ request }) => {`);
    lines.push(emitActions(actions, "    "));
    lines.push(`  });`);
    lines.push(``);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const contractsDir = process.argv[3] || "contracts";
const specificContract = process.argv[2];
const outputDir = "tests/generated";

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const files = readdirSync(contractsDir)
  .filter((f) => f.endsWith(".feature"))
  .filter((f) => !specificContract || f.replace(".feature", "") === specificContract);

if (files.length === 0) {
  console.error(`No .feature files found${specificContract ? ` matching "${specificContract}"` : ""}`);
  process.exit(1);
}

let generated = 0;
for (const file of files) {
  const content = readFileSync(join(contractsDir, file), "utf8");
  const feature = parseFeature(content);
  const specName = basename(file, ".feature") + ".spec.ts";
  const specContent = generateSpec(feature);
  writeFileSync(join(outputDir, specName), specContent);
  console.log(`Generated: ${outputDir}/${specName} (${feature.scenarios.length} scenarios, ${feature.outlines.length} outlines)`);
  generated++;
}

console.log(`\nDone: ${generated} spec file(s) written to ${outputDir}/`);
console.log(`Run: npm test`);
