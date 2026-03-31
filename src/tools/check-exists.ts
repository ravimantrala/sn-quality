import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";

export function registerCheckExistsTool(server: McpServer, snClient: SnClient) {
  server.tool(
    "sn_quality_check_exists",
    "Validate that a ServiceNow artifact exists on the instance. Checks tables, fields, assignment groups, SLAs, etc.",
    {
      type: z.enum([
        "assignment_group",
        "table",
        "field",
        "sla_definition",
        "ui_policy",
        "business_rule",
        "notification",
      ]).describe("Type of artifact to check"),
      name: z.string().describe("Name or identifier of the artifact"),
      table: z.string().optional().describe("Table context (required for field checks)"),
    },
    async ({ type, name, table }) => {
      let exists = false;
      let detail = "";

      switch (type) {
        case "assignment_group": {
          const results = await snClient.query({
            table: "sys_user_group",
            query: `name=${name}`,
            fields: ["sys_id", "name"],
            limit: 1,
          });
          exists = results.length > 0;
          detail = exists ? `Group "${name}" found (sys_id: ${results[0].sys_id})` : `Group "${name}" not found`;
          break;
        }
        case "table": {
          const results = await snClient.query({
            table: "sys_db_object",
            query: `name=${name}`,
            fields: ["sys_id", "name", "label"],
            limit: 1,
          });
          exists = results.length > 0;
          detail = exists ? `Table "${name}" found (label: ${results[0].label})` : `Table "${name}" not found`;
          break;
        }
        case "field": {
          if (!table) {
            return {
              content: [{ type: "text" as const, text: "Error: 'table' parameter required for field checks" }],
            };
          }
          const results = await snClient.query({
            table: "sys_dictionary",
            query: `name=${table}^element=${name}`,
            fields: ["sys_id", "element", "column_label"],
            limit: 1,
          });
          exists = results.length > 0;
          detail = exists
            ? `Field "${name}" found on table "${table}" (label: ${results[0].column_label})`
            : `Field "${name}" not found on table "${table}"`;
          break;
        }
        case "sla_definition": {
          const results = await snClient.query({
            table: "contract_sla",
            query: `nameLIKE${name}`,
            fields: ["sys_id", "name", "duration"],
            limit: 1,
          });
          exists = results.length > 0;
          detail = exists ? `SLA "${results[0].name}" found (duration: ${results[0].duration})` : `SLA "${name}" not found`;
          break;
        }
        case "ui_policy": {
          const results = await snClient.query({
            table: "sys_ui_policy",
            query: `short_descriptionLIKE${name}`,
            fields: ["sys_id", "short_description", "table", "active"],
            limit: 1,
          });
          exists = results.length > 0;
          detail = exists ? `UI Policy "${results[0].short_description}" found (active: ${results[0].active})` : `UI Policy "${name}" not found`;
          break;
        }
        case "business_rule": {
          const results = await snClient.query({
            table: "sys_script",
            query: `nameLIKE${name}`,
            fields: ["sys_id", "name", "collection", "active", "order"],
            limit: 1,
          });
          exists = results.length > 0;
          detail = exists
            ? `Business Rule "${results[0].name}" found (table: ${results[0].collection}, order: ${results[0].order}, active: ${results[0].active})`
            : `Business Rule "${name}" not found`;
          break;
        }
        case "notification": {
          const results = await snClient.query({
            table: "sysevent_email_action",
            query: `nameLIKE${name}`,
            fields: ["sys_id", "name", "collection", "active"],
            limit: 1,
          });
          exists = results.length > 0;
          detail = exists ? `Notification "${results[0].name}" found (active: ${results[0].active})` : `Notification "${name}" not found`;
          break;
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ exists, type, name, detail }, null, 2),
          },
        ],
      };
    }
  );
}
