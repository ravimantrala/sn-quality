import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";
import { readdirSync, readFileSync, existsSync } from "node:fs";

export function registerSummaryTool(server: McpServer, snClient: SnClient) {
  server.tool(
    "sn_quality_summary",
    "Generate a quality summary report: contract count, pass rate, and coverage (contracted artifacts vs. total artifacts on the instance for the given table/scope).",
    {
      table: z.string().optional().describe("Table to compute coverage for"),
      scope: z.string().optional().describe("Application scope to compute coverage for"),
      contracts_dir: z.string().optional().describe("Path to contracts directory (default: 'contracts')"),
      results_file: z.string().optional().describe("Path to Playwright JSON results (default: 'test-results/results.json')"),
    },
    async ({ table, scope, contracts_dir, results_file }) => {
      const contractsDir = contracts_dir || "contracts";
      const resultsPath = results_file || "test-results/results.json";

      let contractCount = 0;
      if (existsSync(contractsDir)) {
        contractCount = readdirSync(contractsDir).filter((f) =>
          f.endsWith(".feature")
        ).length;
      }

      let passed = 0;
      let failed = 0;
      let total = 0;

      if (existsSync(resultsPath)) {
        const data = JSON.parse(readFileSync(resultsPath, "utf-8"));
        for (const suite of data.suites || []) {
          for (const spec of suite.specs || []) {
            total++;
            if (spec.ok) passed++;
            else failed++;
          }
        }
      }

      let totalArtifacts = 0;
      const filter = scope
        ? `sys_scope.scope=${scope}`
        : table
          ? `collection=${table}`
          : "";

      if (filter) {
        const [br, uip, acls, notif] = await Promise.all([
          snClient.query({ table: "sys_script", query: `${filter}^active=true`, fields: ["sys_id"], limit: 100 }),
          snClient.query({ table: "sys_ui_policy", query: filter, fields: ["sys_id"], limit: 100 }),
          snClient.query({ table: "sys_security_acl", query: scope ? `sys_scope.scope=${scope}` : `name=${table}.*`, fields: ["sys_id"], limit: 100 }),
          snClient.query({ table: "sysevent_email_action", query: filter, fields: ["sys_id"], limit: 100 }),
        ]);
        totalArtifacts = br.length + uip.length + acls.length + notif.length;
      }

      const coveragePct = totalArtifacts > 0
        ? Math.round((contractCount / totalArtifacts) * 100)
        : 0;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

      const report = {
        contracts: contractCount,
        test_results: { total, passed, failed, pass_rate: `${passRate}%` },
        coverage: {
          contracted_artifacts: contractCount,
          total_instance_artifacts: totalArtifacts,
          coverage_percentage: `${coveragePct}%`,
        },
        quality_gate: failed === 0 ? "PASSED" : "BLOCKED",
      };

      return {
        content: [
          {
            type: "text" as const,
            text: `## ServiceNow Quality Report\n\n**Quality gate:** ${report.quality_gate}\n**Pass rate:** ${passed}/${total} (${passRate}%)\n**Coverage:** ${contractCount}/${totalArtifacts} artifacts (${coveragePct}%)\n\n${JSON.stringify(report, null, 2)}`,
          },
        ],
      };
    }
  );
}
