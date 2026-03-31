import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";

export function registerCleanupTool(server: McpServer, snClient: SnClient) {
  server.tool(
    "sn_quality_cleanup",
    "Delete records created during test execution. Provide a list of table + sys_id pairs to remove. This is the rollback mechanism — removes test data from the instance.",
    {
      records: z.array(
        z.object({
          table: z.string(),
          sys_id: z.string(),
        })
      ).describe("Records to delete"),
    },
    async ({ records }) => {
      const results: { table: string; sys_id: string; status: string }[] = [];

      for (const record of records) {
        try {
          await snClient.deleteRecord(record.table, record.sys_id);
          results.push({ ...record, status: "deleted" });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          results.push({ ...record, status: `error: ${message}` });
        }
      }

      const deleted = results.filter((r) => r.status === "deleted").length;
      const errors = results.filter((r) => r.status.startsWith("error")).length;

      return {
        content: [
          {
            type: "text" as const,
            text: `Cleanup complete: ${deleted}/${records.length} records deleted, ${errors} errors\n\n${JSON.stringify(results, null, 2)}`,
          },
        ],
      };
    }
  );
}
