/**
 * sn-quality smoke test
 * Exercises the end-to-end MCP tool pipeline against a live ServiceNow instance.
 *
 * Usage:  npx tsx tests/smoke.ts
 */

import { readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

// Load .env from project root
config({ path: join(import.meta.dirname, "..", ".env") });

// ── Inline SnClient (mirrors src/sn-client.ts to avoid build dependency) ─────

class SnClient {
  private instance: string;
  private auth: string;

  constructor() {
    const instance = process.env.SN_INSTANCE;
    const user = process.env.SN_USER;
    const pass = process.env.SN_PASSWORD;
    if (!instance || !user || !pass) {
      throw new Error("Missing SN_INSTANCE, SN_USER, or SN_PASSWORD in .env");
    }
    this.instance = instance.replace(/\/$/, "");
    this.auth = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  }

  private get base() {
    return `${this.instance}/api/now/table`;
  }

  async query(table: string, query?: string, fields?: string[], limit = 20) {
    const url = new URL(`${this.base}/${table}`);
    if (query) url.searchParams.set("sysparm_query", query);
    if (fields) url.searchParams.set("sysparm_fields", fields.join(","));
    url.searchParams.set("sysparm_limit", String(limit));

    const res = await fetch(url.toString(), {
      headers: { Authorization: this.auth, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Query ${table} failed: ${res.status} — ${body}`);
    }
    const data = (await res.json()) as { result: Record<string, string>[] };
    return data.result;
  }

  async insert(table: string, record: Record<string, string>) {
    const res = await fetch(`${this.base}/${table}`, {
      method: "POST",
      headers: {
        Authorization: this.auth,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Insert ${table} failed: ${res.status} — ${body}`);
    }
    return ((await res.json()) as { result: Record<string, string> }).result;
  }

  async deleteRecord(table: string, sysId: string) {
    const res = await fetch(`${this.base}/${table}/${sysId}`, {
      method: "DELETE",
      headers: { Authorization: this.auth, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Delete ${table}/${sysId} failed: ${res.status}`);
  }
}

// ── Test harness ─────────────────────────────────────────────────────────────

const PASS = "\x1b[32mPASS\x1b[0m";
const FAIL = "\x1b[31mFAIL\x1b[0m";
const results: { name: string; ok: boolean; detail: string; ms: number }[] = [];

async function test(name: string, fn: () => Promise<string>) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    const ms = Date.now() - t0;
    results.push({ name, ok: true, detail, ms });
    console.log(`  ${PASS}  ${name} (${ms}ms) — ${detail}`);
  } catch (err: unknown) {
    const ms = Date.now() - t0;
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, ok: false, detail: msg, ms });
    console.log(`  ${FAIL}  ${name} (${ms}ms) — ${msg}`);
  }
}

// ── Smoke tests ──────────────────────────────────────────────────────────────

const CONTRACTS_DIR = join(import.meta.dirname, "..", "contracts-smoke");
// Cleanup leftover from prior runs
if (existsSync(CONTRACTS_DIR)) rmSync(CONTRACTS_DIR, { recursive: true });

console.log(`\n  sn-quality smoke test\n  Instance: ${process.env.SN_INSTANCE}\n`);

const sn = new SnClient();

// Track artifacts we create so we can clean them up
let deployedSysId: string | null = null;

// 1 — Connectivity & basic query
await test("1. Query incident table", async () => {
  const rows = await sn.query("incident", "active=true", ["number", "short_description", "state"], 3);
  if (rows.length === 0) return "0 active incidents (query worked, table may be empty)";
  return `Got ${rows.length} incidents — first: ${rows[0].number}`;
});

// 2 — Check artifact exists (table)
await test("2. Check-exists: incident table", async () => {
  const rows = await sn.query("sys_db_object", "name=incident", ["sys_id", "label"], 1);
  if (rows.length === 0) throw new Error("incident table not found in sys_db_object");
  return `Table exists — label: "${rows[0].label}"`;
});

// 3 — Check artifact exists (field on table)
await test("3. Check-exists: priority field on incident", async () => {
  const rows = await sn.query("sys_dictionary", "name=incident^element=priority", ["sys_id", "column_label"], 1);
  if (rows.length === 0) throw new Error("priority field not found on incident");
  return `Field exists — label: "${rows[0].column_label}"`;
});

// 4 — Discover metadata for incident table
await test("4. Discover incident table metadata", async () => {
  const [br, uip, acls, notif] = await Promise.all([
    sn.query("sys_script", "collection=incident^active=true", ["sys_id", "name"], 5),
    sn.query("sys_ui_policy", "collection=incident", ["sys_id", "short_description"], 5),
    sn.query("sys_security_acl", "name=incident.*", ["sys_id", "name"], 5),
    sn.query("sysevent_email_action", "collection=incident", ["sys_id", "name"], 5),
  ]);
  return `BR:${br.length} UIP:${uip.length} ACL:${acls.length} Notif:${notif.length}`;
});

// 5 — Generate a Gherkin contract (file I/O)
await test("5. Generate Gherkin contract", async () => {
  const { mkdirSync, writeFileSync } = await import("node:fs");
  mkdirSync(CONTRACTS_DIR, { recursive: true });

  const gherkin = `Feature: Incident priority auto-calculation
  Smoke test contract for sn-quality validation

  @smoke
  Scenario: High impact + high urgency sets P1
    Given I am logged in as "itil"
    And I create a new Incident
    When I set "Impact" to "1 - High"
    And I set "Urgency" to "1 - High"
    And I submit the form
    Then the field "Priority" should display "1 - Critical"

  @smoke
  Scenario: Low impact + low urgency sets P5
    Given I am logged in as "itil"
    And I create a new Incident
    When I set "Impact" to "3 - Low"
    And I set "Urgency" to "3 - Low"
    And I submit the form
    Then the field "Priority" should display "5 - Planning"
`;

  writeFileSync(join(CONTRACTS_DIR, "smoke-incident-priority.feature"), gherkin, "utf-8");
  const files = readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".feature"));
  return `Wrote ${files.length} contract(s) to ${CONTRACTS_DIR}`;
});

// 6 — Review contracts (file read)
await test("6. Review contracts", async () => {
  const files = readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".feature"));
  if (files.length === 0) throw new Error("No .feature files found");
  const content = readFileSync(join(CONTRACTS_DIR, files[0]), "utf-8");
  const scenarios = (content.match(/Scenario:/g) || []).length;
  return `${files.length} file(s), ${scenarios} scenario(s)`;
});

// 7 — Parse contract into execution plan (Gherkin parsing)
await test("7. Parse Gherkin into execution plan", async () => {
  const content = readFileSync(join(CONTRACTS_DIR, "smoke-incident-priority.feature"), "utf-8");
  const lines = content.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

  let scenarioCount = 0;
  let stepCount = 0;
  for (const line of lines) {
    if (line.startsWith("Scenario:")) scenarioCount++;
    if (/^(Given|When|Then|And|But)\s/.test(line)) stepCount++;
  }

  if (scenarioCount === 0) throw new Error("No scenarios parsed");
  if (stepCount === 0) throw new Error("No steps parsed");
  return `${scenarioCount} scenarios, ${stepCount} steps parsed`;
});

// 8 — Deploy a test business rule
await test("8. Deploy test business rule", async () => {
  const record = await sn.insert("sys_script", {
    name: "sn-quality-smoke-test-rule",
    collection: "incident",
    active: "false",
    when: "before",
    order: "9999",
    script: '// sn-quality smoke test — safe to delete\ngs.log("smoke test");',
  });
  deployedSysId = record.sys_id;
  return `Created sys_script ${deployedSysId}`;
});

// 9 — Cleanup deployed artifact
await test("9. Cleanup test business rule", async () => {
  if (!deployedSysId) throw new Error("No artifact to clean up (deploy may have failed)");
  await sn.deleteRecord("sys_script", deployedSysId);
  const verify = await sn.query("sys_script", `sys_id=${deployedSysId}`, ["sys_id"], 1);
  if (verify.length > 0) throw new Error("Record still exists after delete");
  return `Deleted sys_script ${deployedSysId}`;
});

// 10 — Summary coverage query
await test("10. Summary coverage query", async () => {
  const [br, uip, acls, notif] = await Promise.all([
    sn.query("sys_script", "collection=incident^active=true", ["sys_id"], 50),
    sn.query("sys_ui_policy", "collection=incident", ["sys_id"], 50),
    sn.query("sys_security_acl", "name=incident.*", ["sys_id"], 50),
    sn.query("sysevent_email_action", "collection=incident", ["sys_id"], 50),
  ]);
  const total = br.length + uip.length + acls.length + notif.length;
  const contractCount = readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".feature")).length;
  const coverage = total > 0 ? Math.round((contractCount / total) * 100) : 0;
  return `${contractCount} contracts / ${total} artifacts = ${coverage}% coverage`;
});

// ── Cleanup temp contracts dir ───────────────────────────────────────────────
if (existsSync(CONTRACTS_DIR)) rmSync(CONTRACTS_DIR, { recursive: true });

// ── Report ───────────────────────────────────────────────────────────────────
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
const totalMs = results.reduce((s, r) => s + r.ms, 0);

console.log(`\n  ──────────────────────────────────────`);
console.log(`  ${passed}/${results.length} passed, ${failed} failed (${totalMs}ms total)`);

if (failed > 0) {
  console.log(`\n  Failures:`);
  for (const r of results.filter((r) => !r.ok)) {
    console.log(`    ${r.name}: ${r.detail}`);
  }
  process.exit(1);
}

console.log(`\n  All systems go.\n`);
