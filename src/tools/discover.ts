import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";

interface DiscoveryResult {
  scope: string;
  business_rules: { name: string; table: string; order: number; when: string; active: boolean; sys_id: string }[];
  ui_policies: { name: string; table: string; active: boolean; sys_id: string }[];
  acls: { name: string; operation: string; type: string; sys_id: string }[];
  notifications: { name: string; table: string; active: boolean; sys_id: string }[];
  sla_definitions: { name: string; duration: string; table: string; sys_id: string }[];
  tables: { name: string; label: string; sys_id: string }[];
  summary: {
    total_artifacts: number;
    business_rules: number;
    ui_policies: number;
    acls: number;
    notifications: number;
    sla_definitions: number;
    tables: number;
  };
}

export function registerDiscoverTool(server: McpServer, snClient: SnClient) {
  server.tool(
    "sn_quality_discover",
    "Scan a ServiceNow instance for all configured artifacts in a given scope or table. Returns business rules, UI policies, ACLs, notifications, SLA definitions, and tables.",
    {
      scope: z.string().optional().describe("Application scope to scan (e.g. 'x_hr_case_mgmt'). If omitted, scans by table."),
      table: z.string().optional().describe("Table to scan (e.g. 'incident'). Used when no scope is specified."),
    },
    async ({ scope, table }) => {
      if (!scope && !table) {
        return {
          content: [{ type: "text" as const, text: "Error: Provide either 'scope' or 'table'" }],
        };
      }

      const scopeFilter = scope ? `sys_scope.scope=${scope}` : "";
      const tableFilter = table ? `collection=${table}` : "";
      const filter = scopeFilter || tableFilter;

      const [businessRules, uiPolicies, acls, notifications, slaDefinitions, tables] =
        await Promise.all([
          snClient.query({
            table: "sys_script",
            query: `${filter}^active=true`,
            fields: ["sys_id", "name", "collection", "order", "when", "active"],
            limit: 50,
          }),
          snClient.query({
            table: "sys_ui_policy",
            query: filter,
            fields: ["sys_id", "short_description", "table", "active"],
            limit: 50,
          }),
          snClient.query({
            table: "sys_security_acl",
            query: scope ? `sys_scope.scope=${scope}` : `name=${table}.*`,
            fields: ["sys_id", "name", "operation", "type"],
            limit: 50,
          }),
          snClient.query({
            table: "sysevent_email_action",
            query: filter,
            fields: ["sys_id", "name", "collection", "active"],
            limit: 50,
          }),
          snClient.query({
            table: "contract_sla",
            query: table ? `collection=${table}` : "",
            fields: ["sys_id", "name", "duration", "collection"],
            limit: 50,
          }),
          scope
            ? snClient.query({
                table: "sys_db_object",
                query: `sys_scope.scope=${scope}`,
                fields: ["sys_id", "name", "label"],
                limit: 50,
              })
            : Promise.resolve(
                table
                  ? [{ sys_id: "", name: table, label: table }]
                  : []
              ),
        ]);

      const result: DiscoveryResult = {
        scope: scope || `table:${table}`,
        business_rules: businessRules.map((r) => ({
          name: r.name,
          table: r.collection,
          order: parseInt(r.order) || 0,
          when: r.when,
          active: r.active === "true",
          sys_id: r.sys_id,
        })),
        ui_policies: uiPolicies.map((r) => ({
          name: r.short_description,
          table: r.table,
          active: r.active === "true",
          sys_id: r.sys_id,
        })),
        acls: acls.map((r) => ({
          name: r.name,
          operation: r.operation,
          type: r.type,
          sys_id: r.sys_id,
        })),
        notifications: notifications.map((r) => ({
          name: r.name,
          table: r.collection,
          active: r.active === "true",
          sys_id: r.sys_id,
        })),
        sla_definitions: slaDefinitions.map((r) => ({
          name: r.name,
          duration: r.duration,
          table: r.collection,
          sys_id: r.sys_id,
        })),
        tables: tables.map((r) => ({
          name: r.name,
          label: r.label,
          sys_id: r.sys_id,
        })),
        summary: {
          total_artifacts:
            businessRules.length +
            uiPolicies.length +
            acls.length +
            notifications.length +
            slaDefinitions.length +
            tables.length,
          business_rules: businessRules.length,
          ui_policies: uiPolicies.length,
          acls: acls.length,
          notifications: notifications.length,
          sla_definitions: slaDefinitions.length,
          tables: tables.length,
        },
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
