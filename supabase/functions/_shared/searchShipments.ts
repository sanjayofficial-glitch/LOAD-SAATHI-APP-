// Freddy tool: search_shipments — read-only open-shipment query for the
// agent-router's controlled tool layer. Mirror of search_market, but for the
// trucker side: it finds pending shipper-posted shipments that a trucker
// could haul.
//
// Grounded in existing marketplace contracts (evidence, 2026-10-20):
// - public.shipments schema: supabase/migrations/20250601_baseline_schema.sql:94-117
//   (origin_city/destination_city NOT NULL; weight_tonnes and
//   budget_per_tonne numeric CHECK > 0; status CHECK ∈ {pending, matched,
//   in_transit, delivered, completed, cancelled}).
// - The app's own "open shipments" rule: BrowseShipments.queryFn
//   (supabase/src/pages/trucker/BrowseShipments.tsx:105-128) queries with the
//   caller's Clerk-JWT client over status = 'pending', ordered by departure_date
//   ascending, capped at 50 rows.
// - RLS: pending shipments are world-readable to authenticated callers
//   (policy "Anyone can see pending shipments", 20260714_fix_rls_for_clerk.sql).
//   This module NEVER uses the service-role key and NEVER mutates data.
//
// Security properties (identical to searchMarket):
// - Database access is always anchored to the verified caller JWT
//   (Authorization: Bearer <jwt>) plus SUPABASE_ANON_KEY as the apikey header.
// - Filters pass a strict allowlist validator: known keys only, bounded
//   trimmed string lengths, finite numbers within range, LIKE wildcards escaped.
// - Status list, ordering, column selection and result limit are fixed
//   constants — never model-controlled. There is no way to express a write.
// - Build/parse functions are pure and network-free; the single network call
//   lives in searchShipments() with an injectable fetchImpl.

export const SEARCH_SHIPMENTS_LIMIT = 50;
export const SEARCH_SHIPMENTS_TIMEOUT_MS = 8_000;
export const SEARCH_SHIPMENTS_MAX_TEXT_LENGTH = 80;
export const SEARCH_SHIPMENTS_MAX_WEIGHT_TONNES = 500;
export const SEARCH_SHIPMENTS_MAX_BUDGET_PER_TONNE = 1_000_000;
export const SEARCH_SHIPMENTS_STATUSES = ["pending"] as const;

// Fixed SELECT allowlist — same column family as BrowseShipments (:107-112)
// minus coordinates and created_at, which the copilot does not need to
// summarize shipments truthfully. The shipper embed mirrors the UI join
// users!shipments_shipper_id_fkey(full_name, rating, total_trips, is_verified).
export const SEARCH_SHIPMENTS_SELECT = [
  "id",
  "shipper_id",
  "origin_city",
  "origin_state",
  "destination_city",
  "destination_state",
  "departure_date",
  "weight_tonnes",
  "budget_per_tonne",
  "goods_description",
  "status",
  "estimated_distance_km",
  "estimated_duration_min",
  "shipper:users!shipments_shipper_id_fkey(full_name,rating,total_trips,is_verified)",
].join(",");

export interface SearchShipmentsFilters {
  origin?: string;
  destination?: string;
  min_weight_tonnes?: number;
  max_budget_per_tonne?: number;
  vehicle_type?: string;
}

export interface SearchShipmentsConfig {
  baseUrl: string;
  anonKey: string;
  userJwt: string;
}

export interface MarketShipmentShipper {
  full_name?: string;
  rating?: number;
  total_trips?: number;
  is_verified?: boolean;
}

export interface MarketShipment {
  id: string;
  shipper_id?: string;
  origin_city: string;
  origin_state?: string;
  destination_city: string;
  destination_state?: string;
  departure_date: string;
  weight_tonnes?: number;
  budget_per_tonne?: number;
  goods_description?: string;
  status?: string;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  shipper?: MarketShipmentShipper;
}

export type SearchShipmentsOutcome =
  | { ok: true; shipments: MarketShipment[]; count: number; limit: number }
  | { ok: false; reason: string };

export type SearchShipmentsValidation =
  | { ok: true; filters: SearchShipmentsFilters }
  | { ok: false; reason: string };

export type SearchShipmentsBuild =
  | { ok: true; request: PostgrestRequest }
  | { ok: false; reason: string };

export type SearchShipmentsParse =
  | { ok: true; shipments: MarketShipment[] }
  | { ok: false; reason: string };

export interface PostgrestRequest {
  method: "GET";
  url: string;
  headers: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Filter validation — strict allowlist, fail-closed.
// ---------------------------------------------------------------------------

export function validateSearchShipmentsParams(
  raw: unknown,
): SearchShipmentsValidation {
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
    "min_weight_tonnes",
    "max_budget_per_tonne",
    "vehicle_type",
  ]);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      return { ok: false, reason: `Unknown filter field "${key}".` };
    }
  }

  const filters: SearchShipmentsFilters = {};

  for (const outKey of ["origin", "destination", "vehicle_type"] as const) {
    const value = record[outKey];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") {
      return { ok: false, reason: `"${outKey}" must be a string when present.` };
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return {
        ok: false,
        reason: `"${outKey}" must be a non-empty string of at most ${SEARCH_SHIPMENTS_MAX_TEXT_LENGTH} characters, or omitted entirely.`,
      };
    }
    if (trimmed.length > SEARCH_SHIPMENTS_MAX_TEXT_LENGTH) {
      return {
        ok: false,
        reason: `"${outKey}" must be at most ${SEARCH_SHIPMENTS_MAX_TEXT_LENGTH} characters.`,
      };
    }
    if (trimmed.includes("\0")) {
      return {
        ok: false,
        reason: `"${outKey}" contains an unsupported character.`,
      };
    }
    filters[outKey] = trimmed;
  }

  const numericFields: ReadonlyArray<
    readonly ["min_weight_tonnes" | "max_budget_per_tonne", number]
  > = [
    ["min_weight_tonnes", SEARCH_SHIPMENTS_MAX_WEIGHT_TONNES],
    ["max_budget_per_tonne", SEARCH_SHIPMENTS_MAX_BUDGET_PER_TONNE],
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

export function escapeLikePattern(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
}

export function isHeaderValueSafe(value: string): boolean {
  return value.length > 0 && !/[\s\u0000-\u001F\u007F]/.test(value); // eslint-disable-line no-control-regex
}

// ---------------------------------------------------------------------------
// Request building — fixed shape, config fail-closed, headers injection-safe.
// ---------------------------------------------------------------------------

export function buildSearchShipmentsRequest(
  config: SearchShipmentsConfig,
  filters: SearchShipmentsFilters,
): SearchShipmentsBuild {
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

  const url = new URL("/rest/v1/shipments", base);
  url.searchParams.set("select", SEARCH_SHIPMENTS_SELECT);
  url.searchParams.set(
    "status",
    `in.(${SEARCH_SHIPMENTS_STATUSES.map((s) => `"${s}"`).join(",")})`,
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
  if (filters.min_weight_tonnes !== undefined) {
    url.searchParams.set(
      "weight_tonnes",
      `gte.${filters.min_weight_tonnes}`,
    );
  }
  if (filters.max_budget_per_tonne !== undefined) {
    url.searchParams.set(
      "budget_per_tonne",
      `lte.${filters.max_budget_per_tonne}`,
    );
  }
  if (filters.vehicle_type !== undefined) {
    url.searchParams.set(
      "vehicle_type",
      `ilike.%${escapeLikePattern(filters.vehicle_type)}%`,
    );
  }
  url.searchParams.set("order", "departure_date.asc");
  url.searchParams.set("limit", String(SEARCH_SHIPMENTS_LIMIT));

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
// ---------------------------------------------------------------------------

const REQUIRED_STRING_ROW_FIELDS = [
  "id",
  "origin_city",
  "destination_city",
  "departure_date",
  "status",
] as const;

const NUMERIC_ROW_FIELDS = [
  "weight_tonnes",
  "budget_per_tonne",
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
  return { ok: false, reason: `Malformed shipment row (${context}).` };
}

function coerceOptionalString(value: unknown): { ok: boolean; value?: string } {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== "string") return { ok: false };
  return { ok: true, value };
}

function coerceShipper(
  value: unknown,
): { ok: true; shipper: MarketShipmentShipper | undefined } | {
  ok: false;
  reason: string;
} {
  if (value === undefined || value === null) return { ok: true, shipper: undefined };
  if (typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "Malformed shipment row (shipper embed)." };
  }
  const record = value as Record<string, unknown>;
  const shipper: MarketShipmentShipper = {};

  const fullName = coerceOptionalString(record.full_name);
  if (!fullName.ok) {
    return { ok: false, reason: "Malformed shipment row (shipper.full_name)." };
  }
  if (fullName.value !== undefined) shipper.full_name = fullName.value;

  for (const numericField of ["rating", "total_trips"] as const) {
    const coerced = coerceNumber(record[numericField], `shipper.${numericField}`);
    if (!coerced.ok) return { ok: false, reason: coerced.reason };
    if (coerced.value !== undefined) {
      shipper[numericField] = coerced.value;
    }
  }

  const verified = record.is_verified;
  if (verified !== undefined && verified !== null) {
    if (typeof verified !== "boolean") {
      return {
        ok: false,
        reason: "Malformed shipment row (shipper.is_verified).",
      };
    }
    shipper.is_verified = verified;
  }

  return { ok: true, shipper };
}

export function parseSearchShipmentsRows(payload: unknown): SearchShipmentsParse {
  if (!Array.isArray(payload)) {
    return { ok: false, reason: "Shipment response was not a row array." };
  }
  const shipments: MarketShipment[] = [];
  for (const row of payload) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      return { ok: false, reason: "Malformed shipment row." };
    }
    const record = row as Record<string, unknown>;

    for (const field of REQUIRED_STRING_ROW_FIELDS) {
      const value = record[field];
      if (typeof value !== "string" || value.length === 0) {
        return {
          ok: false,
          reason: `Malformed shipment row (missing ${field}).`,
        };
      }
    }
    if (
      !(SEARCH_SHIPMENTS_STATUSES as readonly string[]).includes(
        record.status as string,
      )
    ) {
      return {
        ok: false,
        reason: `Malformed shipment row (unexpected status "${record.status}").`,
      };
    }

    const shipment: MarketShipment = {
      id: record.id as string,
      origin_city: record.origin_city as string,
      destination_city: record.destination_city as string,
      departure_date: record.departure_date as string,
      status: record.status as string,
    };

    const shipperId = coerceOptionalString(record.shipper_id);
    if (!shipperId.ok) {
      return { ok: false, reason: "Malformed shipment row (shipper_id)." };
    }
    if (shipperId.value !== undefined) shipment.shipper_id = shipperId.value;

    for (const optionalText of [
      "origin_state",
      "destination_state",
      "goods_description",
    ] as const) {
      const coerced = coerceOptionalString(record[optionalText]);
      if (!coerced.ok) {
        return { ok: false, reason: `Malformed shipment row (${optionalText}).` };
      }
      if (coerced.value !== undefined) shipment[optionalText] = coerced.value;
    }

    for (const field of NUMERIC_ROW_FIELDS) {
      const coerced = coerceNumber(record[field], field);
      if (!coerced.ok) return { ok: false, reason: coerced.reason };
      if (coerced.value !== undefined) shipment[field] = coerced.value;
    }

    const shipper = coerceShipper(record.shipper);
    if (!shipper.ok) return { ok: false, reason: shipper.reason };
    if (shipper.shipper !== undefined) shipment.shipper = shipper.shipper;

    shipments.push(shipment);
  }
  return { ok: true, shipments };
}

// ---------------------------------------------------------------------------
// Execution — the only network call. fetchImpl injectable for network-free
// tests. Reason strings stay sanitized (HTTP status at most).
// ---------------------------------------------------------------------------

export interface SearchShipmentsDeps {
  fetchImpl?: typeof fetch;
}

export async function searchShipments(
  config: SearchShipmentsConfig,
  rawParams: unknown,
  deps: SearchShipmentsDeps = {},
): Promise<SearchShipmentsOutcome> {
  const validated = validateSearchShipmentsParams(rawParams);
  if (!validated.ok) return { ok: false, reason: validated.reason };

  const built = buildSearchShipmentsRequest(config, validated.filters);
  if (!built.ok) return { ok: false, reason: built.reason };

  const fetchImpl = deps.fetchImpl ?? fetch;
  const fetchInput: RequestInit = {
    method: built.request.method,
    headers: built.request.headers,
    signal: AbortSignal.timeout(SEARCH_SHIPMENTS_TIMEOUT_MS),
  };

  try {
    const response = await fetchImpl(built.request.url, fetchInput);
    if (!response.ok) {
      return {
        ok: false,
        reason: `Shipment search failed (HTTP ${response.status}).`,
      };
    }
    const payload: unknown = await response.json();
    const parsed = parseSearchShipmentsRows(payload);
    if (!parsed.ok) return { ok: false, reason: parsed.reason };
    return {
      ok: true,
      shipments: parsed.shipments,
      count: parsed.shipments.length,
      limit: SEARCH_SHIPMENTS_LIMIT,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, reason: "Shipment search timed out." };
    }
    return { ok: false, reason: "Shipment search failed." };
  }
}
