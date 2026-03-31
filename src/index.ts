import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSnClient } from "./sn-client.js";
import { registerQueryTool } from "./tools/query.js";
import { registerCheckExistsTool } from "./tools/check-exists.js";
import { registerDiscoverTool } from "./tools/discover.js";
import { registerGenerateContractsTool } from "./tools/generate-contracts.js";
import { registerReviewContractsTool } from "./tools/review-contracts.js";
import { registerEditContractTool } from "./tools/edit-contract.js";
import { registerDeployTool } from "./tools/deploy.js";
import { registerExecuteTool } from "./tools/execute.js";
import { registerDiagnoseTool } from "./tools/diagnose.js";
import { registerCleanupTool } from "./tools/cleanup.js";
import { registerSummaryTool } from "./tools/summary.js";

const server = new McpServer({
  name: "sn-quality",
  version: "0.1.0",
});

const snClient = createSnClient();

// Discovery & Contract Generation
registerQueryTool(server, snClient);
registerCheckExistsTool(server, snClient);
registerDiscoverTool(server, snClient);
registerGenerateContractsTool(server, snClient);
registerReviewContractsTool(server, snClient);
registerEditContractTool(server, snClient);

// App Deployment
registerDeployTool(server, snClient);

// Execution & Diagnostics
registerExecuteTool(server, snClient);
registerDiagnoseTool(server, snClient);
registerCleanupTool(server, snClient);
registerSummaryTool(server, snClient);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("sn-quality MCP server running on stdio");
