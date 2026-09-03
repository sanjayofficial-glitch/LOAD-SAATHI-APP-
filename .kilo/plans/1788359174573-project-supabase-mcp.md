# Project Supabase MCP Setup

## Commands to run in this project

1. **Add Supabase MCP server (project scope, HTTP transport)**
   ```bash
   claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=aejvxilhydyfbwkhjpdt&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching"
   ```

2. **Install Supabase agent skills**
   ```bash
   claude /mcp npx skills add supabase/agent-skills
   ```

## Notes
- `--scope project` writes the MCP server to the project config, not global.
- After adding, restart or reload the Kilo/Claude Code session for tools to appear.
- Authenticate with `claude mcp auth supabase` if prompted.
- The skills command is optional but improves Supabase-specific guidance.

## Validation
- Supabase MCP tools appear in the session
- Skills load without errors
- No manual `.mcp.json` edits required
