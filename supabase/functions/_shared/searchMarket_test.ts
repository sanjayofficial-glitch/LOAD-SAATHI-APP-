// Self-contained tests for the search_market tool module (Freddy Phase 2).
// Network-free by construction: the executor's fetch is injected, so no Deno
// net/env permissions are requested and no real HTTP ever happens. No env
// reads, no real secrets — every value below is an obvious placeholder.

import {
  SEARCH_MARKET_LIMIT,
  SEARCH_MARKET_SELECT,
  SEARCH_MARKET_STATUSES,
  buildSearchMarketRequest,
  escapeLikePattern,
  isHeaderValueSafe,
  parseSearchMarketRows,
  searchMarket,
  validateSearchMarketParams,
} from "./searchMarket.ts";
import type { SearchMarketConfig } from "./searchMarket.ts";

const BASE_URL = "https://test-project.supabase.co";
const ANON_KEY = "test_anon_key_placeholder_not_real";
const TEST_JWT = "user_test.jwt.placeholder";
const CONFIG: SearchMarketConfig = {
  baseUrl: BASE_URL,
  anonKey: ANON_KEY,
  userJwt: TEST_JWT,
};

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
}

// An assertion predicate: after a call, the compiler knows the outcome is the
// ok:true member of the module's discriminated unions, so `filters`, `loads`
// and `request` member access typechecks without a second narrowing.
function requireOk<T extends { ok: boolean }>(
  outcome: T,
  label: string,
): asserts outcome is T & { ok: true } {
  if (!outcome.ok) {
    const reason = (outcome as { reason?: string }).reason;
    throw new Error(
      `${label}: expected ok:true, got error "${reason ?? ""}"`,
    );
  }
}

function requireFail(
  outcome: { ok: boolean; reason?: string },
  label: string,
): string {
  if (outcome.ok) {
    throw new Error(`${label}: expected failure, got ok:true`);
  }
  return outcome.reason ?? "";
}

// Returns an injectable fetch that records the request and replies with a
// fixture. `capture` is filled before the response resolves.
function injectFetch(
  capture: { request: CapturedRequest | null; callCount: number },
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

function okResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

// Row A: numbers as numbers, full trucker embed (BrowseTrips-shaped).
const ROW_A = {
  id: "11111111-1111-1111-1111-111111111111",
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

// Row B: PostgREST-style quoted numerics + null trucker — proves coercion.
const ROW_B = {
  id: "22222222-2222-2222-2222-222222222222",
  trucker_id: "user_2xyz789",
  origin_city: "Delhi",
  origin_state: null,
  destination_city: "Nagpur",
  destination_state: null,
  departure_date: "2026-10-22",
  available_capacity_tonnes: "8",
  price_per_tonne: "900.75",
  vehicle_type: "trailer",
  status: "in_transit",
  estimated_distance_km: "1100",
  estimated_duration_min: "1440",
  trucker: null,
};

// ---------------------------------------------------------------------------
// Filter validation
// ---------------------------------------------------------------------------

Deno.test("absent filter objects produce empty filters", () => {
  for (const raw of [undefined, null, {}]) {
    const validated = validateSearchMarketParams(raw);
    requireOk(validated, `filters ${JSON.stringify(raw)}`);
    if (Object.keys(validated.filters).length !== 0) {
      throw new Error("expected empty filters");
    }
  }
});

Deno.test("null optional fields are treated as absent", () => {
  const validated = validateSearchMarketParams({
    origin: null,
    destination: null,
    min_capacity_tonnes: null,
    max_price_per_tonne: null,
  });
  requireOk(validated, "null optionals");
  if (Object.keys(validated.filters).length !== 0) {
    throw new Error("null optionals must not produce filters");
  }
});

Deno.test("unknown and malformed filter payloads are rejected", () => {
  const cases: Array<[unknown, (reason: string) => boolean]> = [
    [{ sort: "price_asc" }, (r) => r.includes('Unknown filter field "sort"')],
    ["origin", (r) => r.includes("must be a JSON object")],
    [["origin"], (r) => r.includes("must be a JSON object")],
    [42, (r) => r.includes("must be a JSON object")],
  ];
  for (const [raw, matches] of cases) {
    const reason = requireFail(validateSearchMarketParams(raw), "malformed");
    if (!matches(reason)) throw new Error(`unexpected reason: ${reason}`);
  }
});

Deno.test("text filters are trimmed and length-bounded", () => {
  const good = validateSearchMarketParams({ origin: "  Mumbai  " });
  requireOk(good, "origin trim");
  if (good.filters.origin !== "Mumbai") {
    throw new Error(`expected trimmed origin, got ${good.filters.origin}`);
  }

  const dest = validateSearchMarketParams({ destination: " Pune " });
  requireOk(dest, "destination trim");
  if (dest.filters.destination !== "Pune") {
    throw new Error(`expected trimmed destination, got ${dest.filters.destination}`);
  }

  const maxLength = "x".repeat(80);
  requireOk(validateSearchMarketParams({ origin: maxLength }), "80 chars");
  requireFail(
    validateSearchMarketParams({ origin: `${maxLength}1` }),
    "81 chars",
  );
});

Deno.test("empty and unsafe text filters are rejected", () => {
  const cases = ["", "   ", `a\0b`, 4.2];
  for (const origin of cases) {
    const reason = requireFail(
      validateSearchMarketParams({ origin }),
      `origin ${JSON.stringify(origin)}`,
    );
    if (
      !reason.includes("must be a string") &&
      !reason.includes("must be a non-empty string") &&
      !reason.includes("unsupported character")
    ) {
      throw new Error(`unexpected reason: ${reason}`);
    }
  }
});

Deno.test("min_capacity_tonnes must be a finite number in (0, 500]", () => {
  for (const good of [0.1, 1, 500]) {
    requireOk(
      validateSearchMarketParams({ min_capacity_tonnes: good }),
      `capacity ${good}`,
    );
  }
  for (const bad of [0, -1, 500.001, Number.NaN, Infinity, -Infinity, "500", true]) {
    const reason = requireFail(
      validateSearchMarketParams({ min_capacity_tonnes: bad }),
      `capacity ${String(bad)}`,
    );
    if (!reason.includes("min_capacity_tonnes")) {
      throw new Error(`reason must name the field: ${reason}`);
    }
  }
});

Deno.test("max_price_per_tonne must be a finite number in (0, 1000000]", () => {
  for (const good of [0.01, 1450, 1_000_000]) {
    requireOk(
      validateSearchMarketParams({ max_price_per_tonne: good }),
      `price ${good}`,
    );
  }
  for (const bad of [0, -5, 1_000_000.01, Number.NaN, Infinity, "x", false]) {
    const reason = requireFail(
      validateSearchMarketParams({ max_price_per_tonne: bad }),
      `price ${String(bad)}`,
    );
    if (!reason.includes("max_price_per_tonne")) {
      throw new Error(`reason must name the field: ${reason}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Wildcard escaping and header safety
// ---------------------------------------------------------------------------

Deno.test("escapeLikePattern escapes backslash, % and _", () => {
  const actual = escapeLikePattern("100%_x\\y");
  const expected = "100\\%\\_x\\\\y";
  if (actual !== expected) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  if (escapeLikePattern("plain") !== "plain") {
    throw new Error("plain term must be unchanged");
  }
});

Deno.test("header values reject whitespace and control characters", () => {
  if (!isHeaderValueSafe("eyJhbGciOiJIUzI1NiJ9.payload.sig")) {
    throw new Error("normal JWT must be header-safe");
  }
  for (const bad of ["", "a b", "a\tb", "a\nb", "a\rb", "\u0007"]) {
    if (isHeaderValueSafe(bad)) {
      throw new Error(`expected unsafe header value: ${JSON.stringify(bad)}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Request building — fixed status/order/limit/select, config fail-closed
// ---------------------------------------------------------------------------

Deno.test("search request hard-wires statuses, order, limit, select", () => {
  const built = buildSearchMarketRequest(CONFIG, {});
  requireOk(built, "empty-filter build");
  const request = built.request;

  if (request.method !== "GET") throw new Error("method must be GET");
  const url = new URL(request.url);
  if (url.pathname !== "/rest/v1/trips") {
    throw new Error(`unexpected path: ${url.pathname}`);
  }
  if (url.searchParams.get("status") !== 'in.("active","in_transit")') {
    throw new Error(`unexpected status param: ${url.searchParams.get("status")}`);
  }
  if (url.searchParams.get("order") !== "departure_date.asc") {
    throw new Error(`unexpected order: ${url.searchParams.get("order")}`);
  }
  if (url.searchParams.get("limit") !== String(SEARCH_MARKET_LIMIT)) {
    throw new Error(`unexpected limit: ${url.searchParams.get("limit")}`);
  }
  if (url.searchParams.get("origin_city") !== null) {
    throw new Error("no origin filter expected");
  }
  if (url.searchParams.get("destination_city") !== null) {
    throw new Error("no destination filter expected");
  }
  if (url.searchParams.get("select") !== SEARCH_MARKET_SELECT) {
    throw new Error("unexpected select");
  }
  if (SEARCH_MARKET_SELECT !==
    "id,trucker_id,origin_city,origin_state,destination_city,destination_state,departure_date,available_capacity_tonnes,price_per_tonne,vehicle_type,status,estimated_distance_km,estimated_duration_min,trucker:users!trips_trucker_id_fkey(full_name,rating,total_trips,is_verified)") {
    throw new Error("select allowlist drifted from the UI join shape");
  }
  if (
    SEARCH_MARKET_STATUSES.join("|") !== "active|in_transit"
  ) {
    throw new Error("statuses drifted from the BrowseTrips rule");
  }

  const expectedHeaders = {
    Authorization: `Bearer ${TEST_JWT}`,
    apikey: ANON_KEY,
    Accept: "application/json",
  };
  for (const [name, value] of Object.entries(expectedHeaders)) {
    if (request.headers[name] !== value) {
      throw new Error(`header ${name} mismatch: ${request.headers[name]}`);
    }
  }
  if (Object.keys(request.headers).length !== 3) {
    throw new Error("unexpected extra headers");
  }
});

Deno.test("search request maps validated filters into PostgREST params", () => {
  const validated = validateSearchMarketParams({
    origin: "go%a_b\\c",
    destination: "kon%",
    min_capacity_tonnes: 12.5,
    max_price_per_tonne: 1450,
  });
  requireOk(validated, "filters");
  const built = buildSearchMarketRequest(CONFIG, validated.filters);
  requireOk(built, "build");

  const url = new URL(built.request.url);
  const originExpect = `ilike.%${escapeLikePattern("go%a_b\\c")}%`;
  if (url.searchParams.get("origin_city") !== originExpect) {
    throw new Error(`origin mismatch: ${url.searchParams.get("origin_city")}`);
  }
  if (url.searchParams.get("destination_city") !== `ilike.%${escapeLikePattern("kon%")}%`) {
    throw new Error(`destination mismatch: ${url.searchParams.get("destination_city")}`);
  }
  if (url.searchParams.get("available_capacity_tonnes") !== "gte.12.5") {
    throw new Error(`capacity mismatch: ${url.searchParams.get("available_capacity_tonnes")}`);
  }
  if (url.searchParams.get("price_per_tonne") !== "lte.1450") {
    throw new Error(`price mismatch: ${url.searchParams.get("price_per_tonne")}`);
  }
});

Deno.test("configuration fails closed before any request is built", () => {
  const cases: Array<[Partial<SearchMarketConfig>, string]> = [
    [{ baseUrl: "" }, "incomplete"],
    [{ anonKey: "" }, "incomplete"],
    [{ userJwt: "" }, "incomplete"],
    [{ anonKey: undefined }, "incomplete"],
    [{ anonKey: "a b" }, "SUPABASE_ANON_KEY"],
    [{ anonKey: "a\nb" }, "SUPABASE_ANON_KEY"],
    [{ userJwt: "a b" }, "header-safe"],
    [{ baseUrl: "not-a-url" }, "invalid"],
    [{ baseUrl: "http://test-project.supabase.co" }, "HTTPS"],
    [{ baseUrl: `${BASE_URL}/rest` }, "must be the project origin"],
    [{ baseUrl: "https://user:pw@test-project.supabase.co" }, "credentials"],
  ];
  for (const [partial, needle] of cases) {
    const built = buildSearchMarketRequest(
      { ...CONFIG, ...partial } as SearchMarketConfig,
      {},
    );
    const reason = requireFail(built, `config ${needle}`);
    if (!reason.includes(needle)) {
      throw new Error(`reason "${reason}" missing "${needle}"`);
    }
  }
});

Deno.test("a baseUrl with a trailing slash still targets /rest/v1/trips", () => {
  const built = buildSearchMarketRequest(
    { ...CONFIG, baseUrl: `${BASE_URL}/` },
    {},
  );
  requireOk(built, "trailing slash");
  if (new URL(built.request.url).pathname !== "/rest/v1/trips") {
    throw new Error("path changed with trailing slash");
  }
});

// ---------------------------------------------------------------------------
// Row parsing
// ---------------------------------------------------------------------------

Deno.test("parse accepts UI-shaped rows and coerces quoted numerics", () => {
  const parsed = parseSearchMarketRows([ROW_A, ROW_B]);
  requireOk(parsed, "fixture rows");

  const [loadA, loadB] = parsed.loads;

  if (loadA.id !== ROW_A.id || loadA.origin_city !== "Mumbai" || loadA.destination_city !== "Surat") {
    throw new Error("row A identity mismatch");
  }
  if (loadA.available_capacity_tonnes !== 12.5 || loadA.price_per_tonne !== 1450) {
    throw new Error("row A numerics changed");
  }
  if (loadA.trucker?.full_name !== "Ramesh K" || loadA.trucker.rating !== 4.5 || loadA.trucker.is_verified !== true) {
    throw new Error("row A trucker embed mismatch");
  }

  if (loadB.available_capacity_tonnes !== 8 || loadB.price_per_tonne !== 900.75) {
    throw new Error("row B quoted numerics not coerced");
  }
  if (loadB.estimated_distance_km !== 1100 || loadB.estimated_duration_min !== 1440) {
    throw new Error("row B distance/duration not coerced");
  }
  if (loadB.trucker !== undefined) {
    throw new Error("null trucker must be absent");
  }
  if (loadB.origin_state !== undefined || loadB.destination_state !== undefined) {
    throw new Error("null states must be absent");
  }
});

Deno.test("parse returns an empty load list for an empty row array", () => {
  const parsed = parseSearchMarketRows([]);
  requireOk(parsed, "empty rows");
  if (parsed.loads.length !== 0) throw new Error("expected no loads");
});

Deno.test("parse fails closed on structural drift", () => {
  const mutations: Array<(rows: Record<string, unknown>[]) => unknown> = [
    (rows) => ({ rows }),
    (_rows) => "not an array",
    (rows) => rows.map((r) => ({ ...r, id: undefined })),
    (rows) => rows.map((r) => ({ ...r, status: "delivered" })),
    (rows) => rows.map((r) => ({ ...r, price_per_tonne: "not-a-number" })),
    (rows) => rows.map((r) => ({ ...r, trucker: 42 })),
    (rows) => rows.map((r) => ({ ...r, trucker: { ...((r.trucker ?? {}) as Record<string, unknown>), rating: [] } })),
    (rows) => rows.map((r) => ({ ...r, origin_state: 7 })),
  ];
  for (const mutate of mutations) {
    const rows = [structuredClone(ROW_A), structuredClone(ROW_B)];
    const reason = requireFail(parseSearchMarketRows(mutate(rows)), "drift");
    if (!reason.length) throw new Error("expected a sanitized reason");
  }
});

// ---------------------------------------------------------------------------
// End-to-end executor with injected fetch (network-free)
// ---------------------------------------------------------------------------

Deno.test("searchMarket runs the full chain and returns grounded loads", async () => {
  const capture: { request: CapturedRequest | null; callCount: number } = {
    request: null,
    callCount: 0,
  };
  const outcome = await searchMarket(
    CONFIG,
    { origin: "mumbai", min_capacity_tonnes: 10 },
    { fetchImpl: injectFetch(capture, () => okResponse([ROW_A])) },
  );

  requireOk(outcome, "end-to-end");
  if (capture.callCount !== 1) throw new Error("fetch must be called exactly once");

  const request = capture.request as CapturedRequest;
  if (request.method !== "GET") throw new Error("request method changed");
  const url = new URL(request.url);
  if (url.pathname !== "/rest/v1/trips") throw new Error("unexpected path");
  if (url.searchParams.get("origin_city") !== "ilike.%mumbai%") {
    throw new Error(`origin param mismatch: ${url.searchParams.get("origin_city")}`);
  }
  if (url.searchParams.get("available_capacity_tonnes") !== "gte.10") {
    throw new Error("capacity param mismatch");
  }
  if (request.headers["Authorization"] !== `Bearer ${TEST_JWT}`) {
    throw new Error("Authorization header mismatch");
  }
  if (request.headers["apikey"] !== ANON_KEY) {
    throw new Error("apikey header mismatch");
  }

  if (outcome.count !== 1 || outcome.limit !== SEARCH_MARKET_LIMIT) {
    throw new Error("count/limit mismatch");
  }
  if (outcome.loads[0].id !== ROW_A.id) {
    throw new Error("load identity mismatch");
  }
});

Deno.test("searchMarket returns an explicit empty result", async () => {
  const capture: { request: CapturedRequest | null; callCount: number } = {
    request: null,
    callCount: 0,
  };
  const outcome = await searchMarket(
    CONFIG,
    { destination: "mars" },
    { fetchImpl: injectFetch(capture, () => okResponse([])) },
  );
  requireOk(outcome, "empty end-to-end");
  if (outcome.count !== 0 || outcome.loads.length !== 0) {
    throw new Error("expected count 0 with empty loads");
  }
});

Deno.test("searchMarket returns no rows on a non-2xx response and never leaks the body", async () => {
  const capture: { request: CapturedRequest | null; callCount: number } = {
    request: null,
    callCount: 0,
  };
  const leaky = async (): Promise<string> => {
    throw new Error("permission denied for table trips");
  };
  const outcome = await searchMarket(
    CONFIG,
    {},
    {
      fetchImpl: injectFetch(capture, () => ({
        ok: false,
        status: 401,
        // Deliberately poisoned json(): if the implementation read the body
        // the failure reason would leak the SQLSTATE text.
        json: leaky,
      }) as unknown as Response),
    },
  );
  const reason = requireFail(outcome, "HTTP 401");
  if (!reason.includes("401")) throw new Error(`reason must cite 401, got ${reason}`);
  if (reason.toLowerCase().includes("permission")) {
    throw new Error(`reason leaked server body text: ${reason}`);
  }
});

Deno.test("searchMarket rejects a non-array database payload", async () => {
  const outcome = await searchMarket(
    CONFIG,
    {},
    { fetchImpl: injectFetch(
      { request: null, callCount: 0 },
      () => okResponse({ rows: [] }),
    ) },
  );
  const reason = requireFail(outcome, "non-array payload");
  if (!reason.includes("row array")) {
    throw new Error(`unexpected reason: ${reason}`);
  }
});

Deno.test("searchMarket reports a sanitized timeout", async () => {
  const outcome = await searchMarket(
    CONFIG,
    {},
    {
      fetchImpl: (async () => {
        throw new DOMException("The operation was aborted.", "AbortError");
      }) as unknown as typeof fetch,
    },
  );
  const reason = requireFail(outcome, "timeout");
  if (!reason.includes("timed out")) {
    throw new Error(`unexpected reason: ${reason}`);
  }
});

Deno.test("searchMarket reports a generic failure for other errors", async () => {
  const outcome = await searchMarket(
    CONFIG,
    {},
    {
      fetchImpl: (async () => {
        throw new TypeError("network down");
      }) as unknown as typeof fetch,
    },
  );
  const reason = requireFail(outcome, "network error");
  if (reason !== "Marketplace search failed.") {
    throw new Error(`reason must be fully sanitized, got: ${reason}`);
  }
  if (reason.toLowerCase().includes("network down")) {
    throw new Error("reason leaked the underlying error");
  }
});

Deno.test("searchMarket short-circuits invalid filters without any fetch", async () => {
  const capture: { request: CapturedRequest | null; callCount: number } = {
    request: null,
    callCount: 0,
  };
  const outcome = await searchMarket(
    CONFIG,
    { origin: "   " },
    { fetchImpl: injectFetch(capture, () => okResponse([ROW_A])) },
  );
  requireFail(outcome, "invalid filters short-circuit");
  if (capture.callCount !== 0) {
    throw new Error("validation failure must not reach the database");
  }
});
