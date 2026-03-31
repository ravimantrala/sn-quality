# sn-quality — ServiceNow Quality MCP Server

Contract-driven quality testing for ServiceNow apps, powered by Claude Code.

## Setup

1. Install dependencies:
   ```bash
   npm install
   npx playwright install chromium
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your ServiceNow instance credentials
   ```

4. Add to Claude Code MCP config (`~/.claude.json` or project `.claude/settings.json`):
   ```json
   {
     "mcpServers": {
       "sn-quality": {
         "command": "node",
         "args": ["dist/index.js"],
         "cwd": "/absolute/path/to/sn-quality",
         "env": {
           "SN_INSTANCE": "https://your-instance.service-now.com",
           "SN_USER": "admin",
           "SN_PASSWORD": "your-password"
         }
       }
     }
   }
   ```

5. Restart Claude Code. The `sn_quality_*` tools should now be available.

## MCP Tools

| Tool | Purpose |
|------|---------|
| `sn_quality_query` | General-purpose ServiceNow Table API query |
| `sn_quality_check_exists` | Validate artifacts exist on instance |
| `sn_quality_discover` | Scan instance metadata for a scope/table |
| `sn_quality_generate_contracts` | Write Gherkin .feature files from intent + metadata |
| `sn_quality_review_contracts` | Read contracts for developer review |
| `sn_quality_edit_contract` | Update a contract with new Gherkin |
| `sn_quality_deploy` | Deploy app artifacts to instance via REST |
| `sn_quality_execute` | Run Playwright tests against live instance |
| `sn_quality_diagnose` | Analyze failure using instance metadata |
| `sn_quality_cleanup` | Delete test records from instance |
| `sn_quality_summary` | Generate quality report |

## GitHub Actions Setup

Add these secrets to your GitHub repo:
- `SN_INSTANCE` — your ServiceNow instance URL
- `SN_USER` — ServiceNow username
- `SN_PASSWORD` — ServiceNow password

## Demo Flow

1. Tell Claude Code what app you want to build
2. Claude discovers your instance metadata and generates Gherkin contracts
3. Review and approve the contracts
4. Claude builds the app + Playwright tests
5. Push, open PR, quality gate runs
6. If tests fail, Claude diagnoses and fixes
