import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient, SnRecord } from "../sn-client.js";

const TABLE_MAP: Record<string, string> = {
  business_rule: "sys_script",
  ui_policy: "sys_ui_policy",
  acl: "sys_security_acl",
  notification: "sysevent_email_action",
  client_script: "sys_script_client",
};

export function registerDeployTool(server: McpServer, snClient: SnClient) {
  server.tool(
    "sn_quality_deploy",
    "Deploy ServiceNow application artifacts to the instance via REST API. Creates or updates business rules, UI policies, ACLs, notifications, and client scripts.",
    {
      artifacts: z.array(
        z.object({
          type: z.enum([
            "business_rule",
            "ui_policy",
            "acl",
            "notification",
            "client_script",
          ]),
          name: z.string(),
          table: z.string().describe("Target table (e.g. 'incident')"),
          config: z.record(z.string(), z.string()).describe("Field values for the artifact record"),
        })
      ).describe("Array of artifacts to deploy"),
      scope: z.string().optional().describe("Application scope"),
    },
    async ({ artifacts, scope: _scope }) => {
      const results: { name: string; type: string; action: string; sys_id: string }[] = [];

      for (const artifact of artifacts) {
        const targetTable = TABLE_MAP[artifact.type];
        if (!targetTable) {
          results.push({
            name: artifact.name,
            type: artifact.type,
            action: "error",
            sys_id: `Unknown artifact type: ${artifact.type}`,
          });
          continue;
        }

        const existing = await snClient.query({
          table: targetTable,
          query: `name=${artifact.name}^collection=${artifact.table}`,
          fields: ["sys_id"],
          limit: 1,
        });

        let record: SnRecord;

        if (existing.length > 0) {
          record = await snClient.update(
            targetTable,
            existing[0].sys_id,
            artifact.config
          );
          results.push({
            name: artifact.name,
            type: artifact.type,
            action: "updated",
            sys_id: record.sys_id,
          });
        } else {
          const fields = {
            name: artifact.name,
            collection: artifact.table,
            ...artifact.config,
          };
          record = await snClient.insert(targetTable, fields);
          results.push({
            name: artifact.name,
            type: artifact.type,
            action: "created",
            sys_id: record.sys_id,
          });
        }
      }

      const created = results.filter((r) => r.action === "created").length;
      const updated = results.filter((r) => r.action === "updated").length;
      const errors = results.filter((r) => r.action === "error").length;

      return {
        content: [
          {
            type: "text" as const,
            text: `Deployment complete: ${created} created, ${updated} updated, ${errors} errors\n\n${JSON.stringify(results, null, 2)}`,
          },
        ],
      };
    }
  );
}
