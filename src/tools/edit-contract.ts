import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function registerEditContractTool(server: McpServer, _snClient: SnClient) {
  server.tool(
    "sn_quality_edit_contract",
    "Update a Gherkin contract. Provide the contract name and the new full Gherkin content. Claude Code should read the current contract, apply the developer's plain-English edit, and pass the updated Gherkin here. The tool returns the old and new content for diff review.",
    {
      name: z.string().describe("Contract file name without .feature extension"),
      new_gherkin: z.string().describe("Updated full Gherkin content"),
      directory: z.string().optional().describe("Directory containing contracts (default: 'contracts')"),
    },
    async ({ name, new_gherkin, directory }) => {
      const dir = directory || "contracts";
      const filePath = join(dir, `${name}.feature`);

      if (!existsSync(filePath)) {
        return {
          content: [{ type: "text" as const, text: `Contract '${name}' not found in ${dir}/` }],
        };
      }

      const oldContent = readFileSync(filePath, "utf-8");
      writeFileSync(filePath, new_gherkin, "utf-8");

      const oldLines = oldContent.split("\n");
      const newLines = new_gherkin.split("\n");

      let diff = `Contract diff: ${name}\n\n`;
      const maxLen = Math.max(oldLines.length, newLines.length);
      for (let i = 0; i < maxLen; i++) {
        const oldLine = oldLines[i] ?? "";
        const newLine = newLines[i] ?? "";
        if (oldLine !== newLine) {
          if (oldLine) diff += `- ${oldLine}\n`;
          if (newLine) diff += `+ ${newLine}\n`;
        } else {
          diff += `  ${oldLine}\n`;
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `${diff}\n\nContract '${name}' updated. Use sn_quality_review_contracts to see the full updated version.`,
          },
        ],
      };
    }
  );
}
