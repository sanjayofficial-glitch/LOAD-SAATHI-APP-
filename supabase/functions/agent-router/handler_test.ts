// Focused, network-free tests for the Phase 2 agent-router integration.
// - env, fetch and rate limiter are injected; real verifyClerkJwt is used with
//   tokens minted locally with a discardable test secret.
// - No Deno network/env permissions are needed, no ports are bound (the tests
//   import handler.ts, never the Deno.serve entrypoint), and every value below
//   is an obvious placeholder.
// - The actual filter/query behaviors are asserted in depth by
//   _shared/searchMarket_test.ts; here the router's wiring is the target:
//   phase ordering, contract, status classification and sanitized errors.

import { handleAgentRouter } from "./handler.ts";
import type { AgentRouterDeps } from "./handler.ts";

const TEST_SECRET = "test-only-secret-0123456789abcdef-discardable";
const TEST_ISSUER = "https://test-instance.clerk.accounts.dev";
const TEST_AUDIENCE = "supabase";
const TEST_SUPABASE_URL = "https://test-project.supabase.co";
const TEST_ANON_KEY = "test_anon_key_placeholder_not_real";

const ROW = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  trucker_id: "user_2abcDEF123",
  origin_city: "Mumbai",
  origin_state: "Maharashtra",
  destination_city: "Surat",
  destination_state: "Gujarat",
  departure_date: "2026-10-21",
  available_capacity_tonnes: 12.5,
  price_per_tonne: 1450,
  vehicle_type: "container",
  status: "active",
  estimated_distance_km: 280,
  estimated_duration_min: 300,
  trucker: {
    full_name: "Ramesh K",
    rating: 4.5,
    total_trips: 120,
    is_verified: true,
  },
};

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
}

interface FetchCapture {
  request: CapturedRequest | null;
  callCount: number;
}

function injectFetch(
  capture: FetchCapture,
  respond: () => Response,
): typeof fetch {
  const impl = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    capture.callCount += 1;
    capture.request = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: (init?.headers ?? {}) as Record<string, string>,
    };
    return respond();
  };
  return impl as unknown as typeof fetch;
}

function okJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function authEnv(): Record<string, string> {
  return {
    FREDDY_ENABLED: "true",
    SUPABASE_JWT_SECRET: TEST_SECRET,
    FREDDY_EXPECTED_ISSUER: TEST_ISSUER,
    FREDDY_EXPECTED_AUDIENCE: TEST_AUDIENCE,
    SUPABASE_URL: TEST_SUPABASE_URL,
    SUPABASE_ANON_KEY: TEST_ANON_KEY,
  };
}

function envOf(
  values: Record<string, string> = authEnv(),
): (name: string) => string | undefined {
  return (name) => values[name];
}

function rateLimitRecorder(
  allowed = true,
): {
  calls: Array<{ key: string; maxRequests: number; windowMs: number }>;
  impl: (key: string, maxRequests: number, windowMs: number) => boolean;
} {
  const calls: Array<{
    key: string;
    maxRequests: number;
    windowMs: number;
  }> = [];
  return {
    calls,
    impl: (key, maxRequests, windowMs) => {
      calls.push({ key, maxRequests, windowMs });
      return allowed;
    },
  };
}

const enc = new TextEncoder();

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? enc.encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

function baseClaims(overrides: Record<string, unknown> = {}): Record<
  string,
  unknown
> {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: "user_2routerCopilotTest",
    role: "authenticated",
    iss: TEST_ISSUER,
    aud: TEST_AUDIENCE,
    email: "freddy@test.local",
    iat: now,
    nbf: now,
    exp: now + 3600,
    ...overrides,
  };
}

async function mintToken(
  overrides: Record<string, unknown> = {},
  secret = TEST_SECRET,
): Promise<string> {
  const headerB64 = base64UrlEncode(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  );
  const payloadB64 = base64UrlEncode(JSON.stringify(baseClaims(overrides)));
  const signatureB64 = await hmacSign(
    `${headerB64}.${payloadB64}`,
    secret,
  );
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

interface RequestOptions {
  body?: unknown;
  token?: string | null;
  method?: string;
  contentType?: string;
  xfwd?: string;
  rawBody?: string;
}

function makeRequest(options: RequestOptions = {}): Request {
  const headers: Record<string, string> = {
    "content-type": options.contentType ?? "application/json",
  };
  if (options.token) {
    headers["authorization"] = `Bearer ${options.token}`;
  }
  if (options.xfwd) {
    headers["x-forwarded-for"] = options.xfwd;
  }
  const init: RequestInit = {
    method: options.method ?? "POST",
    headers,
  };
  if (options.rawBody !== undefined) {
    init.body = options.rawBody;
  } else if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  return new Request(
    "https://edge.functions.example.com/functions/v1/agent-router",
    init,
  );
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertErrorResponseSize(body: unknown, label: string): string {
  const record = body as Record<string, unknown>;
  const error = record.error;
  if (typeof error !== "string") {
    throw new Error(`${label}: error string expected`);
  }
  const requestId = record.requestId;
  if (typeof requestId !== "string" || requestId.length === 0) {
    throw new Error(`${label}: requestId expected`);
  }
  return error;
}

// ---------------------------------------------------------------------------
// Phase ordering preserved
// ---------------------------------------------------------------------------

Deno.test("OPTIONS pre-flight returns 204 before any other gate", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const rate = rateLimitRecorder();
  const res = await handleAgentRouter(makeRequest({ method: "OPTIONS" }), {
    env: envOf(),
    fetchImpl: injectFetch(capture, () => okJsonResponse([ROW])),
    checkRateLimitImpl: rate.impl,
  });
  assert(res.status === 204, `expected 204, got ${res.status}`);
  assert(rate.calls.length === 0, "rate limiter must not run for OPTIONS");
  assert(capture.callCount === 0, "no database access for OPTIONS");
});

Deno.test("kill switch stays disabled by default and blocks everything", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const rate = rateLimitRecorder();
  const token = await mintToken();
  const res = await handleAgentRouter(
    makeRequest({
      body: { message: "find loads", filters: { origin: "Mumbai" } },
      token,
    }),
    { env: envOf({}), fetchImpl: injectFetch(capture, () => okJsonResponse([ROW])), checkRateLimitImpl: rate.impl },
  );
  assert(res.status === 200, `expected 200, got ${res.status}`);
  const body = await res.json() as Record<string, unknown>;
  assert(body.ok === true, "disabled response must be ok:true");
  assert(body.enabled === false, "kill switch must report disabled");
  assert(body.phase === 1, "disabled response keeps phase 1");
  assert(
    typeof body.requestId === "string" && body.requestId.length > 0,
    "requestId expected",
  );
  assert(rate.calls.length === 0, "rate limiter must not run while disabled");
  assert(capture.callCount === 0, "no database access while disabled");
});

Deno.test("FREDDY_ENABLED values other than true-in-any-case keep the switch off", async () => {
  const token = await mintToken();
  // Documented Phase 1 semantics: the trimmed, lowercased value must be
  // exactly "true" to enable. Everything else stays inert.
  const offValues = ["yes", "1", "false", "on", "enabled", ""];
  for (const value of offValues) {
    const capture: FetchCapture = { request: null, callCount: 0 };
    const res = await handleAgentRouter(
      makeRequest({ body: { message: "hi", filters: {} }, token }),
      {
        env: envOf({ FREDDY_ENABLED: value }),
        checkRateLimitImpl: () => true,
      },
    );
    assert(
      res.status === 200,
      `FREDDY_ENABLED=${value} must stay disabled`,
    );
    const body = await res.json() as Record<string, unknown>;
    assert(
      body.enabled === false,
      `FREDDY_ENABLED=${value} must report enabled:false`,
    );
    assert(capture.callCount === 0, "no database access while disabled");
  }
  // Sanity: true in any case (with surrounding whitespace) enables, proven by
  // reaching the auth gate (401 without a token).
  for (const value of ["true", "TRUE", " true "]) {
    const res = await handleAgentRouter(
      makeRequest({ body: { message: "hi", filters: {} } }),
      { env: envOf({ FREDDY_ENABLED: value }), checkRateLimitImpl: () => true },
    );
    assert(
      res.status === 401,
      `FREDDY_ENABLED=${value} must enable the endpoint (got ${res.status})`,
    );
  }
});

Deno.test("unsupported method is rejected with Allow header", async () => {
  const res = await handleAgentRouter(makeRequest({ method: "GET" }), {
    env: envOf(),
    checkRateLimitImpl: () => true,
  });
  assert(res.status === 405, `expected 405, got ${res.status}`);
  assert((res.headers.get("Allow") ?? "").includes("POST"), "Allow expected");
});

Deno.test("rate limit is consulted with the expected key and can reject", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const rate = rateLimitRecorder(false);
  const res = await handleAgentRouter(
    makeRequest({ body: { message: "hi" }, token: await mintToken(), xfwd: "203.0.113.7" }),
    { env: envOf(), checkRateLimitImpl: rate.impl },
  );
  assert(res.status === 429, `expected 429, got ${res.status}`);
  assert(res.headers.get("Retry-After") === "60", "Retry-After expected");
  assert(
    rate.calls.length === 1 &&
      rate.calls[0].key === "agent-router:203.0.113.7" &&
      rate.calls[0].maxRequests > 0 &&
      rate.calls[0].windowMs > 0,
    `unexpected rate limit wiring: ${JSON.stringify(rate.calls)}`,
  );
  assert(capture.callCount === 0, "no database access while rate limited");
});

// ---------------------------------------------------------------------------
// Authentication fail-closed paths
// ---------------------------------------------------------------------------

Deno.test("missing bearer token is rejected", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const res = await handleAgentRouter(
    makeRequest({ body: { message: "hi", filters: {} } }),
    {
      env: envOf(),
      fetchImpl: injectFetch(capture, () => okJsonResponse([ROW])),
      checkRateLimitImpl: () => true,
    },
  );
  assert(res.status === 401, `expected 401, got ${res.status}`);
  assert(capture.callCount === 0, "no database access without a token");
});

Deno.test("missing auth configuration fails closed with a sanitized 500", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const token = await mintToken();
  for (const missing of [
    "SUPABASE_JWT_SECRET",
    "FREDDY_EXPECTED_ISSUER",
    "FREDDY_EXPECTED_AUDIENCE",
  ] as const) {
    const env: Record<string, string> = authEnv();
    delete env[missing];
    const res = await handleAgentRouter(
      makeRequest({ body: { message: "hi", filters: {} }, token }),
      { env: envOf(env), checkRateLimitImpl: () => true },
    );
    assert(res.status === 500, `${missing} missing: expected 500`);
    const body = await res.json();
    const error = assertErrorResponseSize(body, missing);
    assert(error === "Server configuration error.", `sanitized 500 expected for ${missing}`);
    assert(
      !JSON.stringify(body).includes(TEST_SECRET) &&
        !JSON.stringify(body).includes(TEST_ISSUER) &&
        !JSON.stringify(body).includes(token),
      "secret/issuer/token must never appear in the error body",
    );
    assert(capture.callCount === 0, "no database access with missing auth config");
  }
});

Deno.test("invalid token signature is rejected", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const badToken = await mintToken({}, "wrong-secret-totally-different");
  const res = await handleAgentRouter(
    makeRequest({ body: { message: "hi", filters: {} }, token: badToken }),
    {
      env: envOf(),
      fetchImpl: injectFetch(capture, () => okJsonResponse([ROW])),
      checkRateLimitImpl: () => true,
    },
  );
  assert(res.status === 401, `expected 401, got ${res.status}`);
  assert(capture.callCount === 0, "no database access on auth failure");
});

// ---------------------------------------------------------------------------
// Request validation preserved
// ---------------------------------------------------------------------------

Deno.test("non-JSON content type is rejected", async () => {
  const token = await mintToken();
  const res = await handleAgentRouter(
    makeRequest({ body: { message: "hi" }, token, contentType: "text/plain" }),
    { env: envOf(), checkRateLimitImpl: () => true },
  );
  assert(res.status === 415, `expected 415, got ${res.status}`);
});

Deno.test("oversized body is rejected", async () => {
  const token = await mintToken();
  const res = await handleAgentRouter(
    makeRequest({ rawBody: JSON.stringify({ message: "x".repeat(17_000) }), token }),
    { env: envOf(), checkRateLimitImpl: () => true },
  );
  assert(res.status === 413, `expected 413, got ${res.status}`);
});

Deno.test("malformed JSON body is rejected", async () => {
  const token = await mintToken();
  const res = await handleAgentRouter(
    makeRequest({ rawBody: "{not json", token }),
    { env: envOf(), checkRateLimitImpl: () => true },
  );
  assert(res.status === 400, `expected 400, got ${res.status}`);
});

Deno.test("unknown body fields are rejected (tool surface cannot be smuggled)", async () => {
  const token = await mintToken();
  for (const intruder of ["status", "limit", "select", "sort", "sql"]) {
    const res = await handleAgentRouter(
      makeRequest({
        body: { message: "hi", filters: {}, [intruder]: "x" },
        token,
      }),
      { env: envOf(), checkRateLimitImpl: () => true },
    );
    assert(res.status === 400, `${intruder} key: expected 400, got ${res.status}`);
  }
});

Deno.test("message and sessionId validation is preserved", async () => {
  const token = await mintToken();
  const cases: Array<Record<string, unknown>> = [
    {},
    { message: "" },
    { message: "   " },
    { message: "x".repeat(2001) },
    { message: "hi", sessionId: "not-a-uuid" },
    { message: "hi", sessionId: 42 },
  ];
  for (const body of cases) {
    const res = await handleAgentRouter(makeRequest({ body, token }), {
      env: envOf(),
      checkRateLimitImpl: () => true,
    });
    assert(res.status === 400, `body ${JSON.stringify(body).slice(0, 40)}: expected 400, got ${res.status}`);
  }
});

// ---------------------------------------------------------------------------
// Phase 2: deterministic search_market tool step
// ---------------------------------------------------------------------------

Deno.test("valid authenticated request without tool arguments answers with a stable no-tool response and no database call", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const token = await mintToken();
  const res = await handleAgentRouter(
    makeRequest({ body: { message: "who am i talking to", sessionId: "cbaa9320-7a9e-4bfa-8b8a-5db3a9d3b111" }, token }),
    {
      env: envOf(),
      fetchImpl: injectFetch(capture, () => okJsonResponse([ROW])),
      checkRateLimitImpl: () => true,
    },
  );
  assert(res.status === 200, `expected 200, got ${res.status}`);
  const body = await res.json() as Record<string, unknown>;
  assert(body.ok === true, "no-tool response must be ok:true");
  assert(body.phase === 2, "phase must be 2");
  assert(body.tool === null, "no tool may be reported as executed");
  assert(
    typeof body.detail === "string" && body.detail.includes("filters"),
    "the response must say that 'filters' enables the tool",
  );
  assert(capture.callCount === 0, "no database access without tool arguments");
});

Deno.test("missing marketplace configuration fails closed before any database call", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const token = await mintToken();
  for (const missing of ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as const) {
    const env: Record<string, string> = authEnv();
    delete env[missing];
    const res = await handleAgentRouter(
      makeRequest({ body: { message: "hi", filters: { origin: "Mumbai" } }, token }),
      { env: envOf(env), checkRateLimitImpl: () => true },
    );
    assert(res.status === 500, `${missing} missing: expected 500, got ${res.status}`);
    const body = await res.json();
    const error = assertErrorResponseSize(body, missing);
    assert(error === "Server configuration error.", `sanitized 500 expected for ${missing}`);
    assert(capture.callCount === 0, "no database access with missing tool config");
  }
});

Deno.test("tool faults are client-rejected before any database request", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const token = await mintToken();
  const badFilters: unknown[] = [
    "Mumbai", // filters must be an object
    ["Mumbai"], // array
    { status: "active" }, // status is never client-controlled
    { limit: 10 }, // limit is never client-controlled
    { select: "*" }, // select is never client-controlled
    { origin: "" }, // empty term
    { origin: "x".repeat(81) }, // over the 80-char bound
    { min_capacity_tonnes: 0 }, // bounds (0, 500]
    { min_capacity_tonnes: 501 },
    { max_price_per_tonne: -1 },
    { unknownField: 1 },
  ];
  for (const filters of badFilters) {
    const res = await handleAgentRouter(
      makeRequest({ body: { message: "hi", filters }, token }),
      {
        env: envOf(),
        fetchImpl: injectFetch(capture, () => okJsonResponse([ROW])),
        checkRateLimitImpl: () => true,
      },
    );
    assert(res.status === 400, `filters ${JSON.stringify(filters)}: expected 400, got ${res.status}`);
    const body = await res.json();
    const error = assertErrorResponseSize(body, "filters");
    assert(error.length > 0 && error.length < 200, "reason must be a short sanitized string");
  }
  assert(capture.callCount === 0, "invalid filters must not reach the database");
});

Deno.test("valid authenticated search returns a grounded, count-capped response", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const rate = rateLimitRecorder(true);
  const token = await mintToken();
  const res = await handleAgentRouter(
    makeRequest({
      body: {
        message: "find loads",
        filters: { origin: "  Mumbai  ", min_capacity_tonnes: 10 },
      },
      token,
      xfwd: "203.0.113.9",
    }),
    {
      env: envOf(),
      fetchImpl: injectFetch(capture, () => okJsonResponse([ROW])),
      checkRateLimitImpl: rate.impl,
    },
  );
  assert(res.status === 200, `expected 200, got ${res.status}`);
  assert(res.headers.get("X-Freddy-Phase") === "2", "phase header expected");
  assert(res.headers.get("Access-Control-Allow-Origin") !== null, "CORS header expected");
  assert(res.headers.get("X-Request-Id") !== null, "request id header expected");

  const body = await res.json() as Record<string, unknown>;
  assert(body.ok === true, "success must be ok:true");
  assert(body.phase === 2, "phase must be 2");
  assert(body.tool === "search_market", "tool must be search_market");
  assert(body.count === 1, "count must equal returned rows");
  assert(body.limit === 50, "limit must document the fixed 50 cap");
  assert(Array.isArray(body.loads) && (body.loads as unknown[]).length === 1, "loads array expected");

  assert(rate.calls.length === 1, "rate limit must still be consulted");
  assert(
    rate.calls[0].key === "agent-router:203.0.113.9",
    "rate limit key must include the caller IP",
  );

  assert(capture.callCount === 1, "exactly one database request expected");
  const request = capture.request as CapturedRequest;
  assert(request.method === "GET", "database request must be GET");
  const url = new URL(request.url);
  assert(url.hostname === "test-project.supabase.co", "unexpected database host");
  assert(url.pathname === "/rest/v1/trips", "unexpected database path");
  assert(url.searchParams.get("origin_city") === "ilike.%Mumbai%", "origin filter mismatch");
  assert(url.searchParams.get("available_capacity_tonnes") === "gte.10", "capacity filter mismatch");
  assert(url.searchParams.get("order") === "departure_date.asc", "ordering is fixed");
  assert(url.searchParams.get("limit") === "50", "limit is fixed");
  assert(
    url.searchParams.get("status") === 'in.("active","in_transit")',
    "status filter is fixed",
  );
  assert(
    request.headers["Authorization"] === `Bearer ${token}`,
    "the caller's verified JWT must flow to the database as the bearer",
  );
  assert(request.headers["apikey"] === TEST_ANON_KEY, "anon key must flow as apikey");
  assert(
    !("service_role" in request.headers) &&
      !JSON.stringify(request).toLowerCase().includes("service_role"),
    "the service-role key must never be referenced",
  );

  const loads = body.loads as Array<Record<string, unknown>>;
  assert(loads[0].id === ROW.id, "returned load must come from the database");
  assert(loads[0].price_per_tonne === 1450, "prices must be grounded, not invented");
});

Deno.test("upstream database failures surface as sanitized 502s (no body or secret leaks)", async () => {
  const token = await mintToken();

  // Non-2xx with a poisoned body: if the router ever read the body, the test
  // would throw and the false "passed" would be visible.
  const leakyCapture: FetchCapture = { request: null, callCount: 0 };
  const leaky = async (): Promise<string> => {
    throw new Error("permission denied for table trips");
  };
  const res401 = await handleAgentRouter(
    makeRequest({ body: { message: "hi", filters: { origin: "Mumbai" } }, token }),
    {
      env: envOf(),
      fetchImpl: injectFetch(leakyCapture, () => ({
        ok: false,
        status: 401,
        json: leaky,
      }) as unknown as Response),
      checkRateLimitImpl: () => true,
    },
  );
  assert(res401.status === 502, `expected 502, got ${res401.status}`);
  const error401 = assertErrorResponseSize(await res401.json(), "http 401");
  assert(error401.includes("401"), "the HTTP status may be cited");
  assert(!error401.toLowerCase().includes("permission"), "body text must not leak");

  // Network failure must be fully generic.
  const fail = (async () => {
    throw new TypeError("gossip about the internal network");
  }) as unknown as typeof fetch;
  const resNet = await handleAgentRouter(
    makeRequest({ body: { message: "hi", filters: { origin: "Mumbai" } }, token }),
    { env: envOf(), fetchImpl: fail, checkRateLimitImpl: () => true },
  );
  assert(resNet.status === 502, `expected 502, got ${resNet.status}`);
  const errorNet = assertErrorResponseSize(await resNet.json(), "network error");
  assert(
    errorNet === "Marketplace search failed.",
    `reason must be fully sanitized, got: ${errorNet}`,
  );

  // Timeout must be explicit and generic.
  const timeout = (async () => {
    throw new DOMException("The operation was aborted.", "AbortError");
  }) as unknown as typeof fetch;
  const resTimeout = await handleAgentRouter(
    makeRequest({ body: { message: "hi", filters: { origin: "Mumbai" } }, token }),
    { env: envOf(), fetchImpl: timeout, checkRateLimitImpl: () => true },
  );
  assert(resTimeout.status === 502, `expected 502, got ${resTimeout.status}`);
  const errorTimeout = assertErrorResponseSize(await resTimeout.json(), "timeout");
  assert(errorTimeout.includes("timed out"), "timeout reason expected");

  // A non-array database payload is a tool failure, not a fabricated result.
  const shapeCapture: FetchCapture = { request: null, callCount: 0 };
  const resShape = await handleAgentRouter(
    makeRequest({ body: { message: "hi", filters: { origin: "Mumbai" } }, token }),
    {
      env: envOf(),
      fetchImpl: injectFetch(shapeCapture, () => okJsonResponse({ rows: [] })),
      checkRateLimitImpl: () => true,
    },
  );
  assert(resShape.status === 502, `expected 502, got ${resShape.status}`);
  const errorShape = assertErrorResponseSize(await resShape.json(), "shape");
  assert(errorShape.includes("row array"), "payload-shape reason expected");
  assert(!errorShape.includes("rows"), "payload keys must not leak");
});
