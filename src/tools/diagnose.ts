import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";

export function registerDiagnoseTool(server: McpServer, snClient: SnClient) {
  server.tool(
    "sn_quality_diagnose",
    "Diagnose a quality contract failure by querying instance metadata. Returns business rules (with execution order, conditions, and scripts), UI policies, and ACLs relevant to the table and fields involved. Claude Code uses this data to explain the root cause to the developer.",
    {
      table: z.string().describe("ServiceNow table the failing test operated on (e.g. 'incident')"),
      fields: z.array(z.string()).optional().describe("Fields involved in the failure (e.g. ['assignment_group', 'priority'])"),
      error_message: z.string().describe("The Playwright error message from the failed test"),
      scenario_name: z.string().describe("Name of the failed scenario"),
    },
    async ({ table, fields, error_message, scenario_name }) => {
      const businessRules = await snClient.query({
        table: "sys_script",
        query: `collection=${table}^active=true^ORDERBYorder`,
        fields: [
          "sys_id", "name", "order", "when", "filter_condition",
          "script", "active", "action_insert", "action_update", "action_delete",
        ],
        limit: 30,
      });

      const uiPolicies = await snClient.query({
        table: "sys_ui_policy",
        query: `table=${table}^active=true`,
        fields: [
          "sys_id", "short_description", "conditions", "script_true",
          "script_false", "on_load", "reverse_if_false",
        ],
        limit: 20,
      });

      let uiPolicyActions: Record<string, string>[] = [];
      if (fields && fields.length > 0) {
        for (const field of fields) {
          const actions = await snClient.query({
            table: "sys_ui_policy_action",
            query: `field=${field}`,
            fields: [
              "sys_id", "field", "visible", "mandatory", "disabled",
              "ui_policy",
            ],
            limit: 10,
          });
          uiPolicyActions.push(...actions);
        }
      }

      const acls = await snClient.query({
        table: "sys_security_acl",
        query: `name=${table}.*^ORname=${table}`,
        fields: [
          "sys_id", "name", "operation", "type", "condition",
          "script", "active",
        ],
        limit: 30,
      });

      const diagnostic = {
        scenario: scenario_name,
        error: error_message,
        table,
        fields_investigated: fields || [],
        business_rules: businessRules.map((r) => ({
          name: r.name,
          order: r.order,
          when: r.when,
          condition: r.filter_condition,
          triggers: {
            insert: r.action_insert === "true",
            update: r.action_update === "true",
            delete: r.action_delete === "true",
          },
          script_preview: r.script?.substring(0, 500) || "(no script)",
        })),
        ui_policies: uiPolicies.map((r) => ({
          name: r.short_description,
          conditions: r.conditions,
          on_load: r.on_load,
          reverse_if_false: r.reverse_if_false,
        })),
        ui_policy_actions: uiPolicyActions.map((r) => ({
          field: r.field,
          visible: r.visible,
          mandatory: r.mandatory,
          disabled: r.disabled,
        })),
        acls: acls.map((r) => ({
          name: r.name,
          operation: r.operation,
          type: r.type,
          condition: r.condition,
          has_script: (r.script?.length ?? 0) > 0,
        })),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: `Diagnostic data for failed scenario "${scenario_name}":\n\n${JSON.stringify(diagnostic, null, 2)}`,
          },
        ],
      };
    }
  );
}
