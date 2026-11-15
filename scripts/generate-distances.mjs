#!/usr/bin/env node
/**
 * Regenerates supabase/src/data/distances.json from the canonical lane table
 * (api/routeData.json).
 *
 * Why this exists: distances.json used to be a raw OSRM snapshot while the
 * route pages used the human-corrected figures in the lane table. The two
 * disagreed on 16 of 46 shared corridors, so the fare calculator and the
 * route page could quote different distances for the same lane.
 *
 * The canonical lane table wins. The raw OSRM value is kept as
 * `osrmDistanceKm` (only where it differed) so the correction stays auditable,
 * and `highway` is carried over from the OSRM routing snapshot because only it
 * knows the road designation for every corridor.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const canonicalPath = path.join(ROOT, "api/routeData.json");
const outPath = path.join(ROOT, "supabase/src/data/distances.json");

const canonical = JSON.parse(fs.readFileSync(canonicalPath, "utf8"));

// Previous OSRM snapshot — read before overwriting, if present.
let osrm = { routes: {} };
if (fs.existsSync(outPath)) {
  try {
    osrm = JSON.parse(fs.readFileSync(outPath, "utf8"));
  } catch {
    osrm = { routes: {} };
  }
}
const osrmRoutes = osrm.routes ?? {};

const routes = {};
let reconciled = 0;
let highwaysKept = 0;

// The OSRM snapshot keys lanes as "{from}-{to}"; the canonical lane table
// uses "{from}-to-{to}". Map between the two when looking up the baseline,
// and fall back to the reverse direction (distance is symmetric).
const osrmKeyFor = (slug) => slug.replace("-to-", "-");
const reverseSlug = (slug) => {
  const i = slug.indexOf("-to-");
  return `${slug.slice(i + 4)}-to-${slug.slice(0, i)}`;
};

for (const [slug, r] of Object.entries(canonical)) {
  const base =
    osrmRoutes[slug] ??
    osrmRoutes[osrmKeyFor(slug)] ??
    osrmRoutes[osrmKeyFor(reverseSlug(slug))] ??
    osrmRoutes[reverseSlug(slug)];
  const entry = {
    distanceKm: r.distanceKm,
    transitHours: Number(r.transitTime),
    dataStatus: r.dataStatus,
  };
  const highway = r.highway ?? base?.highway;
  if (highway) {
    entry.highway = highway;
    if (base?.highway) highwaysKept++;
  }
  if (base && Number(base.distanceKm) !== r.distanceKm) {
    entry.osrmDistanceKm = Number(base.distanceKm);
    reconciled++;
  }
  routes[slug] = entry;
}

const out = {
  meta: {
    source: "LoadSaathi canonical lane table (api/routeData.json)",
    generated: new Date().toISOString().slice(0, 10),
    note:
      "distanceKm/transitHours are the published (human-corrected) figures from the canonical lane table. osrmDistanceKm records the raw OSRM baseline where it differed, for audit only. highway comes from the OSRM routing snapshot.",
  },
  routes,
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(
  `[distances] wrote ${Object.keys(routes).length} lanes (${reconciled} reconciled against OSRM, ${highwaysKept} highways carried over)`,
);
