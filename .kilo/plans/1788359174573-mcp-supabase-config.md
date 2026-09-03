# MCP Configuration Plan

## Goal
Configure OpenCode MCP client with Supabase remote MCP server and complete OAuth authentication.

## Steps

1. **Verify OpenCode config directory exists**
   - Check if `~/.config/opencode/` exists
   - If not, create it

2. **Add MCP configuration to opencode.json**
   - Path: `~/.config/opencode/opencode.json`
   - Add `mcp.supabase` remote configuration with:
     - URL: `https://mcp.supabase.com/mcp?project_ref=aejvxilhydyfbwkhjpdt&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage`
     - enabled: true

3. **Run authentication command**
   - Execute: `opencode mcp auth supabase`
   - This will open browser for OAuth flow
   - User must complete authentication in browser

4. **Verify connection**
   - Check that Supabase MCP tools are available
   - Test a simple Supabase operation if possible

## Notes
- This modifies a global config file (`~/.config/opencode/opencode.json`)
- Requires browser access for OAuth completion
- Agent skills installation (`npx skills add supabase/agent-skills`) is optional and can be done separately

## Validation
- Config file contains valid JSON with correct mcp.supabase section
- Authentication completes without errors
- Supabase MCP server responds to requests
