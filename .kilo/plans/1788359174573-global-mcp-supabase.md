# Global Supabase MCP Configuration Plan

## Goal
Make the Supabase MCP server available globally to Kilo/Claude Code across all projects, instead of per-project `.mcp.json`.

## Approach
Use Kilo/Claude Code global MCP config so every project inherits the Supabase MCP server automatically.

## Steps

1. **Identify global MCP config location**
   - Likely candidates:
     - `C:\Users\sanja\.config\kilo\kilo.jsonc` — Kilo global config already exists here
     - `C:\Users\sanja\.claude\.mcp.json` — Claude Code global MCP config
   - Check whether Kilo reads MCP servers from its global config or from a separate `.mcp.json` in the user config dir.

2. **Add Supabase MCP to global config**
   - Add a top-level `mcpServers` / `mcp` section pointing to:
     `https://mcp.supabase.com/mcp?project_ref=aejvxilhydyfbwkhjpdt&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage`
   - Do NOT create a project-local `.mcp.json` in the repo.

3. **Authenticate once globally**
   - Run the Kilo/Claude Code MCP auth command from any project:
     - Preferred: `kilo mcp auth supabase`
     - Fallback: `claude mcp auth supabase`
   - Complete OAuth in the browser.
   - Verify auth token is stored in the user-level config, not project-level.

4. **Verify globally**
   - Open Kilo in a different project (or this one after removing any local `.mcp.json`).
   - Confirm Supabase MCP tools are available without per-project setup.

## Decision Needed
Which config file should own the global MCP server entry?
- Option A: `C:\Users\sanja\.config\kilo\kilo.jsonc` (Kilo global config)
- Option B: `C:\Users\sanja\.claude\.mcp.json` (Claude Code global MCP config)
- Option C: Both, if Kilo supports merging

Recommendation: start with Option A if Kilo exposes an `mcp` key there; otherwise use Option B, which is the standard Claude Code global MCP location.

## Validation
- `kilo` or `claude` shows Supabase MCP tools in any project
- No `.mcp.json` required in project root
- Auth persists across sessions
