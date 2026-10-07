/**
 * Types for the Vercel Edge Function in api/agent.js.
 *
 * api/ runs as plain ES modules with no build step, so TypeScript has no
 * declaration for it and any import from a .ts file is an implicit `any` under
 * strict mode. This file declares the handler contract that callers and tests
 * rely on. Keep it in sync with `export default` in api/agent.js.
 *
 * This must stay a sibling of agent.js (not a `declare module` block) so that
 * TypeScript resolves the relative specifier through normal file resolution.
 */
export default function handler(req: Request): Promise<Response>;