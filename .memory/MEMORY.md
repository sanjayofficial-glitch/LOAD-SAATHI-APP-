# User Operating Patterns — sanja

## Preferences
- **Project path:** `D:\Users\sanja\dyad-apps\LOAD-SAATHI-APP-1-OSRM` (moved from the old `C:\Users\sanja\dyad-apps\LOAD-SAATHI-APP-1 copy`)
- **Source root:** app code lives under `supabase/src/` (components, pages, utils… all inside the `supabase/` folder)
- **Package manager:** pnpm (has pnpm-lock.yaml, use pnpm not npm)
- **Shell:** PowerShell on Windows primary; Git Bash available via package.json scripts
- **CLI tool usage:** Prefers npx for global tools (e.g., `npx supabase` rather than installing globally); OK with installed Python CLIs (graphify is installed at `C:\Users\sanja\AppData\Local\Programs\Python\Python311\Scripts\graphify.exe`)
- **Quality standard:** Expects `vite build` to pass with zero errors before considering work done

## Communication Patterns
- Provides detailed specs via pasted text files with checklists
- Prefers being asked about risky decisions before implementation
- Responds with brief instructions ("Go as best way", "check this")
- Provides credentials and keys directly in chat when needed

## Known Preferences
- Uses Clerk for auth (not Supabase Auth)
- Uses OpenStreetMap-based services (Nominatim, OSRM) — no Google Maps, Mapbox, or paid map services
- Uses shadcn/ui components extensively
- Prefers Tailwind CSS for all styling
- Does not want in-app chat — uses WhatsApp deep links instead

## Lessons Learned
- When refactoring large codebases, audit first, act second
- Always check for duplicate/near-duplicate files before creating new ones
- Don't assume a file is dead code until you've verified it's not imported anywhere
- Supabase Realtime subscriptions need the anonymous client, not the authenticated one
- Always verify build passes after env changes
- Use `start /B` or background processes for dev servers on Windows
- `graphify-out/` can get wiped to a single empty `.graphify_detect.json` — regenerate free with `graphify update .` (AST-only, no LLM tokens)
- `.opencode/plugins/graphify.js` must target the actual OpenCode plugin API (plain function + hooks object, `tool.execute.before`). The `Plugin.define()` API it used to use does not exist in `@opencode-ai/plugin` 1.18.32
