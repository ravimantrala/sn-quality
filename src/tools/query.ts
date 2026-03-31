import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";

export function registerQueryTool(server: McpServer, snClient: SnClient) {
  server.tool(
    "sn_quality_query",
    "Query ServiceNow Table API. Returns records matching the query from the specified table.",
    {
      table: z.string().describe("ServiceNow table name (e.g. 'incident', 'sys_script')"),
      query: z.string().optional().describe("Encoded query string (e.g. 'active=true^priority=1')"),
      fields: z.array(z.string()).optional().describe("Fields to return (e.g. ['number', 'short_description'])"),
      limit: z.number().optional().describe("Max records to return (default 20)"),
    },
    async ({ table, query, fields, limit }) => {
      const records = await snClient.query({
        table,
        query,
        fields,
        limit: limit ?? 20,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(records, null, 2),
          },
        ],
      };
    }
  );
}
