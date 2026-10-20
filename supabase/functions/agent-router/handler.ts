// Freddy Freight Copilot — Phase 2: ONE deterministic, read-only tool
// (search_market) wired into the Phase 1 pipeline. There is NO model/LLM or
// tool-calling layer yet, and none is simulated here: with no model to infer
// intent from "message", the endpoint executes search_market only when the
// request explicitly supplies tool arguments ("filters") and otherwise returns
// a stable no-tool response saying exactly that.
//
// Phase ordering is unchanged from Phase 1 (carried verbatim from the
// endpoint's Phase 1 form): CORS → OPTIONS → kill switch → method → rate
// limit → bearer token → auth configuration → verifyClerkJwt → content-type →
// body size → JSON parse → strict contract → tool step.
//
// Request contract (Phase 2): { message: string, sessionId?: string,
// filters?: object }. "filters" is the ONLY tool-capability surface and can
// express exactly the four fields search_market supports (origin,
// destination, min_capacity_tonnes, max_price_per_tonne). Unknown body keys
// and status/order/limit/select/SQL fragments are rejected — status list,
// ordering, limit and columns are fixed constants inside the tool module, not
// request-controllable.
//
// Tool boundary (deliberately narrow):
// - The single capability is search_market via _shared/searchMarket.ts. That
//   module remains the source of truth for filter validation, the fixed
//   query, allowed fields, result parsing, timeout, and sanitized errors; the
//   router does not duplicate any of it. It calls searchMarket's own exported
//   validator once to classify client vs upstream errors (400 vs 502), then
//   hands the validated filters to searchMarket, which re-validates its input
//   internally — one implementation, defense in depth.
// - Database access uses ONLY the caller's verified JWT + SUPABASE_URL +
//   SUPABASE_ANON_KEY. The service-role key must never be read or referenced
//   here.
// - Responses are grounded: "count" is the number of returned rows and
//   "limit" is the tool's fixed 50 cap. No total-match claim, no implied
//   "more results", no invented fields, no booking/mutation tools.
//
// Injectables (for network-free Deno tests only; production defaults are the
// real ones): env lookup, fetch implementation, rate-limit implementation.

import {
  checkRateLimit,
  errorResponse,
  extractBearerToken,
  generateRequestId,
  getCorsHeaders,
  getRequestIp,
  optionsResponse,
} from "../_shared/edgeHelpers.ts";
import {
  searchMarket,
  validateSearchMarketParams,
} from "../_shared/searchMarket.ts";
import type { SearchMarketOutcome } from "../_shared/searchMarket.ts";
import { verifyClerkJwt } from "../_shared/verifyClerkJwt.ts";

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_RETRY_AFTER_SECONDS = 60;
const RATE_LIMIT_KEY_PREFIX = "agent-router:";

const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface AgentRouterBody {
  message: string;
  sessionId?: string;
  filters?: unknown;
}

export interface AgentRouterDeps {
  /** Injectable env lookup (tests). Defaults to Deno.env.get. */
  env?: (name: string) => string | undefined;
  /** Injectable fetch used by the search_market tool (tests). Defaults to globalThis.fetch. */
  fetchImpl?: typeof fetch;
  /** Injectable rate-limit implementation (tests). Defaults to the shared in-memory limiter. */
  checkRateLimitImpl?: (
    key: string,
    maxRequests: number,
    windowMs: number,
  ) => boolean;
}

// Kill switch: fail closed. Only the exact string "true" (any case) enables
// the copilot. An unset or misconfigured secret keeps the endpoint inert.
// FREDDY_ENABLED is never defaulted to on anywhere in this code.
function isKillSwitchEnabled(
  env: (name: string) => string | undefined,
): boolean {
  return (env("FREDDY_ENABLED") ?? "").trim().toLowerCase() === "true";
}

export async function handleAgentRouter(
  req: Request,
  deps: AgentRouterDeps = {},
): Promise<Response> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const checkRateLimitImpl = deps.checkRateLimitImpl ?? checkRateLimit;

  const requestId = generateRequestId();
  const headers = { ...getCorsHeaders(req), "X-Request-Id": requestId };

  if (req.method === "OPTIONS") {
    return optionsResponse(headers);
  }

  // Kill switch first: when disabled, return a safe response before any auth
  // check, rate limit, database call or model call happens.
  if (!isKillSwitchEnabled(env)) {
    return new Response(
      JSON.stringify({ ok: true, enabled: false, phase: 1, requestId }),
      { status: 200, headers },
    );
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed. Use POST with a JSON body.", 405, {
      ...headers,
      Allow: "POST, OPTIONS",
    }, requestId);
  }

  // Strict rate limit before auth, so unauthenticated floods are also shielded.
  // Known limitation shared with existing functions: in-memory, per-instance.
  const ip = getRequestIp(req);
  if (
    !checkRateLimitImpl(
      `${RATE_LIMIT_KEY_PREFIX}${ip}`,
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    )
  ) {
    return errorResponse(
      "Rate limit exceeded. Retry shortly.",
      429,
      { ...headers, "Retry-After": String(RATE_LIMIT_RETRY_AFTER_SECONDS) },
      requestId,
    );
  }

  const token = extractBearerToken(req);
  if (!token) {
    return errorResponse("Missing bearer token.", 401, headers, requestId);
  }

  // Auth configuration is mandatory and fail-closed: without every required
  // value the endpoint must never accept a token. The error response is
  // sanitized — only the variable NAME is logged server-side, never any
  // token, secret, or Authorization header value.
  const jwtSecret = env("SUPABASE_JWT_SECRET") ?? "";
  const expectedIssuer = env("FREDDY_EXPECTED_ISSUER") ?? "";
  const expectedAudience = env("FREDDY_EXPECTED_AUDIENCE") ?? "";
  if (!jwtSecret || !expectedIssuer || !expectedAudience) {
    console.error(
      `[${requestId}] agent-router: required auth configuration missing (SUPABASE_JWT_SECRET / FREDDY_EXPECTED_ISSUER / FREDDY_EXPECTED_AUDIENCE)`,
    );
    return errorResponse("Server configuration error.", 500, headers, requestId);
  }

  const user = await verifyClerkJwt(token, {
    jwtSecret,
    expectedIssuer,
    expectedAudience,
  });
  if (!user) {
    return errorResponse("Invalid or expired token.", 401, headers, requestId);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return errorResponse(
      "Unsupported Media Type: Content-Type must be application/json.",
      415,
      headers,
      requestId,
    );
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  const text = await req.text();
  if (declaredLength > MAX_BODY_BYTES || text.length > MAX_BODY_BYTES) {
    return errorResponse(
      `Request body too large (max ${MAX_BODY_BYTES} bytes).`,
      413,
      headers,
      requestId,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return errorResponse("Malformed JSON body.", 400, headers, requestId);
  }

  // Strict contract: exactly { message, sessionId?, filters? }. Extra keys are
  // rejected so the tool surface cannot be smuggled around its validator.
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return errorResponse(
      'Body must be a JSON object with "message" (string) and optional "sessionId" (string) and optional "filters" (object).',
      400,
      headers,
      requestId,
    );
  }

  const keys = Object.keys(parsed as Record<string, unknown>);
  const hasUnknownKey = keys.some(
    (k) => k !== "message" && k !== "sessionId" && k !== "filters",
  );
  if (hasUnknownKey) {
    return errorResponse(
      'Unknown body fields. Only "message", optional "sessionId" and optional "filters" are accepted.',
      400,
      headers,
      requestId,
    );
  }

  const body = parsed as AgentRouterBody;
  const message = body.message;
  if (
    typeof message !== "string" ||
    message.trim().length === 0 ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return errorResponse(
      `"message" must be a non-empty string of at most ${MAX_MESSAGE_LENGTH} characters.`,
      400,
      headers,
      requestId,
    );
  }

  const sessionId = body.sessionId;
  if (sessionId !== undefined && sessionId !== null) {
    if (typeof sessionId !== "string" || !SESSION_ID_PATTERN.test(sessionId)) {
      return errorResponse(
        '"sessionId" must be a UUID string when present.',
        400,
        headers,
        requestId,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 2: the deterministic search_market tool step. No model layer exists;
  // "message" is never interpreted — only explicit tool arguments run.
  // ---------------------------------------------------------------------------
  const phaseHeaders = { ...headers, "X-Freddy-Phase": "2" };

  // With no tool arguments there is nothing this endpoint can execute
  // deterministically: it does NOT guess intent from "message" and does NOT
  // run a marketplace query speculatively. Status 200 keeps the response
  // machine-stable; "tool": null states plainly that nothing ran.
  if (body.filters === undefined || body.filters === null) {
    return new Response(
      JSON.stringify({
        ok: true,
        phase: 2,
        tool: null,
        detail:
          "No tool arguments were supplied. Provide 'filters' to run search_market.",
        requestId,
      }),
      { status: 200, headers: phaseHeaders },
    );
  }

  // Marketplace configuration is mandatory and fail-closed. SUPABASE_URL is
  // auto-injected by the edge runtime; SUPABASE_ANON_KEY must be set as a
  // project secret. Only the variable NAMES are logged, never values.
  // The service-role key is intentionally never read anywhere in this file.
  const supabaseUrl = env("SUPABASE_URL") ?? "";
  const supabaseAnonKey = env("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      `[${requestId}] agent-router: required marketplace configuration missing (SUPABASE_URL / SUPABASE_ANON_KEY)`,
    );
    return errorResponse("Server configuration error.", 500, headers, requestId);
  }

  // Error classification uses the SAME validator the tool owns — no second
  // implementation exists. searchMarket re-validates the filters internally;
  // passing the validated filters also gives defense in depth.
  const validated = validateSearchMarketParams(body.filters);
  if (!validated.ok) {
    return errorResponse(validated.reason, 400, phaseHeaders, requestId);
  }

  // The caller's VERIFIED JWT is the database identity (Authorization bearer)
  // — RLS stays authoritative. NEVER pass the service-role key here.
  const outcome: SearchMarketOutcome = await searchMarket(
    { baseUrl: supabaseUrl, anonKey: supabaseAnonKey, userJwt: token },
    validated.filters,
    { fetchImpl: deps.fetchImpl },
  );
  if (!outcome.ok) {
    // The reason is already sanitized by the tool (HTTP status at most; no
    // bodies, secrets, tokens, or SQLSTATE). Upstream/tool failures are
    // reported as 502 — a server-side fault, not a client-input fault.
    return errorResponse(outcome.reason, 502, phaseHeaders, requestId);
  }

  // Stable success shape grounded in tool output only: "count" is the number
  // of returned rows (never a marketplace total) and "limit" is the fixed
  // 50-row cap, so no response can imply more results than were fetched.
  return new Response(
    JSON.stringify({
      ok: true,
      phase: 2,
      tool: "search_market",
      count: outcome.count,
      limit: outcome.limit,
      loads: outcome.loads,
      requestId,
    }),
    { status: 200, headers: phaseHeaders },
  );
}
