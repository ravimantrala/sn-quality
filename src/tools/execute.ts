import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SnClient } from "../sn-client.js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

interface GherkinStep {
  keyword: string;
  text: string;
}

interface GherkinScenario {
  name: string;
  tags: string[];
  steps: GherkinStep[];
}

interface GherkinFeature {
  name: string;
  file: string;
  scenarios: GherkinScenario[];
}

interface PlaywrightInstruction {
  action: string;
  description: string;
  params: Record<string, string>;
}

interface ScenarioExecution {
  feature: string;
  scenario: string;
  tags: string[];
  instructions: PlaywrightInstruction[];
}

function parseGherkin(content: string, fileName: string): GherkinFeature {
  const lines = content.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const feature: GherkinFeature = { name: "", file: fileName, scenarios: [] };
  let currentScenario: GherkinScenario | null = null;
  let currentTags: string[] = [];

  for (const line of lines) {
    if (line.startsWith("@")) {
      currentTags = line.split(/\s+/).filter((t) => t.startsWith("@"));
    } else if (line.startsWith("Feature:")) {
      feature.name = line.replace("Feature:", "").trim();
    } else if (line.startsWith("Scenario:")) {
      currentScenario = {
        name: line.replace("Scenario:", "").trim(),
        tags: [...currentTags],
        steps: [],
      };
      currentTags = [];
      feature.scenarios.push(currentScenario);
    } else if (/^(Given|When|Then|And|But)\s/.test(line)) {
      const match = line.match(/^(Given|When|Then|And|But)\s+(.*)/);
      if (match && currentScenario) {
        currentScenario.steps.push({ keyword: match[1], text: match[2] });
      }
    }
  }

  return feature;
}

function stepToInstruction(step: GherkinStep): PlaywrightInstruction {
  const text = step.text;

  // Login
  const loginMatch = text.match(/I am logged in as "([^"]+)"/);
  if (loginMatch) {
    return {
      action: "browser_navigate",
      description: `Login to ServiceNow as ${loginMatch[1]}`,
      params: { role: loginMatch[1], step: "login" },
    };
  }

  // Create new record
  const createMatch = text.match(/I create a new (\w+)/);
  if (createMatch) {
    return {
      action: "browser_navigate",
      description: `Navigate to new ${createMatch[1]} form`,
      params: { table: createMatch[1].toLowerCase(), step: "navigate_new" },
    };
  }

  // Set field
  const setMatch = text.match(/I set "([^"]+)" to "([^"]+)"/);
  if (setMatch) {
    return {
      action: "browser_type",
      description: `Set field "${setMatch[1]}" to "${setMatch[2]}"`,
      params: { field: setMatch[1], value: setMatch[2], step: "set_field" },
    };
  }

  // Submit
  if (text.match(/I submit the form/)) {
    return {
      action: "browser_click",
      description: "Submit the form",
      params: { step: "submit" },
    };
  }

  // Assert field displays value
  const displayMatch = text.match(/the field "([^"]+)" should display "([^"]+)"/);
  if (displayMatch) {
    return {
      action: "browser_snapshot",
      description: `Assert field "${displayMatch[1]}" displays "${displayMatch[2]}"`,
      params: { field: displayMatch[1], expected: displayMatch[2], step: "assert_field_value" },
    };
  }

  // Assert field visible
  const visibleMatch = text.match(/the field "([^"]+)" should be visible/);
  if (visibleMatch) {
    return {
      action: "browser_snapshot",
      description: `Assert field "${visibleMatch[1]}" is visible`,
      params: { field: visibleMatch[1], step: "assert_field_visible" },
    };
  }

  // Assert field not editable
  const readonlyMatch = text.match(/the field "([^"]+)" should not be editable/);
  if (readonlyMatch) {
    return {
      action: "browser_snapshot",
      description: `Assert field "${readonlyMatch[1]}" is read-only`,
      params: { field: readonlyMatch[1], step: "assert_field_readonly" },
    };
  }

  // Navigate to list
  const listMatch = text.match(/I navigate to the (\w+) list/);
  if (listMatch) {
    return {
      action: "browser_navigate",
      description: `Navigate to ${listMatch[1]} list view`,
      params: { table: listMatch[1].toLowerCase(), step: "navigate_list" },
    };
  }

  // Assert rows match
  const rowsMatch = text.match(/I should only see .* where "([^"]+)" is "([^"]+)"/);
  if (rowsMatch) {
    return {
      action: "browser_snapshot",
      description: `Assert all list rows have "${rowsMatch[1]}" = "${rowsMatch[2]}"`,
      params: { field: rowsMatch[1], expected: rowsMatch[2], step: "assert_list_filter" },
    };
  }

  // Open existing record
  const openMatch = text.match(/I open an existing (\w+)/);
  if (openMatch) {
    return {
      action: "browser_navigate",
      description: `Open an existing ${openMatch[1]} record`,
      params: { table: openMatch[1].toLowerCase(), step: "navigate_existing" },
    };
  }

  // Fallback
  return {
    action: "manual",
    description: `Manual step: ${step.keyword} ${text}`,
    params: { raw: `${step.keyword} ${text}`, step: "manual" },
  };
}

export function registerExecuteTool(server: McpServer, _snClient: SnClient) {
  server.tool(
    "sn_quality_execute",
    "Parse Gherkin quality contracts and return structured Playwright MCP instructions for each scenario. Claude Code should then execute these instructions using Playwright MCP tools (browser_navigate, browser_click, browser_type, browser_snapshot) against the live ServiceNow instance, collecting pass/fail results as it goes.",
    {
      directory: z.string().optional().describe("Directory containing .feature files (default: 'contracts')"),
      contract: z.string().optional().describe("Specific contract name to execute (without .feature extension)"),
    },
    async ({ directory, contract }) => {
      const dir = directory || "contracts";

      if (!existsSync(dir)) {
        return {
          content: [{ type: "text" as const, text: `No contracts directory found at '${dir}'. Run sn_quality_generate_contracts first.` }],
        };
      }

      let files = readdirSync(dir).filter((f) => f.endsWith(".feature"));
      if (contract) {
        files = files.filter((f) => f === `${contract}.feature`);
        if (files.length === 0) {
          return {
            content: [{ type: "text" as const, text: `Contract '${contract}' not found in ${dir}/` }],
          };
        }
      }

      const executions: ScenarioExecution[] = [];

      for (const file of files) {
        const content = readFileSync(join(dir, file), "utf-8");
        const feature = parseGherkin(content, file);

        for (const scenario of feature.scenarios) {
          const instructions = scenario.steps.map(stepToInstruction);
          executions.push({
            feature: feature.name,
            scenario: scenario.name,
            tags: scenario.tags,
            instructions,
          });
        }
      }

      const instance = process.env.SN_INSTANCE || "https://your-instance.service-now.com";

      let output = `## Contract Execution Plan\n\n`;
      output += `**Instance:** ${instance}\n`;
      output += `**Contracts:** ${files.length} files, ${executions.length} scenarios\n\n`;
      output += `Execute each scenario below using Playwright MCP tools against the live instance.\n`;
      output += `After each scenario, record PASS or FAIL.\n\n`;

      for (const exec of executions) {
        output += `### ${exec.feature} > ${exec.scenario}\n`;
        output += `Tags: ${exec.tags.join(", ") || "none"}\n\n`;

        for (let i = 0; i < exec.instructions.length; i++) {
          const inst = exec.instructions[i];
          output += `${i + 1}. **${inst.action}** — ${inst.description}\n`;
          if (Object.keys(inst.params).length > 1) {
            output += `   Params: ${JSON.stringify(inst.params)}\n`;
          }
        }
        output += `\n`;
      }

      output += `---\n\nAfter executing all scenarios, call sn_quality_summary to generate the quality report.\n`;

      return {
        content: [
          {
            type: "text" as const,
            text: output,
          },
        ],
      };
    }
  );
}
