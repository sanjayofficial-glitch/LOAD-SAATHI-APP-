// Freddy tool: search_market — ONE read-only marketplace query for the
// agent-router's controlled tool layer (Phase 2 prep; the router keeps its
// Phase 1 gating until this module and its tests are green and integration
// is approved).
//
// Grounded in existing marketplace contracts (evidence, 2026-10-20):
// - public.trips schema: supabase/migrations/20250601_baseline_schema.sql:66-89
//   (origin_city/destination_city NOT NULL; available_capacity_tonnes and
//   price_per_tonne numeric CHECK > 0; status CHECK ∈ {active, in_transit,
//   delivered, completed, cancelled}).
// - The app's own "available loads" rule: BrowseTrips.queryFn
//   (supabase/src/pages/shipper/BrowseTrips.tsx:104-133) queries with the
//   caller's Clerk-JWT client over status ∈ {'active','in_transit'}, ordered
//   by departure_date ascending, capped at 50 rows.
// - Read RLS is authoritative and trivially consistent with the caller JWT:
//   authenticated SELECT is granted (GRANT + policy "Anyone can see active
//   trips", 20260806_fix_trips_read_access.sql:29-42). This module NEVER uses
//   the service-role key and NEVER mutates data.
//
// Security properties:
// - Database access is always anchored to the verified caller JWT
//   (Authorization: Bearer <jwt>) plus SUPABASE_ANON_KEY as the apikey header.
//   Identity and row visibility come from RLS, never from fields the model
//   or client supplied. The JWT signature is NOT re-verified here — callers
//   must pass the token already verified by _shared/verifyClerkJwt.ts.
// - Filters pass a strict allowlist validator: known keys only, bounded
//   trimmed string lengths, finite numbers within range, and LIKE wildcards
//   (% _ \) escaped before any ilike — stricter than the UI's naive pattern.
// - Status list, ordering, column selection and result limit are fixed
//   constants — never model-controlled. There is no way to express a write.
// - Build/parse functions are pure and network-free so tests run without
//   Deno network permissions; the single network call lives in searchMarket()
//   and accepts an injected fetchImpl for the same reason.
// - Failure modes return { ok: false, reason } with sanitized reasons: HTTP
//   status at most, never response bodies, secrets, tokens, or SQLSTATE text.

export const SEARCH_MARKET_LIMIT = 50;
export const SEARCH_MARKET_TIMEOUT_MS = 8_000;
export const SEARCH_MARKET_MAX_TEXT_LENGTH = 80;
export const SEARCH_MARKET_MAX_CAPACITY_TONNES = 500;
export const SEARCH_MARKET_MAX_PRICE_PER_TONNE = 1_000_000;
export const SEARCH_MARKET_STATUSES = ["active", "in_transit"] as const;

// Fixed SELECT allowlist — same column family as BrowseTrips (:107-114) minus
// coordinates and created_at, which the copilot does not need to summarize
// loads truthfully (distance/duration come from the DB, not estimates from
// the model). The trucker embed mirrors the UI join
// users!trips_trucker_id_fkey(full_name, rating, total_trips, is_verified).
export const SEARCH_MARKET_SELECT = [
  "id",
  "trucker_id",
  "origin_city",
  "origin_state",
  "destination_city",
  "destination_state",
  "departure_date",
  "available_capacity_tonnes",
  "price_per_tonne",
  "vehicle_type",
  "status",
  "estimated_distance_km",
  "estimated_duration_min",
  "trucker:users!trips_trucker_id_fkey(full_name,rating,total_trips,is_verified)",
].join(",");

export interface SearchMarketFilters {
  origin?: string;
  destination?: string;
  min_capacity_tonnes?: number;
  max_price_per_tonne?: number;
}

export interface SearchMarketConfig {
  /** Supabase project base URL, e.g. "https://xyz.supabase.co". */
  baseUrl: string;
  /** Public anon key — used as the apikey header. NEVER the service-role key. */
  anonKey: string;
  /** Caller JWT already verified by verifyClerkJwt. Used as Authorization bearer. */
  userJwt: string;
}

export interface PostgrestRequest {
  method: "GET";
  url: string;
  headers: Record<string, string>;
}

export interface MarketLoadTrucker {
  full_name?: string;
  rating?: number;
  total_trips?: number;
  is_verified?: boolean;
}

export interface MarketLoad {
  id: string;
  trucker_id?: string;
  origin_city: string;
  origin_state?: string;
  destination_city: string;
  destination_state?: string;
  departure_date: string;
  available_capacity_tonnes?: number;
  price_per_tonne?: number;
  vehicle_type?: string;
  status?: string;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  trucker?: MarketLoadTrucker;
}

export type SearchMarketOutcome =
  | { ok: true; loads: MarketLoad[]; count: number; limit: number }
  | { ok: false; reason: string };

export type SearchMarketValidation =
  | { ok: true; filters: SearchMarketFilters }
  | { ok: false; reason: string };

export type SearchMarketBuild =
  | { ok: true; request: PostgrestRequest }
  | { ok: false; reason: string };

export type SearchMarketParse =
  | { ok: true; loads: MarketLoad[] }
  | { ok: false; reason: string };

// ---------------------------------------------------------------------------
// Filter validation — strict allowlist, fail-closed.
// ---------------------------------------------------------------------------

export function validateSearchMarketParams(
  raw: unknown,
): SearchMarketValidation {
  if (raw === undefined || raw === null) {
    return { ok: true, filters: {} };
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      reason: "Filters must be a JSON object of named optional fields.",
    };
  }
  const record = raw as Record<string, unknown>;
  const allowed = new Set([
    "origin",
    "destination",
    "min_capacity_tonnes",
    "max_price_per_tonne",
  ]);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      return { ok: false, reason: `Unknown filter field "${key}".` };
    }
  }

  const filters: SearchMarketFilters = {};

  for (const outKey of ["origin", "destination"] as const) {
    const value = record[outKey];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") {
      return { ok: false, reason: `"${outKey}" must be a string when present.` };
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return {
        ok: false,
        reason: `"${outKey}" must be a non-empty string of at most ${SEARCH_MARKET_MAX_TEXT_LENGTH} characters, or omitted entirely.`,
      };
    }
    if (trimmed.length > SEARCH_MARKET_MAX_TEXT_LENGTH) {
      return {
        ok: false,
        reason: `"${outKey}" must be at most ${SEARCH_MARKET_MAX_TEXT_LENGTH} characters.`,
      };
    }
    // Postgres rejects NUL bytes in text parameters; reject early with a
    // sanitized reason instead of surfacing a driver error.
    if (trimmed.includes("\0")) {
      return {
        ok: false,
        reason: `"${outKey}" contains an unsupported character.`,
      };
    }
    filters[outKey] = trimmed;
  }

  const numericFields: ReadonlyArray<
    readonly ["min_capacity_tonnes" | "max_price_per_tonne", number]
  > = [
    ["min_capacity_tonnes", SEARCH_MARKET_MAX_CAPACITY_TONNES],
    ["max_price_per_tonne", SEARCH_MARKET_MAX_PRICE_PER_TONNE],
  ];
  for (const [outKey, max] of numericFields) {
    const value = record[outKey];
    if (value === undefined || value === null) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return {
        ok: false,
        reason: `"${outKey}" must be a finite number when present.`,
      };
    }
    if (value <= 0 || value > max) {
      return {
        ok: false,
        reason: `"${outKey}" must be greater than 0 and at most ${max} when present.`,
      };
    }
    filters[outKey] = value;
  }

  return { ok: true, filters };
}

// PostgREST ilike keeps LIKE semantics with "\" as the default ESCAPE
// character, so the caller must escape wildcards itself. Escape the backslash
// first, then % and _. Comma is irrelevant for a standalone ilike param (not
// an or=/in= composite) — URLSearchParams percent-encodes it anyway.
export function escapeLikePattern(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Request building — fixed shape, config fail-closed, headers injection-safe.
// ---------------------------------------------------------------------------

// Header values must never contain whitespace or control characters; this
// blocks header injection through a malformed token/key, independent of the
// signature checks done upstream in verifyClerkJwt.
export function isHeaderValueSafe(value: string): boolean {
  return value.length > 0 && !/[\s\u0000-\u001F\u007F]/.test(value);
}

export function buildSearchMarketRequest(
  config: SearchMarketConfig,
  filters: SearchMarketFilters,
): SearchMarketBuild {
  if (!config.baseUrl || !config.anonKey || !config.userJwt) {
    return {
      ok: false,
      reason:
        "Search configuration is incomplete (baseUrl / anonKey / caller JWT).",
    };
  }
  if (!isHeaderValueSafe(config.anonKey)) {
    return { ok: false, reason: "SUPABASE_ANON_KEY configuration is invalid." };
  }
  if (!isHeaderValueSafe(config.userJwt)) {
    return { ok: false, reason: "Caller token is not header-safe." };
  }

  let base: URL;
  try {
    base = new URL(config.baseUrl);
  } catch {
    return { ok: false, reason: "Supabase baseUrl configuration is invalid." };
  }
  if (base.protocol !== "https:") {
    return { ok: false, reason: "Supabase baseUrl must use HTTPS." };
  }
  if (base.username || base.password) {
    return {
      ok: false,
      reason: "Supabase baseUrl must not contain credentials.",
    };
  }
  if (base.pathname !== "/" && base.pathname !== "") {
    return {
      ok: false,
      reason:
        "Supabase baseUrl must be the project origin without a path, query or fragment.",
    };
  }

  const url = new URL("/rest/v1/trips", base);
  url.searchParams.set("select", SEARCH_MARKET_SELECT);
  url.searchParams.set(
    "status",
    `in.(${SEARCH_MARKET_STATUSES.map((s) => `"${s}"`).join(",")})`,
  );
  if (filters.origin !== undefined) {
    url.searchParams.set(
      "origin_city",
      `ilike.%${escapeLikePattern(filters.origin)}%`,
    );
  }
  if (filters.destination !== undefined) {
    url.searchParams.set(
      "destination_city",
      `ilike.%${escapeLikePattern(filters.destination)}%`,
    );
  }
  if (filters.min_capacity_tonnes !== undefined) {
    url.searchParams.set(
      "available_capacity_tonnes",
      `gte.${filters.min_capacity_tonnes}`,
    );
  }
  if (filters.max_price_per_tonne !== undefined) {
    url.searchParams.set(
      "price_per_tonne",
      `lte.${filters.max_price_per_tonne}`,
    );
  }
  url.searchParams.set("order", "departure_date.asc");
  url.searchParams.set("limit", String(SEARCH_MARKET_LIMIT));

  return {
    ok: true,
    request: {
      method: "GET",
      url: url.toString(),
      headers: {
        Authorization: `Bearer ${config.userJwt}`,
        apikey: config.anonKey,
        Accept: "application/json",
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Row parsing — fail closed on structure drift, coerce numerics cleanly.
// PostgREST may return numeric columns as numbers or quoted strings; the tool
// normalizes so the model never quotes a string as a number or vice versa.
// ---------------------------------------------------------------------------

const REQUIRED_STRING_ROW_FIELDS = [
  "id",
  "origin_city",
  "destination_city",
  "departure_date",
  "status",
] as const;

const NUMERIC_ROW_FIELDS = [
  "available_capacity_tonnes",
  "price_per_tonne",
  "estimated_distance_km",
  "estimated_duration_min",
] as const;

function coerceNumber(
  value: unknown,
  context: string,
): { ok: true; value: number | undefined } | { ok: false; reason: string } {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value === "number" && Number.isFinite(value)) {
    return { ok: true, value };
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return { ok: true, value: parsed };
  }
  return { ok: false, reason: `Malformed marketplace row (${context}).` };
}

function coerceOptionalString(value: unknown): { ok: boolean; value?: string } {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== "string") return { ok: false };
  return { ok: true, value };
}

function coerceTrucker(
  value: unknown,
): { ok: true; trucker: MarketLoadTrucker | undefined } | {
  ok: false;
  reason: string;
} {
  if (value === undefined || value === null) return { ok: true, trucker: undefined };
  if (typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "Malformed marketplace row (trucker embed)." };
  }
  const record = value as Record<string, unknown>;
  const trucker: MarketLoadTrucker = {};

  const fullName = coerceOptionalString(record.full_name);
  if (!fullName.ok) {
    return { ok: false, reason: "Malformed marketplace row (trucker.full_name)." };
  }
  if (fullName.value !== undefined) trucker.full_name = fullName.value;

  for (const numericField of ["rating", "total_trips"] as const) {
    const coerced = coerceNumber(record[numericField], `trucker.${numericField}`);
    if (!coerced.ok) return { ok: false, reason: coerced.reason };
    if (coerced.value !== undefined) {
      trucker[numericField] = coerced.value;
    }
  }

  const verified = record.is_verified;
  if (verified !== undefined && verified !== null) {
    if (typeof verified !== "boolean") {
      return {
        ok: false,
        reason: "Malformed marketplace row (trucker.is_verified).",
      };
    }
    trucker.is_verified = verified;
  }

  return { ok: true, trucker };
}

export function parseSearchMarketRows(payload: unknown): SearchMarketParse {
  if (!Array.isArray(payload)) {
    return { ok: false, reason: "Marketplace response was not a row array." };
  }
  const loads: MarketLoad[] = [];
  for (const row of payload) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      return { ok: false, reason: "Malformed marketplace row." };
    }
    const record = row as Record<string, unknown>;

    for (const field of REQUIRED_STRING_ROW_FIELDS) {
      const value = record[field];
      if (typeof value !== "string" || value.length === 0) {
        return {
          ok: false,
          reason: `Malformed marketplace row (missing ${field}).`,
        };
      }
    }
    if (
      !(SEARCH_MARKET_STATUSES as readonly string[]).includes(
        record.status as string,
      )
    ) {
      return {
        ok: false,
        reason: `Malformed marketplace row (unexpected status "${record.status}").`,
      };
    }

    const load: MarketLoad = {
      id: record.id as string,
      origin_city: record.origin_city as string,
      destination_city: record.destination_city as string,
      departure_date: record.departure_date as string,
      status: record.status as string,
    };

    const truckerId = coerceOptionalString(record.trucker_id);
    if (!truckerId.ok) {
      return { ok: false, reason: "Malformed marketplace row (trucker_id)." };
    }
    if (truckerId.value !== undefined) load.trucker_id = truckerId.value;

    for (const optionalText of [
      "origin_state",
      "destination_state",
      "vehicle_type",
    ] as const) {
      const coerced = coerceOptionalString(record[optionalText]);
      if (!coerced.ok) {
        return { ok: false, reason: `Malformed marketplace row (${optionalText}).` };
      }
      if (coerced.value !== undefined) load[optionalText] = coerced.value;
    }

    for (const field of NUMERIC_ROW_FIELDS) {
      const coerced = coerceNumber(record[field], field);
      if (!coerced.ok) return { ok: false, reason: coerced.reason };
      if (coerced.value !== undefined) load[field] = coerced.value;
    }

    const trucker = coerceTrucker(record.trucker);
    if (!trucker.ok) return { ok: false, reason: trucker.reason };
    if (trucker.trucker !== undefined) load.trucker = trucker.trucker;

    loads.push(load);
  }
  return { ok: true, loads };
}

// ---------------------------------------------------------------------------
// Execution — the only network call. fetchImpl injectable for network-free
// tests. Reason strings stay sanitized (HTTP status at most).
// ---------------------------------------------------------------------------

export interface SearchMarketDeps {
  /** Injectable fetch used by tests. Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export async function searchMarket(
  config: SearchMarketConfig,
  rawParams: unknown,
  deps: SearchMarketDeps = {},
): Promise<SearchMarketOutcome> {
  const validated = validateSearchMarketParams(rawParams);
  if (!validated.ok) return { ok: false, reason: validated.reason };

  const built = buildSearchMarketRequest(config, validated.filters);
  if (!built.ok) return { ok: false, reason: built.reason };

  const fetchImpl = deps.fetchImpl ?? fetch;
  const fetchInput: RequestInit = {
    method: built.request.method,
    headers: built.request.headers,
    signal: AbortSignal.timeout(SEARCH_MARKET_TIMEOUT_MS),
  };

  try {
    const response = await fetchImpl(built.request.url, fetchInput);
    if (!response.ok) {
      return {
        ok: false,
        reason: `Marketplace search failed (HTTP ${response.status}).`,
      };
    }
    const payload: unknown = await response.json();
    const parsed = parseSearchMarketRows(payload);
    if (!parsed.ok) return { ok: false, reason: parsed.reason };
    return {
      ok: true,
      loads: parsed.loads,
      count: parsed.loads.length,
      limit: SEARCH_MARKET_LIMIT,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, reason: "Marketplace search timed out." };
    }
    return { ok: false, reason: "Marketplace search failed." };
  }
}
