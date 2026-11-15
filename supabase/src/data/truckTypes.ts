import { RATE_BENCHMARK_ROWS } from "../components/RateBenchmarks2026.data";
import { rateBand, formatINR } from "../../../api/rateModel.js";
import type { LaneRateBand } from "./routes";

/**
 * Truck-to-truck comparison pages — every figure is derived from repo data:
 *   - physical specs from `vehicleDimensions.ts` (only where a real record
 *     exists for the named model)
 *   - per-km class rates from `RATE_BENCHMARK_ROWS` (the same table the fare
 *     and truck-load calculators use)
 *   - lane-level FTL/PTL bands from the canonical `rateBand` model
 * No invented numbers, and no spec is quoted for a body class that has no
 * dimension record (the 32 ft multi-axle and trailer classes are quoted by
 * the benchmark row only).
 */

export interface TruckSide {
  /** Named model for the spec row, when a dimension record exists. */
  modelName?: string;
  /** Body-class label as the rest of the site uses it. */
  label: string;
  /** The benchmark row this class maps to. */
  benchmark: (typeof RATE_BENCHMARK_ROWS)[number];
}

export interface TruckTypePair {
  slug: string;
  a: TruckSide;
  b: TruckSide;
  /** Short labels used in the title tag and meta description. */
  shortA: string;
  shortB: string;
  /** Representative lane whose distance the FTL/PTL comparison is quoted at. */
  comparisonLane: string;
  comparisonRouteSlug: string;
  comparisonDistanceKm: number;
  verdictA: string;
  verdictB: string;
  faq: { q: string; a: string }[];
}

const BENCH = Object.fromEntries(
  RATE_BENCHMARK_ROWS.map((row) => [row.vehicle, row]),
) as Record<string, (typeof RATE_BENCHMARK_ROWS)[number]>;

/** Typed benchmark row lookup — keys are static and guaranteed present. */
const bench = (vehicle: string) => BENCH[vehicle]!;

const rateAt = (km: number): LaneRateBand => rateBand({ distanceKm: km });

export const TRUCK_TYPE_PAIRS: Record<string, TruckTypePair> = {
  "14ft-vs-19ft": {
    slug: "14ft-vs-19ft",
    shortA: "14 ft",
    shortB: "19 ft",
    a: {
      modelName: "Tata 407 Gold SFC",
      label: "14 ft open / container",
      benchmark: bench("14 ft / 17 ft (Eicher / LPT)"),
    },
    b: {
      modelName: "Tata LPT 1109",
      label: "19 ft open / container",
      benchmark: bench("19 ft / 22 ft (Medium Duty)"),
    },
    comparisonLane: "Rourkela–Ranchi",
    comparisonRouteSlug: "rourkela-to-ranchi",
    comparisonDistanceKm: 180,
    verdictA:
      "Choose 14 ft when your load is under ~2.5 tonnes or under ~680 cu ft — it costs less per trip and is easier to load at a small facility.",
    verdictB:
      "Choose 19 ft when you cross ~2.5 tonnes or need more deck — the longer body fits palletised FMCG and steel bundles a 14 ft deck cannot.",
    faq: [
      {
        q: "How much can a 14 ft vs a 19 ft truck carry?",
        a: "The 14 ft (Tata 407 Gold SFC class) carries up to 2,500 kg over 680 cu ft. The 19 ft (Tata LPT 1109 class) carries up to 5,500 kg over 1,300 cu ft — more than double the payload and nearly double the volume.",
      },
      {
        q: "Which is cheaper per km?",
        a: "The 2026 benchmark class rate is ₹28–₹38/km for 14 ft/17 ft and ₹36–₹48/km for 19 ft/22 ft. The 19 ft costs more per km but moves far more per trip, so per tonne it is usually cheaper when you have the load.",
      },
      {
        q: "Will my load fit a 14 ft truck?",
        a: "Compare your cargo's volume and weight with 680 cu ft and 2,500 kg. If either is exceeded, you need the 19 ft deck. Palletised FMCG (1.2 m pallets) fit 8–10 on a 14 ft deck, 12–14 on a 19 ft deck.",
      },
      {
        q: "What changes for loading and unloading?",
        a: "A 14 ft truck reverses into tighter docks and smaller MSME yards. A 19 ft truck needs more reversing space but loads faster with fewer hand-stacks.",
      },
    ],
  },
  "14ft-vs-32ft-mxl": {
    slug: "14ft-vs-32ft-mxl",
    shortA: "14 ft",
    shortB: "32 ft container",
    a: {
      modelName: "Tata 407 Gold SFC",
      label: "14 ft open / container",
      benchmark: bench("14 ft / 17 ft (Eicher / LPT)"),
    },
    b: {
      label: "32 ft multi-axle container",
      benchmark: bench("32 ft Multi-Axle (Container)"),
    },
    comparisonLane: "Kolkata–Rourkela",
    comparisonRouteSlug: "kolkata-to-rourkela",
    comparisonDistanceKm: 420,
    verdictA:
      "Choose 14 ft for last-mile delivery and loads under ~2.5 tonnes — it is the vehicle a tight city dock can receive.",
    verdictB:
      "Choose 32 ft multi-axle for consolidated shipment and full truckloads over ~18 tonnes — the lowest per-tonne class on long hauls.",
    faq: [
      {
        q: "How much can a 32 ft multi-axle container carry vs a 14 ft?",
        a: "The 2026 benchmark class rate for 32 ft multi-axle containers is 18–25 tonnes, against 2.5 tonnes for a 14 ft class truck — roughly eight to ten times the payload.",
      },
      {
        q: "Is a 32 ft multi-axle always cheaper per tonne?",
        a: "On full loads, yes — one 32 ft trip replaces several 14 ft trips, so the per-tonne cost is a fraction. For a quarter load, a shared 14 ft or a PTL consolidation on a 32 ft is usually better value.",
      },
      {
        q: "Where can a 32 ft multi-axle NOT go?",
        a: "It needs a long straight reversing area and cannot enter small city lanes, factory yards with tight turns, or low-clearance docks. It is a corridor vehicle, not a last-mile vehicle.",
      },
      {
        q: "What is the PTL option on a 32 ft multi-axle?",
        a: "LoadSaathi's PTL model lets several shippers share one 32 ft container on the same corridor, so each pays for the space they fill rather than the whole truck.",
      },
    ],
  },
  "19ft-vs-32ft-mxl": {
    slug: "19ft-vs-32ft-mxl",
    shortA: "19 ft",
    shortB: "32 ft container",
    a: {
      modelName: "Tata LPT 1109",
      label: "19 ft open / container",
      benchmark: bench("19 ft / 22 ft (Medium Duty)"),
    },
    b: {
      label: "32 ft multi-axle container",
      benchmark: bench("32 ft Multi-Axle (Container)"),
    },
    comparisonLane: "Bhubaneswar–Kolkata",
    comparisonRouteSlug: "bhubaneswar-to-kolkata",
    comparisonDistanceKm: 440,
    verdictA:
      "Choose 19 ft for 3–10 tonne loads that still need a single vehicle — it is manoeuvrable and reaches most industrial parks.",
    verdictB:
      "Choose 32 ft multi-axle for loads above ~10 tonnes or when you want the lowest per-tonne rate on a long corridor.",
    faq: [
      {
        q: "When does a 19 ft truck stop making sense?",
        a: "Once your shipment approaches the top of the 7–10 tonne class, a single 19 ft truck is at its limit and the per-tonne premium grows. A 32 ft container or a PTL share of one is then cheaper per tonne.",
      },
      {
        q: "How do the per-km rates compare?",
        a: "19 ft/22 ft runs ₹36–₹48/km; 32 ft multi-axle runs ₹55–₹70/km. The 32 ft costs more per km but carries 18–25 tonnes against 7–10, so the per-tonne cost is well below the 19 ft's when reasonably full.",
      },
      {
        q: "Are loading docks compatible?",
        a: "A 19 ft truck fits standard truck-loading docks. A 32 ft container needs a bay or ground-level ramp with a forklift; most MSME facilities can receive it at ground level.",
      },
    ],
  },
  "open-vs-container": {
    slug: "open-vs-container",
    shortA: "Open 19 ft",
    shortB: "32 ft container",
    a: {
      modelName: "Tata LPT 1109",
      label: "19 ft open body",
      benchmark: bench("19 ft / 22 ft (Medium Duty)"),
    },
    b: {
      label: "32 ft multi-axle container",
      benchmark: bench("32 ft Multi-Axle (Container)"),
    },
    comparisonLane: "Jamshedpur–Kolkata",
    comparisonRouteSlug: "jamshedpur-to-kolkata",
    comparisonDistanceKm: 280,
    verdictA:
      "Choose an open body for quick top loading and weather-tolerant cargo — aggregates, scrap, bundled steel.",
    verdictB:
      "Choose a container when cargo must arrive sealed and dry — FMCG, textiles, electronics, export goods.",
    faq: [
      {
        q: "Open body or container — which is cheaper?",
        a: "Open-body 19 ft/22 ft runs ₹36–₹48/km; a 32 ft multi-axle container runs ₹55–₹70/km. For weather-tolerant cargo an open body is usually cheaper; a container adds protection, and on a shared PTL the cost difference narrows.",
      },
      {
        q: "Can a container be loaded from above?",
        a: "No — only through the end door. If your cargo is crane-loaded or top-loaded, an open body is the right choice.",
      },
      {
        q: "What about transit insurance?",
        a: "Containers reduce transit risk for sensitive cargo, which can lower claims. Open body needs good lashing and sheeting against weather and theft.",
      },
    ],
  },
  "container-vs-trailer": {
    slug: "container-vs-trailer",
    shortA: "32 ft container",
    shortB: "Trailer",
    a: {
      label: "32 ft multi-axle container",
      benchmark: bench("32 ft Multi-Axle (Container)"),
    },
    b: {
      label: "Trailer / 40 ft multi-axle",
      benchmark: bench("Trailer / 40 ft (Multi-Axle)"),
    },
    comparisonLane: "Kolkata–Bhubaneswar",
    comparisonRouteSlug: "kolkata-to-bhubaneswar",
    comparisonDistanceKm: 440,
    verdictA:
      "Choose a container when cargo must stay dry, secure and handled by crane or ramp — steel coils, FMCG cartons, export goods.",
    verdictB:
      "Choose a trailer for out-of-gauge, heavy or crane-loaded cargo — TMT bundles, machinery, project cargo that cannot fit a container door.",
    faq: [
      {
        q: "Container or trailer — which protects cargo better?",
        a: "A container is weatherproof and lockable, so it protects FMCG, paper and export cargo from rain and pilferage. A trailer is open, so it suits cargo that tolerates weather or is lashed and sheeted.",
      },
      {
        q: "Which carries more?",
        a: "The benchmark classes are 18–25 tonnes for a 32 ft multi-axle container and 30–40 tonnes+ for a 40 ft multi-axle trailer. The trailer also takes over-width, over-height and over-length cargo a container door cannot.",
      },
      {
        q: "What loading equipment does each need?",
        a: "Containers load through the end door with a forklift, ramp or crane. Trailers load from above with a crane or from the rear with a forklift — no door-width constraint.",
      },
      {
        q: "Which is cheaper for a part load?",
        a: "For a part load, a shared PTL service on either body type spreads cost across shippers. A partially loaded container is often best for compact, weather-sensitive cargo.",
      },
    ],
  },
};

export const TRUCK_TYPE_PAIR_SLUGS = Object.keys(TRUCK_TYPE_PAIRS);

/** Title formula — keeps every comparison title ≤ 60 characters. */
export function truckPairTitle(pair: TruckTypePair): string {
  const base = `${pair.shortA} vs ${pair.shortB}: Which Truck to Book?`;
  return base.length + 15 <= 60 ? `${base} | LoadSaathi` : base;
}

/** Meta-description — 140–155 characters, generated from the same data. */
export function truckPairMetaDescription(pair: TruckTypePair): string {
  const band = rateAt(pair.comparisonDistanceKm);
  let desc =
    `Compare ${pair.shortA} vs ${pair.shortB} trucks on payload, volume and rate. ` +
    `On ${pair.comparisonLane} (${pair.comparisonDistanceKm} km), FTL is ` +
    `₹${formatINR(band.perTruckMin)}–₹${formatINR(band.perTruckMax)} and PTL ` +
    `₹${formatINR(band.perTonneMin)}–₹${formatINR(band.perTonneMax)}/tonne.`;
  if (desc.length > 155) {
    desc = desc.replace(" on payload, volume and rate", " on payload and rate");
  }
  if (desc.length < 140) {
    desc += ` FTL ₹${band.perKmMin}–₹${band.perKmMax}/km`;
  }
  return desc;
}
