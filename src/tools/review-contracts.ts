import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export function registerReviewContractsTool(server: McpServer, _snClient: SnClient) {
  server.tool(
    "sn_quality_review_contracts",
    "Read and return all Gherkin contracts from the contracts/ directory for developer review. Returns each contract's name and full Gherkin content.",
    {
      directory: z.string().optional().describe("Directory containing .feature files (default: 'contracts')"),
      name: z.string().optional().describe("Specific contract name to review (without .feature extension)"),
    },
    async ({ directory, name }) => {
      const dir = directory || "contracts";

      if (!existsSync(dir)) {
        return {
          content: [{ type: "text" as const, text: `No contracts directory found at '${dir}'. Run sn_quality_generate_contracts first.` }],
        };
      }

      const files = readdirSync(dir).filter((f) => f.endsWith(".feature"));

      if (name) {
        const filePath = join(dir, `${name}.feature`);
        if (!existsSync(filePath)) {
          return {
            content: [{ type: "text" as const, text: `Contract '${name}' not found in ${dir}/` }],
          };
        }
        const content = readFileSync(filePath, "utf-8");
        return {
          content: [{ type: "text" as const, text: `## Contract: ${name}\n\n\`\`\`gherkin\n${content}\n\`\`\`` }],
        };
      }

      const contracts = files.map((f) => {
        const content = readFileSync(join(dir, f), "utf-8");
        const contractName = f.replace(".feature", "");
        return `## Contract: ${contractName}\n\n\`\`\`gherkin\n${content}\n\`\`\``;
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${files.length} contracts in ${dir}/\n\n${contracts.join("\n\n---\n\n")}`,
          },
        ],
      };
    }
  );
}
