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
import { llmChat } from "../_shared/llmChat.ts";
import {
  analystFailureSummary,
  analystProviderFailureSummary,
  buildAnalystPrompt,
  buildExplanationPrompt,
  classifyIntent,
  coordinatorFailureSummary,
  createDishaTrace,
  deterministicExplanation,
  missingFilterFields,
  noFiltersExplanation,
  parseAnalystOutput,
  providerUnavailableExplanation,
  sanitizeExplanation,
  toDishaRows,
} from "../_shared/dishaWorkflow.ts";
import type {
  DishaIntent,
  DishaRow,
  DishaStepEvent,
  DishaTrace,
  MissingFilterKey,
} from "../_shared/dishaWorkflow.ts";
import { EXPLANATION_MAX_ROWS } from "../_shared/dishaWorkflow.ts";

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
  /** Opt-in Disha workflow flag. Absent/legacy clients are unaffected. */
  disha?: unknown;
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

  // Strict contract: exactly { message, sessionId?, filters?, disha? }. Extra
  // keys are rejected so the tool surface cannot be smuggled around its
  // validator. "disha" is additive: it only opts INTO the model path and can
  // never widen what the tool itself may do.
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return errorResponse(
      'Body must be a JSON object with "message" (string) and optional "sessionId" (string), optional "filters" (object) and optional "disha" (boolean).',
      400,
      headers,
      requestId,
    );
  }

  const keys = Object.keys(parsed as Record<string, unknown>);
  const hasUnknownKey = keys.some(
    (k) => k !== "message" && k !== "sessionId" && k !== "filters" && k !== "disha",
  );
  if (hasUnknownKey) {
    return errorResponse(
      'Unknown body fields. Only "message", optional "sessionId", optional "filters" and optional "disha" are accepted.',
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

  // "disha" opts INTO the bounded model workflow. Absent or null means "off",
  // so a client that never sends it takes the exact legacy path below. It is
  // validated as a boolean so a smuggled object/array can never reach the
  // model branch.
  if (
    body.disha !== undefined &&
    body.disha !== null &&
    typeof body.disha !== "boolean"
  ) {
    return errorResponse('"disha" must be a boolean when present.', 400, headers, requestId);
  }
  const dishaRequested = body.disha === true;

  // ---------------------------------------------------------------------------
  // Phase 2: the deterministic search_market tool step. "message" is never
  // interpreted by the legacy path — only explicit tool arguments run. The
  // Disha path below is strictly opt-in via "disha": true and can only ever
  // call the same one read-only tool.
  // ---------------------------------------------------------------------------
  const phaseHeaders = { ...headers, "X-Freddy-Phase": "2" };

  // Disha full workflow: opt-in AND no caller-supplied filters. With caller
  // filters the legacy path runs unchanged and only a "disha" block is added
  // to the response (see the exits further down).
  if (dishaRequested && (body.filters === undefined || body.filters === null)) {
    return await runDishaWorkflow({
      message,
      token,
      env,
      fetchImpl: deps.fetchImpl,
      requestId,
      headers: phaseHeaders,
    });
  }

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
  // Trace is built ONLY when the caller opted in, so a legacy client's
  // response stays byte-identical to Phase 2.
  const dishaTrace: DishaTrace | null = dishaRequested ? createDishaTrace() : null;
  const checkedAt = dishaRequested ? new Date().toISOString() : "";
  if (dishaTrace) {
    dishaTrace.skip(
      "shipment_analyst",
      "Skipped: filters were supplied by the caller.",
    );
    dishaTrace.begin("matching_specialist");
  }

  const outcome: SearchMarketOutcome = await searchMarket(
    { baseUrl: supabaseUrl, anonKey: supabaseAnonKey, userJwt: token },
    validated.filters,
    { fetchImpl: deps.fetchImpl },
  );

  if (!outcome.ok) {
    // The reason is already sanitized by the tool (HTTP status at most; no
    // bodies, secrets, tokens, or SQLSTATE). Upstream/tool failures are
    // reported as 502 — a server-side fault, not a client-input fault.
    if (!dishaTrace) {
      return errorResponse(outcome.reason, 502, phaseHeaders, requestId);
    }
    dishaTrace.end(
      "matching_specialist",
      "failed",
      `Marketplace search failed: ${outcome.reason}`,
    );
    dishaTrace.skip("disha_coordinator", "Skipped: no rows to explain.");
    return new Response(
      JSON.stringify({
        error: outcome.reason,
        requestId,
        disha: buildDishaBlock({
          status: "failed",
          intent: classifyIntent(validated.filters),
          missing: missingFilterFields(validated.filters),
          rows: [],
          explanation:
            "The marketplace search did not complete, so there are no rows to explain. Nothing has been booked.",
          explanationSource: "deterministic",
          provider: "none",
          checkedAt,
          trace: dishaTrace.events,
        }),
      }),
      { status: 502, headers: phaseHeaders },
    );
  }

  if (!dishaTrace) {
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

  // Opt-in path: same legacy body as above, plus a Disha block that honestly
  // reports which steps were skipped (no model ran, so no explanation exists).
  dishaTrace.end(
    "matching_specialist",
    "completed",
    `Returned ${outcome.count} row(s) of up to ${outcome.limit} checked.`,
  );
  dishaTrace.skip(
    "disha_coordinator",
    "Skipped: caller-supplied filters skip the model explanation.",
  );
  return new Response(
    JSON.stringify({
      ok: true,
      phase: 2,
      tool: "search_market",
      count: outcome.count,
      limit: outcome.limit,
      loads: outcome.loads,
      requestId,
      disha: buildDishaBlock({
        status: "skipped",
        intent: classifyIntent(validated.filters),
        missing: missingFilterFields(validated.filters),
        rows: toDishaRows(outcome.loads),
        explanation:
          "Filters were supplied with the request, so Disha produced no explanation: the returned rows are the raw marketplace result. Nothing has been booked.",
        explanationSource: "deterministic",
        provider: "none",
        checkedAt,
        trace: dishaTrace.events,
      }),
    }),
    { status: 200, headers: phaseHeaders },
  );
}

// ---------------------------------------------------------------------------
// Disha (opt-in) — the bounded, read-only three-step workflow.
//
// Pipeline order is preserved: kill switch -> method -> rate limit -> bearer ->
// auth config -> verifyClerkJwt -> content type -> body size -> JSON ->
// strict contract -> [disha config check -> shipment_analyst ->
// matching_specialist -> disha_coordinator].
//
// Guarantees encoded here:
// - Exactly ONE tool runs, and it is the existing read-only searchMarket()
//   called with the caller's verified JWT (RLS stays authoritative). No SQL,
//   no arbitrary table/URL/tool, no service-role key, no writes.
// - At most TWO model calls per request (analyst + coordinator), both bounded
//   by llmChat. Provider absence/failure never throws and never invents rows:
//   it degrades to a deterministic answer over the REAL rows returned.
// - The response keeps the legacy trio (ok/phase/tool ... requestId) and adds
//   an additive "disha" block. The trace is returned once, after completion.
// - The raw user message is never logged.
// ---------------------------------------------------------------------------

type DishaStatus = "completed" | "failed" | "unavailable" | "skipped";

interface DishaBlockInput {
  status: DishaStatus;
  intent: DishaIntent;
  missing: MissingFilterKey[];
  rows: DishaRow[];
  explanation: string;
  explanationSource: "model" | "deterministic";
  provider: string;
  checkedAt: string;
  trace: DishaStepEvent[];
}

function buildDishaBlock(input: DishaBlockInput): Record<string, unknown> {
  return {
    status: input.status,
    intent: input.intent,
    missing: input.missing,
    rows: input.rows,
    explanation: input.explanation,
    explanationSource: input.explanationSource,
    provider: input.provider,
    checkedAt: input.checkedAt,
    trace: input.trace,
  };
}

/**
 * Legacy no-tool body (byte-for-byte the Phase 2 response) plus the additive
 * Disha block, for the cases where no search ran at all.
 */
function dishaNoToolResponse(input: {
  status: DishaStatus;
  intent: DishaIntent;
  missing: MissingFilterKey[];
  explanation: string;
  provider: string;
  checkedAt: string;
  trace: DishaStepEvent[];
  requestId: string;
  headers: Record<string, string>;
}): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      phase: 2,
      tool: null,
      detail:
        "No tool arguments were supplied. Provide 'filters' to run search_market.",
      requestId: input.requestId,
      disha: buildDishaBlock({
        status: input.status,
        intent: input.intent,
        missing: input.missing,
        rows: [],
        explanation: input.explanation,
        explanationSource: "deterministic",
        provider: input.provider,
        checkedAt: input.checkedAt,
        trace: input.trace,
      }),
    }),
    { status: 200, headers: input.headers },
  );
}

async function runDishaWorkflow(input: {
  message: string;
  token: string;
  env: (name: string) => string | undefined;
  fetchImpl?: typeof fetch;
  requestId: string;
  headers: Record<string, string>;
}): Promise<Response> {
  const { message, token, env, fetchImpl, requestId, headers } = input;
  const trace = createDishaTrace();
  const checkedAt = new Date().toISOString();
  const llmOptions = { env, fetchImpl };

  // Marketplace configuration is mandatory and fail-closed, checked BEFORE
  // any model call — same rule as the legacy path. The service-role key is
  // intentionally never read anywhere in this file.
  const supabaseUrl = env("SUPABASE_URL") ?? "";
  const supabaseAnonKey = env("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      `[${requestId}] agent-router: required marketplace configuration missing (SUPABASE_URL / SUPABASE_ANON_KEY)`,
    );
    return errorResponse("Server configuration error.", 500, headers, requestId);
  }

  // --- Step 1: shipment analyst -----------------------------------------
  trace.begin("shipment_analyst");
  const analyst = await llmChat(buildAnalystPrompt(message), llmOptions);
  if (!analyst.ok) {
    // No key, every key rate limited, or every provider errored. Honest
    // degradation: nothing was searched and no row is invented.
    trace.end(
      "shipment_analyst",
      "failed",
      analystProviderFailureSummary(analyst.reason),
    );
    trace.skip("matching_specialist", "Skipped: no filters were extracted.");
    trace.skip("disha_coordinator", "Skipped: nothing was searched.");
    return dishaNoToolResponse({
      status: analyst.reason === "not_configured" ? "unavailable" : "failed",
      intent: "unconstrained",
      missing: missingFilterFields({}),
      explanation: providerUnavailableExplanation(analyst.reason),
      provider: "none",
      checkedAt,
      trace: trace.events,
      requestId,
      headers,
    });
  }

  const parsed = parseAnalystOutput(analyst.text);
  if (!parsed.ok) {
    trace.end(
      "shipment_analyst",
      "failed",
      analystFailureSummary(parsed.reason),
    );
    trace.skip("matching_specialist", "Skipped: no filters were extracted.");
    trace.skip("disha_coordinator", "Skipped: nothing was searched.");
    const missing = missingFilterFields({});
    return dishaNoToolResponse({
      status: "failed",
      intent: "unconstrained",
      missing,
      explanation: noFiltersExplanation(missing),
      provider: "none",
      checkedAt,
      trace: trace.events,
      requestId,
      headers,
    });
  }

  const filters = parsed.filters;
  const missing = missingFilterFields(filters);
  const filterKeys = Object.keys(filters);

  // At least one filter is required: a broad, unbounded search never runs.
  if (filterKeys.length === 0) {
    trace.end(
      "shipment_analyst",
      "failed",
      `No usable filter field found via ${analyst.provider}.`,
    );
    trace.skip("matching_specialist", "Skipped: no filters were extracted.");
    trace.skip("disha_coordinator", "Skipped: nothing was searched.");
    return dishaNoToolResponse({
      status: "failed",
      intent: classifyIntent(filters),
      missing,
      explanation: noFiltersExplanation(missing),
      provider: "none",
      checkedAt,
      trace: trace.events,
      requestId,
      headers,
    });
  }

  // The summary carries field NAMES and the provider — never the user's text.
  trace.end(
    "shipment_analyst",
    "completed",
    `Extracted ${filterKeys.length} filter field(s): ${filterKeys.join(", ")} via ${analyst.provider}.`,
  );

  // --- Step 2: matching specialist (the ONE tool) -----------------------
  trace.begin("matching_specialist");
  const outcome: SearchMarketOutcome = await searchMarket(
    { baseUrl: supabaseUrl, anonKey: supabaseAnonKey, userJwt: token },
    filters,
    { fetchImpl },
  );

  if (!outcome.ok) {
    trace.end(
      "matching_specialist",
      "failed",
      `Marketplace search failed: ${outcome.reason}`,
    );
    trace.skip("disha_coordinator", "Skipped: no rows to explain.");
    return new Response(
      JSON.stringify({
        error: outcome.reason,
        requestId,
        disha: buildDishaBlock({
          status: "failed",
          intent: classifyIntent(filters),
          missing,
          rows: [],
          explanation:
            "The marketplace search did not complete, so there are no rows to explain. Nothing has been booked.",
          explanationSource: "deterministic",
          provider: "none",
          checkedAt,
          trace: trace.events,
        }),
      }),
      { status: 502, headers },
    );
  }

  trace.end(
    "matching_specialist",
    "completed",
    `Returned ${outcome.count} row(s) of up to ${outcome.limit} checked.`,
  );

  // --- Step 3: Disha coordinator ----------------------------------------
  trace.begin("disha_coordinator");
  const rows = toDishaRows(outcome.loads);
  const fallback = deterministicExplanation({
    filters,
    missing,
    rows,
    limit: outcome.limit,
  });
  let explanation = fallback;
  let explanationSource: "model" | "deterministic" = "deterministic";
  let provider = "none";

  const coordinator = await llmChat(
    buildExplanationPrompt({ filters, missing, rows }),
    llmOptions,
  );
  if (coordinator.ok) {
    const sanitized = sanitizeExplanation(coordinator.text);
    if (sanitized.ok) {
      explanation = sanitized.text;
      explanationSource = "model";
      provider = coordinator.provider;
      trace.end(
        "disha_coordinator",
        "completed",
        `Explained ${Math.min(rows.length, EXPLANATION_MAX_ROWS)} row(s) via ${coordinator.provider}.`,
      );
    } else {
      trace.end(
        "disha_coordinator",
        "completed",
        `Model answer rejected (${sanitized.reason}); used the deterministic summary.`,
      );
    }
  } else {
    trace.end(
      "disha_coordinator",
      "completed",
      coordinatorFailureSummary(coordinator.reason),
    );
  }

  // Legacy trio preserved; the Disha block is additive.
  return new Response(
    JSON.stringify({
      ok: true,
      phase: 2,
      tool: "search_market",
      count: outcome.count,
      limit: outcome.limit,
      loads: outcome.loads,
      requestId,
      disha: buildDishaBlock({
        status: "completed",
        intent: classifyIntent(filters),
        missing,
        rows,
        explanation,
        explanationSource,
        provider,
        checkedAt,
        trace: trace.events,
      }),
    }),
    { status: 200, headers },
  );
}
