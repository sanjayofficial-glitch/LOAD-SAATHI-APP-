// Freddy Freight Copilot — Phase 2 entrypoint.
// The full request pipeline (kill switch, Clerk-JWT auth, rate limit, strict
// validation, deterministic read-only search_market tool step) lives in
// handler.ts, exported as handleAgentRouter with injectable dependencies so
// tests can exercise it network-free. This entrypoint keeps the Phase 1
// contract: Deno.serve registers exactly that handler, unconditionally.
import { handleAgentRouter } from "./handler.ts";

Deno.serve((req: Request): Promise<Response> => handleAgentRouter(req));
