import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

interface TestResult {
  contract: string;
  scenario: string;
  status: "passed" | "failed" | "skipped";
  error?: string;
  duration: number;
}

interface ExecutionResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  pass_rate: string;
  results: TestResult[];
  raw_output: string;
}

export function registerExecuteTool(server: McpServer, _snClient: SnClient) {
  server.tool(
    "sn_quality_execute",
    "Execute Playwright tests for all quality contracts against the live ServiceNow instance. Runs 'npx playwright test' and returns structured results with pass/fail per scenario.",
    {
      filter: z.string().optional().describe("Filter to run specific test files (glob pattern, e.g. 'tests/incident-routing*')"),
      headed: z.boolean().optional().describe("Run in headed mode (visible browser). Default: false (headless)"),
    },
    async ({ filter, headed }) => {
      const testDir = filter || "tests/";
      const headedFlag = headed ? "--headed" : "";

      let rawOutput = "";
      let exitCode = 0;

      try {
        rawOutput = execSync(
          `npx playwright test ${testDir} ${headedFlag} --reporter=json`,
          {
            encoding: "utf-8",
            timeout: 300000,
            env: {
              ...process.env,
              PLAYWRIGHT_JSON_OUTPUT_FILE: "test-results/results.json",
            },
          }
        );
      } catch (err: unknown) {
        const execErr = err as { status?: number; stdout?: string; message?: string };
        exitCode = execErr.status ?? 1;
        rawOutput = execErr.stdout ?? execErr.message ?? "Unknown error";
      }

      const resultsFile = "test-results/results.json";
      const results: TestResult[] = [];
      let total = 0;
      let passed = 0;
      let failed = 0;
      const skipped = 0;

      if (existsSync(resultsFile)) {
        const jsonData = JSON.parse(readFileSync(resultsFile, "utf-8"));

        for (const suite of jsonData.suites || []) {
          const contractName = suite.title || "unknown";
          for (const spec of suite.specs || []) {
            const status = spec.ok ? "passed" : "failed";
            if (status === "passed") passed++;
            else failed++;
            total++;

            const testResult: TestResult = {
              contract: contractName,
              scenario: spec.title,
              status,
              duration: spec.tests?.[0]?.results?.[0]?.duration ?? 0,
            };

            if (!spec.ok) {
              testResult.error =
                spec.tests?.[0]?.results?.[0]?.error?.message ?? "Unknown error";
            }

            results.push(testResult);
          }
        }
      }

      const executionResult: ExecutionResult = {
        total,
        passed,
        failed,
        skipped,
        pass_rate: total > 0 ? `${Math.round((passed / total) * 100)}%` : "N/A",
        results,
        raw_output: rawOutput.substring(0, 5000),
      };

      const statusLabel = failed === 0 ? "PASSED" : "BLOCKED";

      return {
        content: [
          {
            type: "text" as const,
            text: `Quality Gate: ${statusLabel}\n\nResults: ${passed}/${total} passed (${executionResult.pass_rate})\n\n${JSON.stringify(executionResult, null, 2)}`,
          },
        ],
      };
    }
  );
}
