// Freddy zero-result recovery — relaxed-scope suggestions (server-side).
//
// When a strict search (search_market / search_shipments) returns nothing,
// the agent-router probes a few relaxed scopes so the user can broaden instead
// of hitting a dead end:
//   route      → same origin+destination, all constraints dropped
//   origin     → same origin, any destination
//   destination→ same destination, any origin
//   all        → the marketplace as a whole
//
// Security/posture mirrors searchMarket.ts / searchShipments.ts:
// - Count probes go through the caller's verified JWT + anon apikey under RLS
//   (never service-role), GET-only, `select=id`, `limit=1`, and read the total
//   from the Content-Range header — no rows are ever returned to the client
//   beyond the labels the router chooses to surface.
// - Filter values pass the same ilike-escaping discipline as the tools.
// - Probe failures degrade to count 0 (suggestion simply not offered).
// - Pure builders are network-free and unit-testable; the only IO lives in
//   probeMarketAvailability / probeShipmentAvailability.

import type { SearchMarketFilters, SearchMarketConfig } from "./searchMarket.ts";
import type { SearchShipmentsFilters, SearchShipmentsConfig } from "./searchShipments.ts";

export interface SearchSuggestion {
  label: string;
  query: string;
}

export interface SuggestionProbe<T> {
  key: string;
  filters: Partial<T>;
  label: (count: number) => string;
  query: string;
}

export const SUGGESTION_MAX = 3;
export const SUGGESTION_TIMEOUT_MS = 6_000;

function escapeLike(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
}

/** Pure builder of relaxed-scope probes for the market (trips) search. */
export function buildMarketProbes(
  filters: SearchMarketFilters,
): SuggestionProbe<SearchMarketFilters>[] {
  const probes: SuggestionProbe<SearchMarketFilters>[] = [];
  if (filters.origin && filters.destination) {
    probes.push({
      key: "route",
      filters: { origin: filters.origin, destination: filters.destination },
      label: (n) => `${n} truck${n === 1 ? "" : "s"} on ${filters.origin} → ${filters.destination}`,
      query: `find trucks from ${filters.origin} to ${filters.destination}`,
    });
  }
  if (filters.origin) {
    probes.push({
      key: "origin",
      filters: { origin: filters.origin },
      label: (n) => `${n} truck${n === 1 ? "" : "s"} leaving ${filters.origin}`,
      query: `find trucks from ${filters.origin}`,
    });
  }
  if (filters.destination) {
    probes.push({
      key: "destination",
      filters: { destination: filters.destination },
      label: (n) => `${n} truck${n === 1 ? "" : "s"} heading to ${filters.destination}`,
      query: `find trucks to ${filters.destination}`,
    });
  }
  probes.push({
    key: "all",
    filters: {},
    label: (n) => `${n} active truck${n === 1 ? "" : "s"} across the marketplace`,
    query: "find trucks across the marketplace",
  });
  return probes;
}

/** Pure builder of relaxed-scope probes for the shipment (trucker) search. */
export function buildShipmentProbes(
  filters: SearchShipmentsFilters,
): SuggestionProbe<SearchShipmentsFilters>[] {
  const probes: SuggestionProbe<SearchShipmentsFilters>[] = [];
  if (filters.origin && filters.destination) {
    probes.push({
      key: "route",
      filters: { origin: filters.origin, destination: filters.destination },
      label: (n) => `${n} open shipment${n === 1 ? "" : "s"} on ${filters.origin} → ${filters.destination}`,
      query: `find shipments from ${filters.origin} to ${filters.destination}`,
    });
  }
  if (filters.origin) {
    probes.push({
      key: "origin",
      filters: { origin: filters.origin },
      label: (n) => `${n} open shipment${n === 1 ? "" : "s"} from ${filters.origin}`,
      query: `find shipments from ${filters.origin}`,
    });
  }
  if (filters.destination) {
    probes.push({
      key: "destination",
      filters: { destination: filters.destination },
      label: (n) => `${n} open shipment${n === 1 ? "" : "s"} heading to ${filters.destination}`,
      query: `find shipments to ${filters.destination}`,
    });
  }
  probes.push({
    key: "all",
    filters: {},
    label: (n) => `${n} open shipment${n === 1 ? "" : "s"} across the marketplace`,
    query: "find shipments across the marketplace",
  });
  return probes;
}

/** Select the best (non-empty) suggestions, capped at `max`. */
export function buildSuggestions<T>(
  probes: SuggestionProbe<T>[],
  counts: Map<string, number>,
  max = SUGGESTION_MAX,
): SearchSuggestion[] {
  const out: SearchSuggestion[] = [];
  for (const probe of probes) {
    const count = counts.get(probe.key) ?? 0;
    if (count > 0) out.push({ label: probe.label(count), query: probe.query });
    if (out.length >= max) break;
  }
  return out;
}

/** Parse a `Content-Range: 0-0/N` header into N. Pure and unit-testable. */
export function parseContentRangeCount(contentRange: string | null): number {
  if (!contentRange) return 0;
  const match = contentRange.match(/\/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

async function fetchCount(
  baseUrl: string,
  table: "trips" | "shipments",
  statuses: readonly string[],
  params: Record<string, string>,
  token: string,
  anonKey: string,
  fetchImpl: typeof fetch,
): Promise<number> {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  url.searchParams.set("select", "id");
  url.searchParams.set("status", `in.(${statuses.map((s) => `"${s}"`).join(",")})`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("limit", "1");

  const res = await fetchImpl(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      Prefer: "count=exact",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(SUGGESTION_TIMEOUT_MS),
  });
  if (!res.ok) return 0;
  return parseContentRangeCount(res.headers.get("content-range"));
}

/**
 * Probe relaxed scopes for the market (trips) search. One count GET per probe;
 * every failure degrades to 0. Returns a map keyed by probe key.
 */
export async function probeMarketAvailability(
  config: SearchMarketConfig,
  probes: SuggestionProbe<SearchMarketFilters>[],
  fetchImpl: typeof fetch = fetch,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const probe of probes) {
    const params: Record<string, string> = {};
    if (probe.filters.origin) {
      params.origin_city = `ilike.%${escapeLike(probe.filters.origin)}%`;
    }
    if (probe.filters.destination) {
      params.destination_city = `ilike.%${escapeLike(probe.filters.destination)}%`;
    }
    try {
      const n = await fetchCount(
        config.baseUrl,
        "trips",
        ["active", "in_transit"],
        params,
        config.userJwt,
        config.anonKey,
        fetchImpl,
      );
      counts.set(probe.key, n);
    } catch {
      counts.set(probe.key, 0);
    }
  }
  return counts;
}

/** Probe relaxed scopes for the shipment search (trucker side). */
export async function probeShipmentAvailability(
  config: SearchShipmentsConfig,
  probes: SuggestionProbe<SearchShipmentsFilters>[],
  fetchImpl: typeof fetch = fetch,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const probe of probes) {
    const params: Record<string, string> = {};
    if (probe.filters.origin) {
      params.origin_city = `ilike.%${escapeLike(probe.filters.origin)}%`;
    }
    if (probe.filters.destination) {
      params.destination_city = `ilike.%${escapeLike(probe.filters.destination)}%`;
    }
    try {
      const n = await fetchCount(
        config.baseUrl,
        "shipments",
        ["pending"],
        params,
        config.userJwt,
        config.anonKey,
        fetchImpl,
      );
      counts.set(probe.key, n);
    } catch {
      counts.set(probe.key, 0);
    }
  }
  return counts;
}
