// Freddy Freight Copilot — Phase 3: working agentic system.
//
// Capabilities:
//   - search_market: read-only marketplace trip search (LLM-parsed from natural language)
//   - search_shipments: read-only open-shipment search for truckers (LLM-parsed)
//   - credit-insights: explain your Digital Freight Credit Score
//   - conversation memory: sessionId-scoped context across messages; when
//     FREDDY_MEMORY_ENABLED=true the store is server-side (freddy_sessions,
//     owner-only RLS) and authoritative over client-sent history
//
// Security properties (all preserved):
//   - Kill switch (FREDDY_ENABLED) — fail closed when off
//   - Clerk JWT verification via HS256 (verifyClerkJwt)
//   - RLS-scoped database access (caller JWT only, never service-role)
//   - Rate limiting per IP
//   - Strict request contract, no unknown fields
//   - No write/mutation tools — read-only operations only

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
import type { MarketLoad, SearchMarketFilters } from "../_shared/searchMarket.ts";
import {
  searchShipments,
  validateSearchShipmentsParams,
} from "../_shared/searchShipments.ts";
import type { MarketShipment, SearchShipmentsFilters } from "../_shared/searchShipments.ts";
import {
  parseFreddyIntent,
  isCreditScoreQuery,
  isShipmentSearchRequest,
} from "../_shared/freddyIntent.ts";
import { verifyClerkJwt } from "../_shared/verifyClerkJwt.ts";
import {
  fetchSessionHistory,
  persistSessionHistory,
} from "../_shared/freddyMemory.ts";
import {
  buildMarketProbes,
  buildShipmentProbes,
  buildSuggestions,
  probeMarketAvailability,
  probeShipmentAvailability,
  type SearchSuggestion,
} from "../_shared/freddySuggestions.ts";

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_RETRY_AFTER_SECONDS = 60;
const RATE_LIMIT_KEY_PREFIX = "agent-router:";

// Retry configuration for transient failures
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [1000, 2000];

// Max recent messages to include as conversation context for the LLM.
const MAX_CONTEXT_MESSAGES = 6;

const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentRouterBody {
  message?: string;
  sessionId?: string;
  filters?: unknown;
  history?: ChatMessage[];
  lang?: string;
}

interface CreditInsightsResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
  projection: string;
  provider: string;
}

export interface AgentRouterDeps {
  env?: (name: string) => string | undefined;
  fetchImpl?: typeof fetch;
  checkRateLimitImpl?: (
    key: string,
    maxRequests: number,
    windowMs: number,
  ) => boolean;
  /** Injectable session store for conversation memory (tests). */
  getSessionHistory?: (sessionId: string) => Promise<ChatMessage[]>;
  appendSessionHistory?: (
    sessionId: string,
    messages: ChatMessage[],
  ) => Promise<void>;
}

// Kill switch: fail closed. Only the exact string "true" (any case) enables
// the copilot. An unset or misconfigured secret keeps the endpoint inert.
function isKillSwitchEnabled(
  env: (name: string) => string | undefined,
): boolean {
  return (env("FREDDY_ENABLED") ?? "").trim().toLowerCase() === "true";
}

// Build conversation context string from recent history for LLM disambiguation.
function buildContextString(history: ChatMessage[]): string {
  if (history.length === 0) return "";
  const recent = history.slice(-MAX_CONTEXT_MESSAGES);
  return recent
    .map((m) => (m.role === "user" ? "User: " : "Freddy: ") + m.content)
    .join("\n");
}

// Retry an async operation with exponential back-off.
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  deps: AgentRouterDeps,
): Promise<{ ok: true; value: T } | { ok: false; reason: string }> {
  const log = deps.env ? undefined : console.error;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn();
      return { ok: true, value: result };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 2000;
        if (log) log(`[${label}] attempt ${attempt + 1} failed, retrying in ${delay}ms:`, err);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (log) log(`[${label}] all ${MAX_RETRIES + 1} attempts failed:`, err);
      return { ok: false, reason: `${label} unavailable after retries` };
    }
  }
  return { ok: false, reason: `${label} unavailable` };
}

// Call the credit-insights edge function to generate credit score insights.
async function fetchCreditInsights(
  supabaseUrl: string,
  supabaseAnonKey: string,
  userJwt: string,
  fetchImpl: typeof fetch,
  userId: string,
  userName: string,
): Promise<{ ok: true; value: CreditInsightsResult } | { ok: false; reason: string }> {
  const result = await withRetry(async () => {
    const res = await fetchImpl(`${supabaseUrl}/functions/v1/credit-insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ userId, userName }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`${res.status}: ${(body.error || body.detail || "unknown").slice(0, 200)}`);
    }
    const data = await res.json();
    return data as CreditInsightsResult;
  }, "credit-insights", { env: undefined });
  return result;
}

export async function handleAgentRouter(
  req: Request,
  deps: AgentRouterDeps = {},
): Promise<Response> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const checkRateLimitImpl = deps.checkRateLimitImpl ?? checkRateLimit;
  const fetchImpl = deps.fetchImpl ?? fetch;

  const requestId = generateRequestId();
  const headers = { ...getCorsHeaders(req), "X-Request-Id": requestId };

  if (req.method === "OPTIONS") {
    return optionsResponse(headers);
  }

  // Kill switch first: fail closed.
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

  // Strict rate limit before auth.
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

  const jwtSecret = env("FREDDY_JWT_SECRET") ?? "";
  const expectedIssuer = env("FREDDY_EXPECTED_ISSUER") ?? "";
  const expectedAudience = env("FREDDY_EXPECTED_AUDIENCE") ?? "";
  if (!jwtSecret || !expectedIssuer || !expectedAudience) {
    console.error(
      `[${requestId}] agent-router: required auth configuration missing (FREDDY_JWT_SECRET / FREDDY_EXPECTED_ISSUER / FREDDY_EXPECTED_AUDIENCE)`,
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
  const userId = user.userId;

  // Optional server-side conversation memory (opt-in via
  // FREDDY_MEMORY_ENABLED=true). When enabled, the store is authoritative and
  // the client-sent history is ignored; when disabled, the client-provided
  // history remains the only context source.
  const memoryEnabled =
    (env("FREDDY_MEMORY_ENABLED") ?? "").trim().toLowerCase() === "true";
  const getSessionHistory = deps.getSessionHistory ??
    (memoryEnabled
      ? async (sid: string): Promise<ChatMessage[]> => {
          const supabaseUrl = env("SUPABASE_URL") ?? "";
          const supabaseAnonKey = env("SUPABASE_ANON_KEY") ?? "";
          if (!supabaseUrl || !supabaseAnonKey) return [];
          return fetchSessionHistory(
            { baseUrl: supabaseUrl, anonKey: supabaseAnonKey, userJwt: token, userId },
            sid,
            { fetchImpl },
          );
        }
      : undefined);
  const appendSessionHistory = deps.appendSessionHistory ??
    (memoryEnabled
      ? async (sid: string, msgs: ChatMessage[]): Promise<void> => {
          const supabaseUrl = env("SUPABASE_URL") ?? "";
          const supabaseAnonKey = env("SUPABASE_ANON_KEY") ?? "";
          if (!supabaseUrl || !supabaseAnonKey) return;
          await persistSessionHistory(
            { baseUrl: supabaseUrl, anonKey: supabaseAnonKey, userJwt: token, userId },
            sid,
            msgs,
            { fetchImpl },
          );
        }
      : undefined);

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

  // Strict contract.
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return errorResponse(
      'Body must be a JSON object with "message" (string) and optional "sessionId", "filters", "history".',
      400,
      headers,
      requestId,
    );
  }

  const keys = Object.keys(parsed as Record<string, unknown>);
  const hasUnknownKey = keys.some(
    (k) => k !== "message" && k !== "sessionId" && k !== "filters" && k !== "history" && k !== "lang",
  );
  if (hasUnknownKey) {
    return errorResponse(
      'Unknown body fields. Only "message", optional "sessionId", "filters", "history", "lang" are accepted.',
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

  const lang = body.lang ?? "en";
  if (lang !== "en" && lang !== "hi") {
    return errorResponse(
      '"lang" must be "en" or "hi" when present.',
      400,
      headers,
      requestId,
    );
  }
  const tr = (en: string, hi: string): string => (lang === "hi" ? hi : en);

  // Load conversation history for context. When server-side memory is
  // enabled the store is authoritative; otherwise fall back to the
  // client-provided window.
  let history: ChatMessage[] = body.history ?? [];
  if (sessionId && getSessionHistory) {
    try {
      history = await getSessionHistory(sessionId);
    } catch {
      history = body.history ?? [];
    }
  }

  const contextString = buildContextString(history);

  const phaseHeaders = { ...headers, "X-Freddy-Phase": "2" };

  // ── Phase 2a: Credit score query detection ──
  if (isCreditScoreQuery(message)) {
    const supabaseUrl = env("SUPABASE_URL") ?? "";
    const supabaseAnonKey = env("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !supabaseAnonKey) {
      return errorResponse("Server configuration error.", 500, headers, requestId);
    }

    // Look up the user's display name from the JWT claims.
    const userName = user.email ?? userId;

    const creditResult = await fetchCreditInsights(
      supabaseUrl,
      supabaseAnonKey,
      token,
      fetchImpl,
      userId,
      userName,
    );

    if (creditResult.ok) {
      // Append to conversation memory.
      if (sessionId && appendSessionHistory) {
        try {
          await appendSessionHistory(sessionId, [
            { role: "user", content: message },
            { role: "assistant", content: creditResult.value.summary },
          ]);
        } catch {
          // best effort
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          phase: 2,
          tool: "credit-insights",
          intentSource: "llm",
          summary: creditResult.value.summary,
          strengths: creditResult.value.strengths,
          improvements: creditResult.value.improvements,
          tips: creditResult.value.tips,
          projection: creditResult.value.projection,
          provider: creditResult.value.provider,
          sessionId,
          requestId,
        }),
        { status: 200, headers: phaseHeaders },
      );
    }

    // Credit service unavailable — fall through to a helpful message.
    return new Response(
      JSON.stringify({
        ok: true,
        phase: 2,
        tool: null,
        detail: tr(
          "Credit insights are temporarily unavailable. Your credit score and factors are visible on your Profile page.",
          "क्रेडिट इनसाइट्स अभी उपलब्ध नहीं हैं। आपका क्रेडिट स्कोर और कारक आपके प्रोफ़ाइल पेज पर देखे जा सकते हैं।",
        ),
        sessionId,
        requestId,
      }),
      { status: 200, headers: phaseHeaders },
    );
  }

  // ── Phase 2b: tool selection — trucker-side shipment search vs market search ──
  // Explicit filters are always market-shaped (backwards-compatible contract),
  // so shipment routing only applies when the model must parse free text.
  if (
    isShipmentSearchRequest(message) &&
    (body.filters === undefined || body.filters === null)
  ) {
    let filters: SearchShipmentsFilters | null = null;
    let intentSource: "explicit" | "llm" | "fallback" | "empty" | null = null;

    const parsed = await parseFreddyIntent(message.trim(), {
      fetchImpl,
      env,
    }, contextString);
    // Reinterpret market-shaped intent fields for the shipment side:
    // required capacity ≈ shipment weight, max price per tonne ≈ budget.
    const mapped: SearchShipmentsFilters = {};
    if (parsed.filters.origin) mapped.origin = parsed.filters.origin;
    if (parsed.filters.destination) mapped.destination = parsed.filters.destination;
    if (parsed.filters.min_capacity_tonnes !== undefined) {
      mapped.min_weight_tonnes = parsed.filters.min_capacity_tonnes;
    }
    if (parsed.filters.max_price_per_tonne !== undefined) {
      mapped.max_budget_per_tonne = parsed.filters.max_price_per_tonne;
    }
    if (parsed.filters.vehicle_type) mapped.vehicle_type = parsed.filters.vehicle_type;
    const validated = validateSearchShipmentsParams(mapped);
    filters = validated.ok ? validated.filters : null;
    intentSource = parsed.source;
    const intentRaw = parsed.raw;

    // No usable filters: return a stable no-tool response.
    if (!filters || Object.keys(filters).length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          phase: 2,
          tool: null,
          intentSource: intentSource ?? null,
          detail: tr(
            "No usable filters were provided or extracted from your message. " +
              "Try: 'Find shipments from Rourkela to Ranchi for 5 tonnes under 4000 per tonne'",
            "आपके संदेश से कोई उपयोगी फ़िल्टर नहीं मिला। " +
              "कोशिश करें: 'राउरकेला से राँची के लिए 5 टन, 4000 प्रति टन से कम शिपमेंट खोजें'",
          ),
          sessionId,
          requestId,
        }),
        { status: 200, headers: phaseHeaders },
      );
    }

    const supabaseUrl = env("SUPABASE_URL") ?? "";
    const supabaseAnonKey = env("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        `[${requestId}] agent-router: required marketplace configuration missing (SUPABASE_URL / SUPABASE_ANON_KEY)`,
      );
      return errorResponse("Server configuration error.", 500, headers, requestId);
    }

    const outcomeResult = await withRetry(async () => {
      return searchShipments(
        { baseUrl: supabaseUrl, anonKey: supabaseAnonKey, userJwt: token },
        filters,
        { fetchImpl },
      );
    }, "search-shipments", { env: deps.env });
    if (!outcomeResult.ok) {
      return errorResponse(outcomeResult.reason, 502, phaseHeaders, requestId);
    }
    const outcome = outcomeResult.value;
    if (!outcome.ok) {
      return errorResponse(outcome.reason, 502, phaseHeaders, requestId);
    }

    const summary = buildFreddyShipmentsSummary(outcome.shipments, filters, intentSource);

    // Zero-result recovery: relaxed-scope suggestions so the user can broaden.
    let suggestions: SearchSuggestion[] = [];
    if (outcome.count === 0) {
      try {
        const probes = buildShipmentProbes(mapped);
        const counts = await probeShipmentAvailability(
          { baseUrl: supabaseUrl, anonKey: supabaseAnonKey, userJwt: token },
          probes,
          fetchImpl,
        );
        suggestions = buildSuggestions(probes, counts);
      } catch {
        suggestions = [];
      }
    }

    // Append to conversation memory.
    if (sessionId && appendSessionHistory) {
      try {
        await appendSessionHistory(sessionId, [
          { role: "user", content: message },
          { role: "assistant", content: summary },
        ]);
      } catch {
        // best effort
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        phase: 2,
        tool: "search_shipments",
        count: outcome.count,
        limit: outcome.limit,
        shipments: outcome.shipments,
        filters,
        intentSource,
        intentRaw,
        summary,
        suggestions,
        sessionId,
        requestId,
      }),
      { status: 200, headers: phaseHeaders },
    );
  }

  // ── Phase 2c: search_market (load matching) ──
  let filters: SearchMarketFilters | null = null;
  let intentSource: "explicit" | "llm" | "fallback" | "empty" | null = null;
  let intentRaw: string | undefined;

  if (body.filters !== undefined && body.filters !== null) {
    const validated = validateSearchMarketParams(body.filters);
    if (!validated.ok) {
      return errorResponse(validated.reason, 400, phaseHeaders, requestId);
    }
    filters = validated.filters;
    intentSource = "explicit";
    intentRaw = undefined;
  } else {
    const parsed = await parseFreddyIntent(message.trim(), {
      fetchImpl,
      env,
    }, contextString);
    // Conversation context is forwarded to the LLM for pronoun disambiguation.
    filters = parsed.filters;
    intentSource = parsed.source;
    intentRaw = parsed.raw;
  }

  // No usable filters: return a stable no-tool response.
  if (!filters || Object.keys(filters).length === 0) {
    return new Response(
      JSON.stringify({
        ok: true,
        phase: 2,
        tool: null,
        intentSource: intentSource ?? null,
        detail: tr(
          "No usable filters were provided or extracted from your message. " +
            "Try: 'Find trucks from Rourkela to Ranchi for 5 tonnes under 4000 per tonne'",
          "आपके संदेश से कोई उपयोगी फ़िल्टर नहीं मिला। " +
            "कोशिश करें: 'राउरकेला से राँची के लिए 5 टन, 4000 प्रति टन से कम ट्रक खोजें'",
        ),
        sessionId,
        requestId,
      }),
      { status: 200, headers: phaseHeaders },
    );
  }

  const supabaseUrl = env("SUPABASE_URL") ?? "";
  const supabaseAnonKey = env("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      `[${requestId}] agent-router: required marketplace configuration missing (SUPABASE_URL / SUPABASE_ANON_KEY)`,
    );
    return errorResponse("Server configuration error.", 500, headers, requestId);
  }

  const outcomeResult = await withRetry(async () => {
    return searchMarket(
      { baseUrl: supabaseUrl, anonKey: supabaseAnonKey, userJwt: token },
      filters,
      { fetchImpl },
    );
  }, "search-market", { env: deps.env });
  if (!outcomeResult.ok) {
    return errorResponse(outcomeResult.reason, 502, phaseHeaders, requestId);
  }
  const outcome = outcomeResult.value;
  if (!outcome.ok) {
    return errorResponse(outcome.reason, 502, phaseHeaders, requestId);
  }

  const summary = buildFreddySummary(outcome.loads, filters, intentSource);

  // Zero-result recovery: relaxed-scope suggestions so the user can broaden.
  let suggestions: SearchSuggestion[] = [];
  if (outcome.count === 0) {
    try {
      const probes = buildMarketProbes(filters);
      const counts = await probeMarketAvailability(
        { baseUrl: supabaseUrl, anonKey: supabaseAnonKey, userJwt: token },
        probes,
        fetchImpl,
      );
      suggestions = buildSuggestions(probes, counts);
    } catch {
      suggestions = [];
    }
  }

  // Append to conversation memory.
  if (sessionId && appendSessionHistory) {
    try {
      await appendSessionHistory(sessionId, [
        { role: "user", content: message },
        { role: "assistant", content: summary },
      ]);
    } catch {
      // best effort
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      phase: 2,
      tool: "search_market",
      count: outcome.count,
      limit: outcome.limit,
      loads: outcome.loads,
      filters,
      intentSource,
      intentRaw,
      summary,
      suggestions,
      sessionId,
      requestId,
    }),
    { status: 200, headers: phaseHeaders },
  );
}

// ---------------------------------------------------------------------------
// Conversational summary builder — turns raw marketplace rows into a
// human-readable message for the Disha chat UI.
// ---------------------------------------------------------------------------

function buildFreddySummary(
  loads: MarketLoad[],
  filters: SearchMarketFilters,
  _intentSource: "explicit" | "llm" | "fallback" | "empty" | null,
): string {
  const count = loads.length;
  if (count === 0) {
    const parts: string[] = [];
    if (filters.origin && filters.destination) {
      parts.push(`No trucks found from ${filters.origin} to ${filters.destination}`);
    } else if (filters.origin) {
      parts.push(`No trucks found from ${filters.origin}`);
    } else if (filters.destination) {
      parts.push(`No trucks found to ${filters.destination}`);
    } else {
      parts.push("No trucks found matching your search.");
    }
    if (filters.min_capacity_tonnes) {
      parts.push(`with at least ${filters.min_capacity_tonnes}t capacity`);
    }
    if (filters.max_price_per_tonne) {
      parts.push(`under ₹${filters.max_price_per_tonne}/tonne`);
    }
    return parts.join(" ") + ". Try broadening your filters or check back later.";
  }

  const top = loads[0];
  const route = top.origin_city && top.destination_city
    ? `${top.origin_city} → ${top.destination_city}`
    : "your route";
  const price = top.price_per_tonne ? `₹${top.price_per_tonne}/tonne` : "price on request";
  const capacity = top.available_capacity_tonnes ? `${top.available_capacity_tonnes}t` : "capacity TBD";
  const trucker = top.trucker?.full_name ? `by ${top.trucker.full_name}` : "";
  const verified = top.trucker?.is_verified ? " (verified)" : "";

  let summary = `Found ${count} truck${count === 1 ? "" : "s"} on ${route} — ${price}, ${capacity} ${trucker}${verified}.`;
  if (count > 1) {
    summary += ` The best match is ${top.origin_city} to ${top.destination_city} at ${price}.`;
  }
  return summary;
}

function buildFreddyShipmentsSummary(
  shipments: MarketShipment[],
  filters: SearchShipmentsFilters,
  _intentSource: "explicit" | "llm" | "fallback" | "empty" | null,
): string {
  const count = shipments.length;
  if (count === 0) {
    const parts: string[] = [];
    if (filters.origin && filters.destination) {
      parts.push(`No open shipments found from ${filters.origin} to ${filters.destination}`);
    } else if (filters.origin) {
      parts.push(`No open shipments found from ${filters.origin}`);
    } else if (filters.destination) {
      parts.push(`No open shipments found to ${filters.destination}`);
    } else {
      parts.push("No open shipments found matching your search.");
    }
    if (filters.min_weight_tonnes) {
      parts.push(`weighing at least ${filters.min_weight_tonnes}t`);
    }
    if (filters.max_budget_per_tonne) {
      parts.push(`with a budget under ₹${filters.max_budget_per_tonne}/tonne`);
    }
    return parts.join(" ") + ". Try broadening your filters or check back later.";
  }

  const top = shipments[0];
  const route = top.origin_city && top.destination_city
    ? `${top.origin_city} → ${top.destination_city}`
    : "your route";
  const weight = top.weight_tonnes ? `${top.weight_tonnes}t` : "weight TBD";
  const budget = top.budget_per_tonne ? `₹${top.budget_per_tonne}/tonne` : "budget on request";
  const goods = top.goods_description ? ` (${top.goods_description})` : "";
  const shipper = top.shipper?.full_name ? `by ${top.shipper.full_name}` : "";
  const verified = top.shipper?.is_verified ? " (verified)" : "";

  let summary = `Found ${count} open shipment${count === 1 ? "" : "s"} on ${route} — ${weight}, ${budget} budget${goods} ${shipper}${verified}.`;
  if (count > 1) {
    summary += ` The closest match is ${top.origin_city} to ${top.destination_city} at ${budget}.`;
  }
  return summary;
}
