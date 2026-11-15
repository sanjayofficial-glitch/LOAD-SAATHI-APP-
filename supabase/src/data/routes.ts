import rawRouteData from "../../../api/routeData.json";

export type RouteDataStatus = "verified" | "corrected" | "needs_review";

export interface RouteInfo {
  slug: string;
  from: string;
  to: string;
  fromState: string;
  toState: string;
  /** VERIFIED road distance only — see dataStatus for per-lane verification state. */
  distanceKm: number;
  /** Hours as a plain numeric string (never ranges — ranges break rate/time math). */
  transitTime: string;
  description: string;
  keywords: string;
  /** Highway designation — present only where verified against road routing. */
  highway?: string;
  /** Verification state of the published distance/transit figures. */
  dataStatus: RouteDataStatus;
  /** What typically ships on this lane (rendered as "What moves on this lane"). */
  commodities: string[];
}

export interface LaneRateBand {
  /** PTL part-load band, per tonne */
  perTonneMin: number;
  perTonneMax: number;
  /** FTL full-truck band, per trip */
  perTruckMin: number;
  perTruckMax: number;
  /** Full-truck band normalised per km */
  perKmMin: number;
  perKmMax: number;
  /** PTL band, per kg (derived from the per-tonne band) */
  perKgMin: number;
  perKgMax: number;
}

/**
 * Canonical rate model — the ONLY place lane prices are derived from.
 *
 * The implementation lives in `api/rateModel.js` so the React app, the edge
 * function and the build scripts all derive prices the same way. It used to
 * live here alone, which is how the llms-routes generator ended up with a
 * second copy of the same four multiplications.
 *
 * Model:
 *  - Full truck (FTL): ₹85–120 per km of road distance (unchanged from the
 *    historically published figures, e.g. Rourkela–Ranchi 180 km → ₹15,300–21,600).
 *  - Part load (PTL): 2× the full-truck rate spread across the truck's
 *    10-tonne payload → the break-even vs FTL lands at ~5 t, so PTL is
 *    cheaper below that and FTL above it. Floors keep short-haul bands
 *    credible (cf. competitors publishing ~₹960/tonne on the 30 km
 *    Cuttack–Bhubaneswar lane).
 */
export {
  rateBand,
  formatINR,
  RATES_UPDATED_AT,
  RATES_UPDATED_LABEL,
} from "../../../api/rateModel.js";
// Local bindings for this module's own formulas (a re-export alone does not
// bring the names into scope).
import { rateBand, formatINR, RATES_UPDATED_LABEL } from "../../../api/rateModel.js";

/** Title-tag formula — identical for every lane, generated from lane data. */
export function laneTitle(route: Pick<RouteInfo, "from" | "to">): string {
  const base = `${route.from} to ${route.to} Truck Freight | PTL/LTL`;
  return base.length + 15 <= 60 ? `${base} | LoadSaathi` : base;
}

/**
 * Meta-description formula — generated from the SAME fields as the page body
 * (distance, transit, rate band, rate stamp), so meta and body can never
 * disagree. Needs-review lanes do not claim "Verified".
 */
export function laneMetaDescription(
  route: Pick<RouteInfo, "from" | "to" | "distanceKm" | "transitTime" | "dataStatus">
): string {
  const bands = rateBand(route as RouteInfo);
  const statusPart =
    route.dataStatus === "needs_review"
      ? `Est. ${route.distanceKm} km, ~${route.transitTime} hrs driving (indicative — confirm at booking)`
      : `Verified ${route.distanceKm} km, ~${route.transitTime} hrs`;
  return (
    `${statusPart}. Book part load, PTL & LTL trucks ${route.from} to ${route.to}. ` +
    `Rates from ₹${formatINR(bands.perTonneMin)}/tonne. Updated ${RATES_UPDATED_LABEL}.`
  );
}

/** Opposite-direction lane, when published. */
export function findReverse(
  route: Pick<RouteInfo, "from" | "to">,
  all: RouteInfo[] = routes
): RouteInfo | undefined {
  return all.find((r) => r.from === route.to && r.to === route.from);
}

/**
 * Canonical lane table.
 *
 * The data lives in `api/routeData.json` so the edge function
 * (api/agent.js) and this app read the SAME numbers. It was previously
 * duplicated in both places and hand-synced, which is how a lane ended up
 * quoting one distance on the page and a different one in the schema, the
 * fare calculator and the rate guide. One file removes the possibility.
 */
export const routes: RouteInfo[] = Object.values(
  rawRouteData as unknown as Record<string, RouteInfo>,
);
