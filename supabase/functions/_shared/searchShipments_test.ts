// Self-contained tests for the search_shipments tool module (Freddy agent
// Phase 3). Network-free by construction: the executor's fetch is injected,
// so no Deno net/env permissions are requested and no real HTTP ever happens.
// No env reads, no real secrets — every value below is an obvious placeholder.

import {
  SEARCH_SHIPMENTS_LIMIT,
  SEARCH_SHIPMENTS_SELECT,
  SEARCH_SHIPMENTS_STATUSES,
  buildSearchShipmentsRequest,
  escapeLikePattern,
  isHeaderValueSafe,
  parseSearchShipmentsRows,
  searchShipments,
  validateSearchShipmentsParams,
} from "./searchShipments.ts";
import type { SearchShipmentsConfig } from "./searchShipments.ts";

const BASE_URL = "https://test-project.supabase.co";
const ANON_KEY = "test_anon_key_placeholder_not_real";
const TEST_JWT = "user_test.jwt.placeholder";
const CONFIG: SearchShipmentsConfig = {
  baseUrl: BASE_URL,
  anonKey: ANON_KEY,
  userJwt: TEST_JWT,
};

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
}

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

const SHIPMENT_ROW = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  shipper_id: "user_2abcDEF456",
  origin_city: "Rourkela",
  origin_state: "Odisha",
  destination_city: "Ranchi",
  destination_state: "Jharkhand",
  departure_date: "2026-10-25",
  weight_tonnes: 8,
  budget_per_tonne: 3200,
  goods_description: "steel coils",
  status: "pending",
  estimated_distance_km: 340,
  estimated_duration_min: 390,
  shipper: {
    full_name: "Meena S",
    rating: 4.7,
    total_trips: 45,
    is_verified: true,
  },
};

Deno.test("validateSearchShipmentsParams accepts valid filters", () => {
  const result = validateSearchShipmentsParams({
    origin: "Rourkela",
    destination: "Ranchi",
    min_weight_tonnes: 5,
    max_budget_per_tonne: 4000,
  });
  requireOk(result, "validation");
  if (result.filters.origin !== "Rourkela") throw new Error("origin mismatch");
  if (result.filters.destination !== "Ranchi") throw new Error("destination mismatch");
  if (result.filters.min_weight_tonnes !== 5) throw new Error("weight mismatch");
  if (result.filters.max_budget_per_tonne !== 4000) throw new Error("budget mismatch");
});

Deno.test("validateSearchShipmentsParams rejects unknown and empty fields", () => {
  const unknown = requireFail(
    validateSearchShipmentsParams({ min_capacity_tonnes: 5 }),
    "unknown field",
  );
  if (!unknown.includes("Unknown filter field")) throw new Error("bad reason: " + unknown);

  const empty = requireFail(
    validateSearchShipmentsParams({ origin: "  " }),
    "empty origin",
  );
  if (!empty.includes("non-empty string")) throw new Error("bad reason: " + empty);

  const badNumber = requireFail(
    validateSearchShipmentsParams({ min_weight_tonnes: -1 }),
    "negative weight",
  );
  if (!badNumber.includes("greater than 0")) throw new Error("bad reason: " + badNumber);
});

Deno.test("escapeLikePattern escapes wildcards", () => {
  const escaped = escapeLikePattern("50%_\\");
  if (escaped !== "50\\%\\_\\\\") throw new Error("escape mismatch: " + escaped);
});

Deno.test("isHeaderValueSafe rejects whitespace/control chars", () => {
  if (!isHeaderValueSafe("abc123")) throw new Error("should be safe");
  if (isHeaderValueSafe("has space")) throw new Error("should reject space");
  if (isHeaderValueSafe("has\u0000nul")) throw new Error("should reject NUL");
});

Deno.test("buildSearchShipmentsRequest sets fixed status/select and filters", () => {
  const built = buildSearchShipmentsRequest(CONFIG, {
    origin: "Rourkela",
    destination: "Ranchi",
    min_weight_tonnes: 5,
    max_budget_per_tonne: 4000,
  });
  requireOk(built, "build");
  const url = new URL(built.request.url);

  if (!url.pathname.endsWith("/rest/v1/shipments")) {
    throw new Error("wrong table path: " + url.pathname);
  }
  if (url.searchParams.get("select") !== SEARCH_SHIPMENTS_SELECT) {
    throw new Error("select mismatch");
  }
  const statusParam = `in.(${SEARCH_SHIPMENTS_STATUSES.map((s) => `"${s}"`).join(",")})`;
  if (url.searchParams.get("status") !== statusParam) {
    throw new Error("status filter mismatch: " + url.searchParams.get("status"));
  }
  if (url.searchParams.get("origin_city") !== "ilike.%Rourkela%") {
    throw new Error("origin filter mismatch");
  }
  if (url.searchParams.get("destination_city") !== "ilike.%Ranchi%") {
    throw new Error("destination filter mismatch");
  }
  if (url.searchParams.get("weight_tonnes") !== "gte.5") {
    throw new Error("weight filter mismatch");
  }
  if (url.searchParams.get("budget_per_tonne") !== "lte.4000") {
    throw new Error("budget filter mismatch");
  }
  if (url.searchParams.get("order") !== "departure_date.asc") {
    throw new Error("order mismatch");
  }
  if (url.searchParams.get("limit") !== String(SEARCH_SHIPMENTS_LIMIT)) {
    throw new Error("limit mismatch");
  }
  if (built.request.headers.Authorization !== `Bearer ${TEST_JWT}`) {
    throw new Error("authorization header mismatch");
  }
  if (built.request.headers.apikey !== ANON_KEY) {
    throw new Error("apikey header mismatch");
  }
});

Deno.test("parseSearchShipmentsRows accepts a valid row and coerces numerics", () => {
  const parsed = parseSearchShipmentsRows([SHIPMENT_ROW]);
  requireOk(parsed, "parse");
  if (parsed.shipments.length !== 1) throw new Error("row count mismatch");
  const row = parsed.shipments[0];
  if (row.origin_city !== "Rourkela") throw new Error("origin mismatch");
  if (row.weight_tonnes !== 8) throw new Error("weight mismatch");
  if (row.budget_per_tonne !== 3200) throw new Error("budget mismatch");
  if (row.shipper?.full_name !== "Meena S") throw new Error("shipper embed mismatch");
  if (row.shipper?.is_verified !== true) throw new Error("verified mismatch");
});

Deno.test("parseSearchShipmentsRows rejects malformed and unexpected status rows", () => {
  const badStatus = requireFail(
    parseSearchShipmentsRows([{ ...SHIPMENT_ROW, status: "completed" }]),
    "bad status",
  );
  if (!badStatus.includes("unexpected status")) throw new Error("bad reason: " + badStatus);

  const missingCity = requireFail(
    parseSearchShipmentsRows([{ ...SHIPMENT_ROW, origin_city: "" }]),
    "missing city",
  );
  if (!missingCity.includes("missing origin_city")) throw new Error("bad reason: " + missingCity);

  const notArray = requireFail(
    parseSearchShipmentsRows({ nope: true }),
    "not array",
  );
  if (!notArray.includes("row array")) throw new Error("bad reason: " + notArray);
});

Deno.test("searchShipments calls the API and returns normalized rows", async () => {
  const capture = { request: null as CapturedRequest | null, callCount: 0 };
  const fetchImpl = injectFetch(capture, () => okResponse([SHIPMENT_ROW]));

  const outcome = await searchShipments(
    CONFIG,
    { origin: "Rourkela", destination: "Ranchi" },
    { fetchImpl },
  );
  requireOk(outcome, "search");
  if (outcome.count !== 1) throw new Error("count mismatch");
  if (outcome.limit !== SEARCH_SHIPMENTS_LIMIT) throw new Error("limit mismatch");
  if (capture.callCount !== 1) throw new Error("expected exactly one fetch");
  if (!capture.request?.url.includes("status=in.")) throw new Error("status param missing");
});

Deno.test("searchShipments sanitizes HTTP errors", async () => {
  const capture = { request: null as CapturedRequest | null, callCount: 0 };
  const fetchImpl = injectFetch(capture, () => okResponse({}, 502));

  const outcome = await searchShipments(CONFIG, { origin: "X" }, { fetchImpl });
  const reason = requireFail(outcome, "http error");
  if (!reason.includes("HTTP 502")) throw new Error("bad reason: " + reason);
});
