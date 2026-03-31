import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export function registerGenerateContractsTool(server: McpServer, _snClient: SnClient) {
  server.tool(
    "sn_quality_generate_contracts",
    "Generate Gherkin quality contracts from developer intent and instance metadata. Writes .feature files to the contracts/ directory. Claude Code should call sn_quality_discover first to get instance metadata, then use that metadata plus the developer's intent to construct the Gherkin content passed to this tool.",
    {
      contracts: z.array(
        z.object({
          name: z.string().describe("Contract file name without extension (e.g. 'incident-routing-network')"),
          gherkin: z.string().describe("Full Gherkin feature content"),
        })
      ).describe("Array of contracts to write"),
      directory: z.string().optional().describe("Directory to write contracts to (default: 'contracts')"),
    },
    async ({ contracts, directory }) => {
      const dir = directory || "contracts";
      mkdirSync(dir, { recursive: true });

      const written: string[] = [];

      for (const contract of contracts) {
        const filePath = join(dir, `${contract.name}.feature`);
        writeFileSync(filePath, contract.gherkin, "utf-8");
        written.push(filePath);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Generated ${written.length} contracts:\n${written.map((f) => `  ${f}`).join("\n")}\n\nRun 'sn_quality_review_contracts' to inspect in Gherkin format.`,
          },
        ],
      };
    }
  );
}
