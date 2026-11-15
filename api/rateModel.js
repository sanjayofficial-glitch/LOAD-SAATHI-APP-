/**
 * rateModel.js — the canonical lane rate model, shared by every surface.
 *
 * This module is plain ESM JavaScript so it can be imported by:
 *   - the React app        (supabase/src/data/routes.ts re-exports it)
 *   - the edge function    (api/agent.js)
 *   - the build scripts    (scripts/generate-*.mjs)
 *
 * It used to live only in routes.ts, which meant the llms-routes generator
 * re-implemented the same four multiplications — a fourth copy of the
 * pricing logic, free to drift from the pages that quote it.
 *
 * Model (unchanged, so published rates do not move):
 *  - Full truck (FTL): ₹85–120 per km of road distance.
 *  - Part load (PTL): 2× the full-truck rate spread across the truck's
 *    10-tonne payload, so the PTL/FTL break-even lands at ~5 t. Floors keep
 *    short-haul bands credible.
 */

/** Single stamp for every published rate band. */
export const RATES_UPDATED_AT = "2026-10-01";
export const RATES_UPDATED_LABEL = "October 2026";

/**
 * @param {{ distanceKm: number }} route
 * @returns {{ perTonneMin: number, perTonneMax: number, perTruckMin: number,
 *             perTruckMax: number, perKmMin: number, perKmMax: number,
 *             perKgMin: number, perKgMax: number }}
 */
export function rateBand(route) {
  const km = route.distanceKm;
  const perTruckMin = km * 85;
  const perTruckMax = km * 120;
  const perTonneMin = Math.max(km * 17, 1200);
  const perTonneMax = Math.max(km * 24, 1500);
  return {
    perTonneMin,
    perTonneMax,
    perTruckMin,
    perTruckMax,
    perKmMin: 85,
    perKmMax: 120,
    perKgMin: Math.round((perTonneMin / 1000) * 100) / 100,
    perKgMax: Math.round((perTonneMax / 1000) * 100) / 100,
  };
}

/** ₹ formatting, Indian digit grouping (₹15,300 / ₹1,23,456). */
export function formatINR(n) {
  return Math.round(n).toLocaleString("en-IN");
}

/** Indian digit grouping without the currency symbol (for plain-text files). */
export function groupINR(n) {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return parts.join(",") + "," + last3;
}
