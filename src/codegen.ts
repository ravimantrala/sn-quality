/**
 * Gherkin-to-Playwright codegen.
 *
 * Reads .feature files from contracts/ and generates runnable .spec.ts
 * files in tests/generated/. Each feature becomes one spec file.
 *
 * Usage: npx tsx src/codegen.ts [contract-name]
 */

import "dotenv/config";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

// ---------------------------------------------------------------------------
// Gherkin parser (minimal — handles our contract patterns)
// ---------------------------------------------------------------------------

interface DataTableRow {
  [key: string]: string;
}

interface Step {
  keyword: string; // Given | When | Then | And
  text: string;
  dataTable?: DataTableRow[];
}

interface Scenario {
  name: string;
  tags: string[];
  steps: Step[];
}

interface ScenarioOutline {
  name: string;
  tags: string[];
  steps: Step[];
  examples: DataTableRow[];
}

interface Feature {
  name: string;
  tags: string[];
  background: Step[];
  scenarios: Scenario[];
  outlines: ScenarioOutline[];
}

function parseDataTable(lines: string[], startIdx: number): { rows: DataTableRow[]; endIdx: number } {
  const rows: DataTableRow[] = [];
  let headers: string[] = [];
  let i = startIdx;

  while (i < lines.length && lines[i].trim().startsWith("|")) {
    const cells = lines[i].trim().split("|").filter(Boolean).map((c) => c.trim());
    if (headers.length === 0) {
      headers = cells;
    } else {
      const row: DataTableRow = {};
      cells.forEach((cell, idx) => {
        row[headers[idx]] = cell;
      });
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

    // Tags
    if (line.startsWith("@")) {
      currentTags = line.split(/\s+/).filter((t) => t.startsWith("@"));
      i++;
      continue;
    }

    // Feature
    if (line.startsWith("Feature:")) {
      feature.name = line.replace("Feature:", "").trim();
      feature.tags = currentTags;
      currentTags = [];
      i++;
      continue;
    }

    // Background
    if (line.startsWith("Background:")) {
      i++;
      while (i < lines.length) {
        const stepLine = lines[i].trim();
        if (!stepLine || stepLine.startsWith("#") || stepLine.startsWith("Scenario") || stepLine.startsWith("@")) break;
        const match = stepLine.match(/^(Given|When|Then|And)\s+(.*)/);
        if (match) {
          const step: Step = { keyword: match[1], text: match[2] };
          i++;
          if (i < lines.length && lines[i].trim().startsWith("|")) {
            const { rows, endIdx } = parseDataTable(lines, i);
            step.dataTable = rows;
            i = endIdx;
          }
          feature.background.push(step);
        } else {
          i++;
        }
      }
      continue;
    }

    // Scenario Outline
    if (line.startsWith("Scenario Outline:")) {
      const outline: ScenarioOutline = { name: line.replace("Scenario Outline:", "").trim(), tags: currentTags, steps: [], examples: [] };
      currentTags = [];
      i++;

      while (i < lines.length) {
        const stepLine = lines[i].trim();
        if (stepLine.startsWith("Examples:")) {
          i++;
          if (i < lines.length && lines[i].trim().startsWith("|")) {
            const { rows, endIdx } = parseDataTable(lines, i);
            outline.examples = rows;
            i = endIdx;
          }
          continue;
        }
        if (!stepLine || stepLine.startsWith("#")) { i++; continue; }
        if (stepLine.startsWith("Scenario") || stepLine.startsWith("@")) break;
        const match = stepLine.match(/^(Given|When|Then|And)\s+(.*)/);
        if (match) {
          const step: Step = { keyword: match[1], text: match[2] };
          i++;
          if (i < lines.length && lines[i].trim().startsWith("|")) {
            const { rows, endIdx } = parseDataTable(lines, i);
            step.dataTable = rows;
            i = endIdx;
          }
          outline.steps.push(step);
        } else {
          i++;
        }
      }

      feature.outlines.push(outline);
      continue;
    }

    // Regular Scenario
    if (line.startsWith("Scenario:")) {
      const scenario: Scenario = { name: line.replace("Scenario:", "").trim(), tags: currentTags, steps: [] };
      currentTags = [];
      i++;

      while (i < lines.length) {
        const stepLine = lines[i].trim();
        if (!stepLine || stepLine.startsWith("#")) { i++; continue; }
        if (stepLine.startsWith("Scenario") || stepLine.startsWith("@")) break;
        const match = stepLine.match(/^(Given|When|Then|And)\s+(.*)/);
        if (match) {
          const step: Step = { keyword: match[1], text: match[2] };
          i++;
          if (i < lines.length && lines[i].trim().startsWith("|")) {
            const { rows, endIdx } = parseDataTable(lines, i);
            step.dataTable = rows;
            i = endIdx;
          }
          scenario.steps.push(step);
        } else {
          i++;
        }
      }

      feature.scenarios.push(scenario);
      continue;
    }

    i++;
  }

  return feature;
}

// ---------------------------------------------------------------------------
// Code generator — turns parsed features into Playwright spec code
// ---------------------------------------------------------------------------

function generateApiTest(scenario: Scenario, feature: Feature): string {
  const lines: string[] = [];
  let indent = "    ";

  // Track what we need to create/update
  const formData = extractFormData(scenario.steps);
  const updateData = extractUpdateData(scenario.steps);
  const beforeAssertions = extractAssertions(scenario.steps, "before");
  const afterAssertions = extractAssertions(scenario.steps, "after");

  if (formData) {
    lines.push(`${indent}// Create incident`);
    lines.push(`${indent}const createRes = await request.post(\`/api/now/table/incident\`, {`);
    lines.push(`${indent}  headers: { "Content-Type": "application/json", Accept: "application/json" },`);
    lines.push(`${indent}  data: ${JSON.stringify(formData, null, 6).replace(/\n/g, "\n" + indent + "  ")},`);
    lines.push(`${indent}});`);
    lines.push(`${indent}expect(createRes.ok()).toBeTruthy();`);
    lines.push(`${indent}const created = (await createRes.json()).result;`);
    lines.push(`${indent}createdIds.push(created.sys_id);`);
    lines.push(``);
  }

  // "Before" assertions — verify state after creation, before update
  for (const a of beforeAssertions) {
    lines.push(generateFieldAssert(indent, "created", a));
  }

  if (updateData && formData) {
    lines.push(`${indent}// Update incident`);
    lines.push(`${indent}const updateRes = await request.patch(\`/api/now/table/incident/\${created.sys_id}\`, {`);
    lines.push(`${indent}  headers: { "Content-Type": "application/json", Accept: "application/json" },`);
    lines.push(`${indent}  data: ${JSON.stringify(updateData, null, 6).replace(/\n/g, "\n" + indent + "  ")},`);
    lines.push(`${indent}});`);
    lines.push(`${indent}expect(updateRes.ok()).toBeTruthy();`);
    lines.push(`${indent}const updated = (await updateRes.json()).result;`);
    lines.push(``);
  }

  // "After" assertions — verify state after update (or after creation if no update)
  const resultVar = updateData ? "updated" : "created";
  for (const a of afterAssertions) {
    lines.push(generateFieldAssert(indent, resultVar, a));
  }

  return lines.join("\n");
}

function generateFieldAssert(indent: string, varName: string, a: Assertion): string {
  if (a.field === "priority") {
    const numVal = a.value.match(/^(\d)/)?.[1];
    if (numVal) return `${indent}expect(${varName}.priority).toBe("${numVal}");`;
  } else if (a.field === "state") {
    const stateMap: Record<string, string> = { "New": "1", "In Progress": "2", "On Hold": "3", "Resolved": "6", "Closed": "7" };
    const stateVal = stateMap[a.value] || a.value;
    return `${indent}expect(${varName}.state).toBe("${stateVal}");`;
  }
  return `${indent}// TODO: assert ${a.field} = ${a.value}`;
}

function generateOutlineApiTest(outline: ScenarioOutline): string {
  const lines: string[] = [];

  // Build the form data template from steps
  const formSteps = outline.steps.filter((s) => s.text.includes("populate the incident form"));
  const formTable = formSteps[0]?.dataTable || [];

  for (const example of outline.examples) {
    // Build a descriptive test name from example values
    const exampleLabel = Object.entries(example).map(([k, v]) => `${k}=${v}`).join(", ");
    const testName = `${outline.name} (${exampleLabel})`;
    lines.push(`  test("${testName}", async ({ request }) => {`);

    // Build form data, substituting <placeholders> and mapping values
    const formData: Record<string, string> = {};
    for (const row of formTable) {
      let val = row.value;
      val = val.replace(/<(\w+)>/g, (_, key) => example[key] || key);
      const fieldName = mapFieldName(row.field);
      formData[fieldName] = mapFieldValue(row.field, val);
    }

    lines.push(`    const res = await request.post(\`/api/now/table/incident\`, {`);
    lines.push(`      headers: { "Content-Type": "application/json", Accept: "application/json" },`);
    lines.push(`      data: ${JSON.stringify(formData, null, 8).replace(/\n/g, "\n      ")},`);
    lines.push(`    });`);
    lines.push(`    expect(res.ok()).toBeTruthy();`);
    lines.push(`    const result = (await res.json()).result;`);
    lines.push(`    createdIds.push(result.sys_id);`);

    // Assert expected priority from example
    if (example.expected_priority) {
      const numVal = example.expected_priority.match(/^(\d)/)?.[1];
      if (numVal) {
        lines.push(`    expect(result.priority).toBe("${numVal}");`);
      }
    }

    lines.push(`  });`);
    lines.push(``);
  }

  return lines.join("\n");
}

function generateBrowserTest(scenario: Scenario): string {
  const lines: string[] = [];
  const indent = "    ";

  for (const step of scenario.steps) {
    // Navigate
    const navMatch = step.text.match(/I navigate to "(.+)"/);
    if (navMatch) {
      lines.push(`${indent}await page.goto(\`/${navMatch[1]}\`);`);
      lines.push(`${indent}await page.waitForLoadState("networkidle");`);
      continue;
    }

    // Open previously created incident
    if (step.text.includes("open the previously created")) {
      lines.push(`${indent}await page.goto(\`/incident.do?sys_id=\${incidentSysId}\`);`);
      lines.push(`${indent}await page.waitForLoadState("networkidle");`);
      continue;
    }

    // Populate form with data table
    if (step.text.includes("populate the incident form") && step.dataTable) {
      for (const row of step.dataTable) {
        const field = row.field;
        const value = row.value;
        if (["impact", "urgency", "category", "subcategory", "state", "channel"].includes(field)) {
          lines.push(`${indent}await page.locator('#incident\\\\.${field}').selectOption({ label: "${value}" });`);
        } else if (["caller_id", "assignment_group", "assigned_to", "cmdb_ci", "service", "service_offering"].includes(field)) {
          lines.push(`${indent}await page.locator('#sys_display\\\\.incident\\\\.${field}').fill("${value}");`);
          lines.push(`${indent}await page.waitForTimeout(500);`);
          lines.push(`${indent}await page.keyboard.press("Tab");`);
          lines.push(`${indent}await page.waitForTimeout(500);`);
        } else {
          lines.push(`${indent}await page.locator('#incident\\\\.${field}').fill("${value}");`);
        }
      }
      continue;
    }

    // Submit
    if (step.text.includes("submit the form") || step.text.includes("I submit")) {
      lines.push(`${indent}await page.locator('#sysverb_insert').click();`);
      lines.push(`${indent}await page.waitForLoadState("networkidle");`);
      continue;
    }

    // Save / Update
    if (step.text.includes("save the form")) {
      lines.push(`${indent}await page.locator('#sysverb_update').click();`);
      lines.push(`${indent}await page.waitForLoadState("networkidle");`);
      continue;
    }

    // Field is read-only
    if (step.text.match(/field is read-only/)) {
      const fieldMatch = step.text.match(/"(\w+)"/);
      if (fieldMatch) {
        lines.push(`${indent}const ${fieldMatch[1]}El = page.locator('#incident\\\\.${fieldMatch[1]}');`);
        lines.push(`${indent}await expect(${fieldMatch[1]}El).toBeDisabled();`);
      }
      continue;
    }

    // Field value assertion
    const valMatch = step.text.match(/"(\w+)" field value is "(.+)"/);
    if (valMatch) {
      lines.push(`${indent}const ${valMatch[1]}Val = await page.locator('#incident\\\\.${valMatch[1]}').inputValue();`);
      const numVal = valMatch[2].match(/^(\d)/)?.[1];
      if (numVal) {
        lines.push(`${indent}expect(${valMatch[1]}Val).toBe("${numVal}");`);
      } else {
        lines.push(`${indent}expect(${valMatch[1]}Val).toBe("${valMatch[2]}");`);
      }
      continue;
    }

    // Navigate to related list
    const relMatch = step.text.match(/navigate to the related list "(.+)"/);
    if (relMatch) {
      lines.push(`${indent}await page.getByRole("tab", { name: "${relMatch[1]}" }).click();`);
      lines.push(`${indent}await page.waitForTimeout(1000);`);
      continue;
    }

    // SLA record assertion
    if (step.text.includes("SLA record exists with") && step.dataTable) {
      for (const row of step.dataTable) {
        lines.push(`${indent}await expect(page.locator("text=${row.sla_definition}")).toBeVisible();`);
      }
      continue;
    }

    // SLA attached assertion (API check)
    const slaMatch = step.text.match(/SLA record is attached with definition "(.+)"/);
    if (slaMatch) {
      lines.push(`${indent}// Verify SLA via API`);
      lines.push(`${indent}const slaRes = await request.get(\`/api/now/table/task_sla?sysparm_query=task=\${incidentSysId}^sla.nameLIKE${slaMatch[1]}\`);`);
      lines.push(`${indent}const slaData = (await slaRes.json()).result;`);
      lines.push(`${indent}expect(slaData.length).toBeGreaterThan(0);`);
      continue;
    }

    // Notification assertion
    const notifMatch = step.text.match(/notification is sent for "(.+)"/);
    if (notifMatch) {
      lines.push(`${indent}// Verify notification via API`);
      lines.push(`${indent}const emailRes = await request.get(\`/api/now/table/sys_email?sysparm_query=instance=\${incidentSysId}\`);`);
      lines.push(`${indent}const emails = (await emailRes.json()).result;`);
      lines.push(`${indent}expect(emails.length).toBeGreaterThan(0);`);
      continue;
    }

    // Capture incident number
    if (step.text.includes("incident number is captured")) {
      lines.push(`${indent}// Incident sys_id already captured`);
      continue;
    }

    // Default: comment the step
    lines.push(`${indent}// TODO: ${step.text}`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapFieldName(field: string): string {
  const map: Record<string, string> = {
    caller_id: "caller_id",
    short_description: "short_description",
    description: "description",
    impact: "impact",
    urgency: "urgency",
    category: "category",
    subcategory: "subcategory",
    assignment_group: "assignment_group",
    assigned_to: "assigned_to",
    cmdb_ci: "cmdb_ci",
    channel: "contact_type",
  };
  return map[field] || field;
}

function mapFieldValue(field: string, value: string): string {
  // Extract numeric values for impact/urgency/priority
  if (["impact", "urgency", "priority"].includes(field)) {
    const num = value.match(/^(\d)/)?.[1];
    return num || value;
  }
  return value;
}

function extractFormData(steps: Step[]): Record<string, string> | null {
  for (const step of steps) {
    if (step.text.includes("populate the incident form") || step.text.includes("incident exists with")) {
      if (step.dataTable) {
        const data: Record<string, string> = {};
        for (const row of step.dataTable) {
          data[mapFieldName(row.field)] = mapFieldValue(row.field, row.value);
        }
        return data;
      }
    }
  }
  return null;
}

function extractUpdateData(steps: Step[]): Record<string, string> | null {
  for (const step of steps) {
    if (step.text.includes("update the incident with")) {
      if (step.dataTable) {
        const data: Record<string, string> = {};
        for (const row of step.dataTable) {
          data[mapFieldName(row.field)] = mapFieldValue(row.field, row.value);
        }
        return data;
      }
    }
  }
  return null;
}

interface Assertion {
  field: string;
  value: string;
}

function extractAssertions(steps: Step[], phase: "before" | "after"): Assertion[] {
  const assertions: Assertion[] = [];
  let seenUpdate = false;

  for (const step of steps) {
    if (step.text.includes("update the incident with") || step.text.includes("save the form")) {
      seenUpdate = true;
      continue;
    }
    const match = step.text.match(/"(\w+)" field value is "(.+)"/);
    if (match) {
      const isBeforeAssertion = !seenUpdate;
      if ((phase === "before" && isBeforeAssertion) || (phase === "after" && !isBeforeAssertion)) {
        assertions.push({ field: match[1], value: match[2] });
      }
    }
  }

  // If no update step exists, all assertions are "after" (post-creation)
  if (!seenUpdate && phase === "after") {
    for (const step of steps) {
      const match = step.text.match(/"(\w+)" field value is "(.+)"/);
      if (match) {
        // Only add if not already captured as "before"
        if (!assertions.find((a) => a.field === match[1] && a.value === match[2])) {
          assertions.push({ field: match[1], value: match[2] });
        }
      }
    }
  }

  return assertions;
}

function isApiOnly(scenario: Scenario): boolean {
  // If it has navigate/click/form actions, it needs a browser
  for (const step of scenario.steps) {
    if (step.text.includes("navigate to") && step.text.includes(".do")) return false;
    if (step.text.includes("click")) return false;
    if (step.text.includes("open the previously created")) return false;
    if (step.text.includes("navigate to the related list")) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Spec file generator
// ---------------------------------------------------------------------------

function generateSpec(feature: Feature, featureFileName: string): string {
  const lines: string[] = [];

  lines.push(`import { test, expect } from "@playwright/test";`);
  lines.push(``);
  lines.push(`// baseURL is set in playwright.config.ts — use relative paths with request`);
  lines.push(``);
  lines.push(`test.describe("${feature.name}", () => {`);
  lines.push(`  const createdIds: string[] = [];`);
  lines.push(`  let incidentSysId: string;`);
  lines.push(``);

  // Cleanup after all tests using raw fetch (afterAll doesn't support request fixture)
  lines.push(`  const baseUrl = process.env.SN_INSTANCE!;`);
  lines.push(`  const authHeader = "Basic " + Buffer.from(\`\${process.env.SN_USER}:\${process.env.SN_PASSWORD}\`).toString("base64");`);
  lines.push(``);
  lines.push(`  async function apiDelete(path: string) {`);
  lines.push(`    await fetch(\`\${baseUrl}\${path}\`, { method: "DELETE", headers: { Authorization: authHeader, Accept: "application/json" } });`);
  lines.push(`  }`);
  lines.push(`  async function apiGet(path: string) {`);
  lines.push(`    const res = await fetch(\`\${baseUrl}\${path}\`, { headers: { Authorization: authHeader, Accept: "application/json" } });`);
  lines.push(`    return res.json();`);
  lines.push(`  }`);
  lines.push(``);
  lines.push(`  test.afterAll(async () => {`);
  lines.push(`    for (const id of createdIds) {`);
  lines.push(`      await apiDelete(\`/api/now/table/incident/\${id}\`).catch(() => {});`);
  lines.push(`    }`);
  lines.push(`  });`);
  lines.push(``);

  // Scenario Outlines — expand into individual tests
  for (const outline of feature.outlines) {
    lines.push(generateOutlineApiTest(outline));
  }

  // Regular Scenarios
  for (const scenario of feature.scenarios) {
    const tags = scenario.tags.length ? ` ${scenario.tags.join(" ")}` : "";
    const apiOnly = isApiOnly(scenario);

    if (apiOnly) {
      lines.push(`  test("${scenario.name}",${tags ? ` /* ${tags} */` : ""} async ({ request }) => {`);
      lines.push(generateApiTest(scenario, feature));
      lines.push(`  });`);
    } else {
      lines.push(`  test("${scenario.name}",${tags ? ` /* ${tags} */` : ""} async ({ page, request }) => {`);
      lines.push(generateBrowserTest(scenario));
      lines.push(`  });`);
    }
    lines.push(``);
  }

  lines.push(`});`);
  lines.push(``);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main — read contracts, generate specs
// ---------------------------------------------------------------------------

const contractsDir = process.argv[3] || "contracts";
const specificContract = process.argv[2];
const outputDir = "tests/generated";

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

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
  const specContent = generateSpec(feature, file);

  writeFileSync(join(outputDir, specName), specContent);
  console.log(`Generated: ${outputDir}/${specName} (${feature.scenarios.length} scenarios, ${feature.outlines.length} outlines)`);
  generated++;
}

console.log(`\nDone: ${generated} spec file(s) written to ${outputDir}/`);
console.log(`Run: npx playwright test`);
