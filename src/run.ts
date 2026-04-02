/**
 * CLI runner for sn-quality skills.
 * Usage: npx tsx src/run.ts <command> <json-args>
 *
 * Examples:
 *   npx tsx src/run.ts query '{"table":"incident","query":"active=true","fields":["number"],"limit":5}'
 *   npx tsx src/run.ts check-exists '{"type":"table","name":"incident"}'
 *   npx tsx src/run.ts discover '{"table":"incident"}'
 *   npx tsx src/run.ts deploy '{"artifacts":[...]}'
 *   npx tsx src/run.ts cleanup '{"records":[{"table":"sys_script","sys_id":"abc"}]}'
 *   npx tsx src/run.ts diagnose '{"table":"incident","error_message":"...","scenario_name":"..."}'
 *   npx tsx src/run.ts summary '{"table":"incident"}'
 *   npx tsx src/run.ts report '{"action":"append","contract":"...","scenario":"...","passed":true}'
 *   npx tsx src/run.ts record '{"action":"track","table":"incident","sys_id":"abc","purpose":"test_data"}'
 *   npx tsx src/run.ts rollback '{}'
 */

import "dotenv/config";
import { createSnClient } from "./sn-client.js";
import {
  appendResult,
  appendSnapshotEntry,
  clearRecords,
  clearResults,
  clearSnapshot,
  getAllTrackedRecords,
  getSummaryStats,
  loadSnapshot,
  trackRecord,
} from "./results-writer.js";

// Lazy SN client — only created when a command needs it
let _sn: ReturnType<typeof createSnClient> | null = null;
function sn() {
  if (!_sn) _sn = createSnClient();
  return _sn;
}

const [command, argsJson] = process.argv.slice(2);

if (!command) {
  console.error("Usage: npx tsx src/run.ts <command> <json-args>");
  process.exit(1);
}

const args = argsJson ? JSON.parse(argsJson) : {};

async function run() {
  switch (command) {
    case "query": {
      const result = await sn().query({
        table: args.table,
        query: args.query,
        fields: args.fields,
        limit: args.limit ?? 20,
      });
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "check-exists": {
      const typeMap: Record<string, { table: string; queryFn: (name: string, table?: string) => string; fields: string[] }> = {
        assignment_group: { table: "sys_user_group", queryFn: (n) => `name=${n}`, fields: ["sys_id", "name"] },
        table: { table: "sys_db_object", queryFn: (n) => `name=${n}`, fields: ["sys_id", "name", "label"] },
        field: { table: "sys_dictionary", queryFn: (n, t) => `name=${t}^element=${n}`, fields: ["sys_id", "element", "column_label"] },
        sla_definition: { table: "contract_sla", queryFn: (n) => `nameLIKE${n}`, fields: ["sys_id", "name", "duration"] },
        ui_policy: { table: "sys_ui_policy", queryFn: (n) => `short_descriptionLIKE${n}`, fields: ["sys_id", "short_description", "table", "active"] },
        business_rule: { table: "sys_script", queryFn: (n) => `nameLIKE${n}`, fields: ["sys_id", "name", "collection", "active", "order"] },
        notification: { table: "sysevent_email_action", queryFn: (n) => `nameLIKE${n}`, fields: ["sys_id", "name", "collection", "active"] },
      };
      const cfg = typeMap[args.type];
      if (!cfg) { console.log(JSON.stringify({ exists: false, error: `Unknown type: ${args.type}` })); break; }
      const result = await sn().query({ table: cfg.table, query: cfg.queryFn(args.name, args.table), fields: cfg.fields, limit: 1 });
      console.log(JSON.stringify({ exists: result.length > 0, type: args.type, name: args.name, result: result[0] || null }, null, 2));
      break;
    }

    case "discover": {
      const filter = args.scope ? `sys_scope.scope=${args.scope}` : args.table ? `collection=${args.table}` : "";
      if (!filter) { console.error("Provide scope or table"); process.exit(1); }
      const [br, uip, acls, notif, slas] = await Promise.all([
        sn().query({ table: "sys_script", query: `${filter}^active=true`, fields: ["sys_id", "name", "collection", "order", "when"], limit: 50 }),
        sn().query({ table: "sys_ui_policy", query: filter, fields: ["sys_id", "short_description", "table", "active"], limit: 50 }),
        sn().query({ table: "sys_security_acl", query: args.scope ? `sys_scope.scope=${args.scope}` : `name=${args.table}.*`, fields: ["sys_id", "name", "operation", "type"], limit: 50 }),
        sn().query({ table: "sysevent_email_action", query: filter, fields: ["sys_id", "name", "collection", "active"], limit: 50 }),
        sn().query({ table: "contract_sla", query: args.table ? `collection=${args.table}` : "", fields: ["sys_id", "name", "duration", "collection"], limit: 50 }),
      ]);
      console.log(JSON.stringify({
        scope: args.scope || `table:${args.table}`,
        business_rules: br, ui_policies: uip, acls, notifications: notif, sla_definitions: slas,
        summary: { business_rules: br.length, ui_policies: uip.length, acls: acls.length, notifications: notif.length, sla_definitions: slas.length, total: br.length + uip.length + acls.length + notif.length + slas.length },
      }, null, 2));
      break;
    }

    case "deploy": {
      // Table-agnostic deploy: works with any ServiceNow table
      // Each record specifies: target_table, lookup (query to find existing), fields
      const results = [];
      for (const rec of args.records) {
        const targetTable = rec.target_table;
        const lookup = rec.lookup; // encoded query to find existing record
        const fields = rec.fields;
        const label = rec.label || `${targetTable} record`;

        if (!targetTable || !fields) {
          results.push({ label, action: "error", detail: "target_table and fields are required" });
          continue;
        }

        try {
          if (lookup) {
            // Check if record exists
            const existing = await sn().query({ table: targetTable, query: lookup, fields: ["sys_id"], limit: 1 });
            if (existing.length > 0) {
              // Snapshot + update
              const original = await sn().getRecord(targetTable, existing[0].sys_id);
              const updated = await sn().update(targetTable, existing[0].sys_id, fields);
              appendSnapshotEntry({
                table: targetTable,
                sys_id: updated.sys_id,
                name: label,
                type: targetTable,
                action: "updated",
                original_values: original,
                deployed_at: new Date().toISOString(),
              });
              results.push({ label, table: targetTable, action: "updated", sys_id: updated.sys_id });
            } else {
              // Insert
              const created = await sn().insert(targetTable, fields);
              appendSnapshotEntry({
                table: targetTable,
                sys_id: created.sys_id,
                name: label,
                type: targetTable,
                action: "created",
                deployed_at: new Date().toISOString(),
              });
              results.push({ label, table: targetTable, action: "created", sys_id: created.sys_id });
            }
          } else {
            // No lookup — always insert
            const created = await sn().insert(targetTable, fields);
            appendSnapshotEntry({
              table: targetTable,
              sys_id: created.sys_id,
              name: label,
              type: targetTable,
              action: "created",
              deployed_at: new Date().toISOString(),
            });
            results.push({ label, table: targetTable, action: "created", sys_id: created.sys_id });
          }
        } catch (e: unknown) {
          results.push({ label, table: targetTable, action: "error", detail: e instanceof Error ? e.message : String(e) });
        }
      }
      console.log(JSON.stringify(results, null, 2));
      break;
    }

    case "cleanup": {
      // Child records to cascade-delete before the parent
      const CHILD_TABLES: Record<string, Array<{ table: string; fk: string }>> = {
        incident: [
          { table: "task_sla", fk: "task" },
          { table: "sys_email", fk: "instance" },
          { table: "sys_journal_field", fk: "element_id" },
        ],
      };

      // Use explicit records if provided, otherwise read from records.json
      let records = args.records;
      if (!records || records.length === 0) {
        records = getAllTrackedRecords(args.purpose).map((r) => ({
          table: r.table,
          sys_id: r.sys_id,
        }));
      }
      if (records.length === 0) {
        console.log(JSON.stringify({ message: "No records to clean up", deleted: 0 }));
        break;
      }
      const results = [];
      for (const rec of records) {
        try {
          // Cascade: delete child records first
          const children = CHILD_TABLES[rec.table] || [];
          let childrenDeleted = 0;
          for (const child of children) {
            const childRecs = await sn().query({
              table: child.table,
              query: `${child.fk}=${rec.sys_id}`,
              fields: ["sys_id"],
              limit: 50,
            });
            for (const cr of childRecs) {
              await sn().deleteRecord(child.table, cr.sys_id);
              childrenDeleted++;
            }
          }
          // Then delete the parent
          await sn().deleteRecord(rec.table, rec.sys_id);
          results.push({ ...rec, status: "deleted", children_deleted: childrenDeleted });
        } catch (e: unknown) {
          results.push({ ...rec, status: `error: ${e instanceof Error ? e.message : e}` });
        }
      }
      // Clear the registry after cleanup
      if (!args.records) {
        clearRecords();
      }
      console.log(JSON.stringify(results, null, 2));
      break;
    }

    case "diagnose": {
      const [br, uip, acls] = await Promise.all([
        sn().query({ table: "sys_script", query: `collection=${args.table}^active=true^ORDERBYorder`, fields: ["sys_id", "name", "order", "when", "filter_condition", "script", "action_insert", "action_update"], limit: 30 }),
        sn().query({ table: "sys_ui_policy", query: `table=${args.table}^active=true`, fields: ["sys_id", "short_description", "conditions", "on_load", "reverse_if_false"], limit: 20 }),
        sn().query({ table: "sys_security_acl", query: `name=${args.table}.*^ORname=${args.table}`, fields: ["sys_id", "name", "operation", "type", "condition", "active"], limit: 30 }),
      ]);
      console.log(JSON.stringify({
        scenario: args.scenario_name, error: args.error_message, table: args.table,
        fields_investigated: args.fields || [],
        business_rules: br.map(r => ({ name: r.name, order: r.order, when: r.when, condition: r.filter_condition, script_preview: r.script?.substring(0, 300) })),
        ui_policies: uip.map(r => ({ name: r.short_description, conditions: r.conditions, on_load: r.on_load })),
        acls: acls.map(r => ({ name: r.name, operation: r.operation, type: r.type })),
      }, null, 2));
      break;
    }

    case "summary": {
      const filter = args.scope ? `sys_scope.scope=${args.scope}` : args.table ? `collection=${args.table}` : "";
      const [br, uip, acls, notif] = await Promise.all([
        sn().query({ table: "sys_script", query: filter ? `${filter}^active=true` : "active=true", fields: ["sys_id"], limit: 100 }),
        sn().query({ table: "sys_ui_policy", query: filter, fields: ["sys_id"], limit: 100 }),
        sn().query({ table: "sys_security_acl", query: args.scope ? `sys_scope.scope=${args.scope}` : args.table ? `name=${args.table}.*` : "", fields: ["sys_id"], limit: 100 }),
        sn().query({ table: "sysevent_email_action", query: filter, fields: ["sys_id"], limit: 100 }),
      ]);
      const totalArtifacts = br.length + uip.length + acls.length + notif.length;

      // Count contracts
      const { readdirSync, existsSync } = await import("node:fs");
      const contractsDir = args.contracts_dir || "contracts";
      let contractCount = 0;
      if (existsSync(contractsDir)) {
        contractCount = readdirSync(contractsDir).filter(f => f.endsWith(".feature")).length;
      }

      const coverage = totalArtifacts > 0 ? Math.round((contractCount / totalArtifacts) * 100) : 0;

      // Include test results if available
      const testResults = getSummaryStats();

      console.log(JSON.stringify({
        contracts: contractCount,
        instance_artifacts: totalArtifacts,
        coverage: `${coverage}%`,
        breakdown: { business_rules: br.length, ui_policies: uip.length, acls: acls.length, notifications: notif.length },
        test_results: testResults,
      }, null, 2));
      break;
    }

    // -----------------------------------------------------------------
    // Results tracking (no SN credentials required)
    // -----------------------------------------------------------------

    case "report": {
      switch (args.action) {
        case "append":
          appendResult({
            contract: args.contract,
            scenario: args.scenario,
            passed: args.passed,
            tags: args.tags,
            error: args.error,
            duration_ms: args.duration_ms,
          });
          console.log(JSON.stringify({ status: "recorded", contract: args.contract, scenario: args.scenario, passed: args.passed }));
          break;
        case "clear":
          clearResults();
          console.log(JSON.stringify({ status: "cleared" }));
          break;
        case "stats":
          console.log(JSON.stringify(getSummaryStats(), null, 2));
          break;
        default:
          console.error(`Unknown report action: ${args.action}. Use append, clear, or stats.`);
          process.exit(1);
      }
      break;
    }

    case "record": {
      switch (args.action) {
        case "track":
          trackRecord({
            table: args.table,
            sys_id: args.sys_id,
            number: args.number,
            purpose: args.purpose,
            contract: args.contract,
            scenario: args.scenario,
          });
          console.log(JSON.stringify({ status: "tracked", table: args.table, sys_id: args.sys_id }));
          break;
        case "list":
          console.log(JSON.stringify(getAllTrackedRecords(args.purpose), null, 2));
          break;
        case "clear":
          clearRecords();
          console.log(JSON.stringify({ status: "cleared" }));
          break;
        default:
          console.error(`Unknown record action: ${args.action}. Use track, list, or clear.`);
          process.exit(1);
      }
      break;
    }

    // -----------------------------------------------------------------
    // Rollback — reverse the last deploy
    // -----------------------------------------------------------------

    case "rollback": {
      const snapshot = loadSnapshot();
      if (snapshot.entries.length === 0) {
        console.log(JSON.stringify({ message: "No deploy snapshot found. Nothing to roll back.", rolled_back: 0 }));
        break;
      }

      if (args.dry_run) {
        console.log(JSON.stringify({
          message: "Dry run — no changes made",
          entries: snapshot.entries.map((e) => ({
            name: e.name,
            type: e.type,
            action: e.action === "created" ? "would delete" : "would restore",
            sys_id: e.sys_id,
          })),
        }, null, 2));
        break;
      }

      const rollbackResults = [];
      // Process in reverse order (LIFO)
      for (const entry of [...snapshot.entries].reverse()) {
        try {
          if (entry.action === "created") {
            await sn().deleteRecord(entry.table, entry.sys_id);
            rollbackResults.push({ name: entry.name, type: entry.type, action: "deleted", sys_id: entry.sys_id });
          } else if (entry.action === "updated" && entry.original_values) {
            // Strip sys_ metadata fields that SN won't accept on update
            const restoreFields: Record<string, string> = {};
            for (const [key, val] of Object.entries(entry.original_values)) {
              if (!key.startsWith("sys_")) {
                restoreFields[key] = val;
              }
            }
            await sn().update(entry.table, entry.sys_id, restoreFields);
            rollbackResults.push({ name: entry.name, type: entry.type, action: "restored", sys_id: entry.sys_id });
          }
        } catch (e: unknown) {
          rollbackResults.push({
            name: entry.name,
            type: entry.type,
            action: "error",
            detail: e instanceof Error ? e.message : String(e),
          });
        }
      }

      clearSnapshot();
      console.log(JSON.stringify(rollbackResults, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
