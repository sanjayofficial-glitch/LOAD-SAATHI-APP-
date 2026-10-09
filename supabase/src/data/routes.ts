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

/**
 * Single stamp for every published rate band. Update when rates are re-checked
 * so the "Rates updated" line on meta descriptions and pages stays honest.
 */
export const RATES_UPDATED_AT = "2026-10-01";
export const RATES_UPDATED_LABEL = "October 2026";

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
 * Every surface (meta description, hero snippet, FAQ, comparison table,
 * JSON-LD offers) must read from this function so the page can never
 * contradict itself on units the way the old template did (per-kg band
 * implying ₹14–22/kg while the full-truck band implied ~₹1.5–2/kg for the
 * same lane).
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
export function rateBand(route: Pick<RouteInfo, "distanceKm">): LaneRateBand {
  const perTruckMin = route.distanceKm * 85;
  const perTruckMax = route.distanceKm * 120;
  const perTonneMin = Math.max(route.distanceKm * 17, 1200);
  const perTonneMax = Math.max(route.distanceKm * 24, 1500);
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
export function formatINR(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

/** Title-tag formula — identical for every lane, generated from lane data. */
export function laneTitle(route: Pick<RouteInfo, "from" | "to">): string {
  return `Part Load Transport ${route.from} to ${route.to} | PTL & LTL Truck Booking`;
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
      ? `${route.distanceKm} km, ~${route.transitTime} hrs (distance pending re-verification)`
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

export const routes: RouteInfo[] = [
  {
    slug: "rourkela-to-ranchi",
    from: "Rourkela",
    to: "Ranchi",
    fromState: "Odisha",
    toState: "Jharkhand",
    distanceKm: 180,
    transitTime: "4",
    dataStatus: "needs_review",
    description:
      "Connect the steel city of Odisha with the capital of Jharkhand via LoadSaathi's AI-powered freight marketplace. Book PTL and LTL truck loads on the Rourkela–Ranchi corridor with GPS tracking, transparent pricing, and digital credit scores.",
    keywords:
      "PTL freight Rourkela to Ranchi, LTL transport Rourkela Ranchi, part load Rourkela to Ranchi, truck booking Rourkela Jharkhand, shared freight Odisha Jharkhand, LoadSaathi Rourkela Ranchi",
    commodities: ["Steel products", "Industrial machinery", "Cement", "FMCG goods"],
  },
  {
    slug: "ranchi-to-rourkela",
    from: "Ranchi",
    to: "Rourkela",
    fromState: "Jharkhand",
    toState: "Odisha",
    distanceKm: 180,
    transitTime: "4",
    dataStatus: "needs_review",
    description:
      "Ship goods from the capital of Jharkhand to the steel hub of Odisha. Find returning trucks and competitive rates on the Ranchi–Rourkela route with LoadSaathi's real-time matching and transparent pricing.",
    keywords:
      "part load Ranchi to Rourkela, PTL freight Ranchi to Rourkela, LTL transport Ranchi Rourkela, truck booking Jharkhand Odisha, return load Ranchi Rourkela, freight transport Ranchi",
    commodities: ["Agricultural products", "Machinery parts", "Packaged food", "Textiles"],
  },
  {
    slug: "rourkela-to-jamshedpur",
    from: "Rourkela",
    to: "Jamshedpur",
    fromState: "Odisha",
    toState: "Jharkhand",
    distanceKm: 198,
    transitTime: "4.5",
    dataStatus: "corrected",
    highway: "NH-220",
    description:
      "Move freight between two of India's largest steel cities. LoadSaathi connects Rourkela and Jamshedpur with AI-matched PTL and LTL trucks, real-time tracking, and competitive rates.",
    keywords:
      "part load Rourkela to Jamshedpur, PTL freight Rourkela to Jamshedpur, LTL transport Rourkela Jamshedpur, truck booking Rourkela Jharkhand, steel corridor freight, Rourkela Jamshedpur load",
    commodities: ["Steel coils", "Iron ore", "Industrial equipment", "Automobile parts"],
  },
  {
    slug: "jamshedpur-to-rourkela",
    from: "Jamshedpur",
    to: "Rourkela",
    fromState: "Jharkhand",
    toState: "Odisha",
    distanceKm: 198,
    transitTime: "4.5",
    dataStatus: "corrected",
    highway: "NH-220",
    description:
      "Find efficient PTL and LTL freight from Jamshedpur to Rourkela. Leverage LoadSaathi's returning trucks and AI matching for cost-effective shipping on this key industrial corridor.",
    keywords:
      "part load Jamshedpur to Rourkela, PTL freight Jamshedpur to Rourkela, LTL transport Jamshedpur Rourkela, truck booking Jharkhand Odisha, Jamshedpur Rourkela load, return load Jamshedpur Rourkela",
    commodities: ["Steel products", "Automobile components", "Machinery", "Chemicals"],
  },
  {
    slug: "rourkela-to-bhubaneswar",
    from: "Rourkela",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 340,
    transitTime: "7",
    dataStatus: "needs_review",
    description:
      "Reliable PTL and LTL freight from Rourkela to Bhubaneswar — the capital of Odisha. LoadSaathi connects these key Odisha cities with AI-optimized truck matching and live GPS tracking.",
    keywords:
      "part load Rourkela to Bhubaneswar, PTL freight Rourkela to Bhubaneswar, LTL transport Rourkela Bhubaneswar, Odisha freight, truck booking Rourkela Bhubaneswar, part load Bhubaneswar",
    commodities: ["Steel products", "Consumer electronics", "Textiles", "Packaged goods"],
  },
  {
    slug: "rourkela-to-burdwan",
    from: "Rourkela",
    to: "Burdwan",
    fromState: "Odisha",
    toState: "West Bengal",
    distanceKm: 320,
    transitTime: "7",
    dataStatus: "needs_review",
    description:
      "Seamless PTL and LTL freight from Rourkela to Burdwan (Bardhaman) across the Odisha–West Bengal border. LoadSaathi's platform handles cross-state logistics with AI matching and transparent pricing.",
    keywords:
      "part load Rourkela to Burdwan, PTL freight Rourkela to Burdwan, Rourkela to Bardhaman part load, LTL transport Rourkela Burdwan, Odisha West Bengal freight, truck booking Burdwan",
    commodities: ["Steel products", "Industrial goods", "Agricultural produce", "Chemicals"],
  },
  {
    slug: "rourkela-to-kolkata",
    from: "Rourkela",
    to: "Kolkata",
    fromState: "Odisha",
    toState: "West Bengal",
    distanceKm: 420,
    transitTime: "8.8",
    dataStatus: "corrected",
    description:
      "Ship PTL and LTL loads from Rourkela to Kolkata — the commercial capital of East India. LoadSaathi offers AI-matched trucks, real-time tracking, and competitive rates on this busy corridor.",
    keywords:
      "part load Rourkela to Kolkata, PTL freight Rourkela to Kolkata, LTL transport Rourkela Kolkata, truck booking Kolkata, Odisha West Bengal logistics, Kolkata freight corridor",
    commodities: ["Steel products", "Minerals", "FMCG goods", "Industrial machinery"],
  },
  {
    slug: "ranchi-to-jamshedpur",
    from: "Ranchi",
    to: "Jamshedpur",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 130,
    transitTime: "3",
    dataStatus: "verified",
    description:
      "Fast and reliable PTL and LTL freight between two of Jharkhand's largest cities. LoadSaathi connects Ranchi and Jamshedpur with AI-matched trucks and real-time GPS tracking.",
    keywords:
      "part load Ranchi to Jamshedpur, PTL freight Ranchi to Jamshedpur, LTL transport Ranchi Jamshedpur, Jharkhand freight, truck booking Ranchi Jamshedpur, intra-state trucking Jharkhand",
    commodities: ["Consumer goods", "Automobile parts", "Electronics", "Textiles"],
  },
  {
    slug: "jamshedpur-to-ranchi",
    from: "Jamshedpur",
    to: "Ranchi",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 130,
    transitTime: "3",
    dataStatus: "verified",
    description:
      "Efficient PTL and LTL freight from Jamshedpur to Ranchi. LoadSaathi helps you find the right truck at the right price with AI matching and transparent booking on this Jharkhand corridor.",
    keywords:
      "part load Jamshedpur to Ranchi, PTL freight Jamshedpur to Ranchi, LTL transport Jamshedpur Ranchi, Jharkhand freight, truck booking Jamshedpur Ranchi, Jamshedpur logistics",
    commodities: ["Steel products", "Machinery", "Packaged food", "Construction materials"],
  },
  {
    slug: "ranchi-to-bhubaneswar",
    from: "Ranchi",
    to: "Bhubaneswar",
    fromState: "Jharkhand",
    toState: "Odisha",
    distanceKm: 470,
    transitTime: "9.8",
    dataStatus: "corrected",
    highway: "NH-20",
    description:
      "Cross-state PTL and LTL freight from Ranchi to Bhubaneswar via the NH-20 corridor. LoadSaathi's AI platform matches your shipment with the best trucks for this inter-state route.",
    keywords:
      "part load Ranchi to Bhubaneswar, PTL freight Ranchi to Bhubaneswar, LTL transport Ranchi Bhubaneswar, Jharkhand Odisha freight, truck booking Bhubaneswar, NH-20 freight corridor",
    commodities: ["Industrial goods", "Machinery", "Agricultural produce", "Consumer electronics"],
  },
  {
    slug: "ranchi-to-kolkata",
    from: "Ranchi",
    to: "Kolkata",
    fromState: "Jharkhand",
    toState: "West Bengal",
    distanceKm: 420,
    transitTime: "8",
    dataStatus: "needs_review",
    description:
      "Ship PTL and LTL loads from Ranchi to Kolkata across Jharkhand and West Bengal. LoadSaathi's AI matching and real-time GPS tracking make this key cross-state route simple and transparent.",
    keywords:
      "part load Ranchi to Kolkata, PTL freight Ranchi to Kolkata, LTL transport Ranchi Kolkata, truck booking Kolkata, Jharkhand West Bengal logistics, Ranchi Kolkata freight",
    commodities: ["Minerals", "Steel products", "FMCG goods", "Agricultural products"],
  },
  {
    slug: "jamshedpur-to-bhubaneswar",
    from: "Jamshedpur",
    to: "Bhubaneswar",
    fromState: "Jharkhand",
    toState: "Odisha",
    distanceKm: 347,
    transitTime: "7",
    dataStatus: "corrected",
    highway: "NH-220 / NH-16",
    description:
      "Book part load, PTL and LTL freight from Jamshedpur to Bhubaneswar on the NH-220 / NH-16 corridor. LoadSaathi's AI matching connects Jharkhand's steel hub with Odisha's capital with transparent pricing and live GPS tracking.",
    keywords:
      "part load Jamshedpur to Bhubaneswar, PTL freight Jamshedpur to Bhubaneswar, LTL transport Jamshedpur Bhubaneswar, Jharkhand Odisha freight, truck booking Bhubaneswar, steel transport Bhubaneswar",
    commodities: ["Steel products", "Iron ore", "Machinery", "Chemicals"],
  },
  {
    slug: "jamshedpur-to-burdwan",
    from: "Jamshedpur",
    to: "Burdwan",
    fromState: "Jharkhand",
    toState: "West Bengal",
    distanceKm: 200,
    transitTime: "4",
    dataStatus: "needs_review",
    description:
      "Cross-state PTL and LTL shipping from Jamshedpur to Burdwan (Bardhaman). LoadSaathi makes it easy to ship across the Jharkhand–West Bengal border with AI matching and live tracking.",
    keywords:
      "part load Jamshedpur to Burdwan, PTL freight Jamshedpur to Burdwan, Jamshedpur to Bardhaman part load, LTL transport Jamshedpur Burdwan, Jharkhand West Bengal freight, truck booking Burdwan",
    commodities: ["Steel products", "Agricultural produce", "Machinery", "Consumer goods"],
  },
  {
    slug: "jamshedpur-to-kolkata",
    from: "Jamshedpur",
    to: "Kolkata",
    fromState: "Jharkhand",
    toState: "West Bengal",
    distanceKm: 280,
    transitTime: "6",
    dataStatus: "needs_review",
    description:
      "Ship PTL and LTL loads from Jamshedpur to Kolkata efficiently. This busy industrial-to-commercial corridor is a key route on LoadSaathi's AI-powered freight matching network.",
    keywords:
      "part load Jamshedpur to Kolkata, PTL freight Jamshedpur to Kolkata, LTL transport Jamshedpur Kolkata, truck booking Kolkata, Jharkhand West Bengal logistics, Jamshedpur Kolkata freight",
    commodities: ["Steel products", "Automobile parts", "FMCG goods", "Industrial machinery"],
  },
  {
    slug: "bhubaneswar-to-kolkata",
    from: "Bhubaneswar",
    to: "Kolkata",
    fromState: "Odisha",
    toState: "West Bengal",
    distanceKm: 440,
    transitTime: "8",
    dataStatus: "verified",
    description:
      "Major PTL and LTL freight corridor connecting the capital of Odisha with the commercial capital of East India. LoadSaathi offers competitive rates and reliable trucking on this busy route.",
    keywords:
      "part load Bhubaneswar to Kolkata, PTL freight Bhubaneswar to Kolkata, LTL transport Bhubaneswar Kolkata, Odisha West Bengal freight, truck booking Kolkata, Bhubaneswar logistics",
    commodities: ["Minerals", "Agricultural products", "Consumer electronics", "Textiles"],
  },
  {
    slug: "bhubaneswar-to-burdwan",
    from: "Bhubaneswar",
    to: "Burdwan",
    fromState: "Odisha",
    toState: "West Bengal",
    distanceKm: 420,
    transitTime: "8",
    dataStatus: "needs_review",
    description:
      "Cost-effective PTL and LTL freight from Bhubaneswar to Burdwan (Bardhaman). LoadSaathi's AI matches your shipment with the most suitable trucks on this cross-state Odisha–Bengal route.",
    keywords:
      "part load Bhubaneswar to Burdwan, PTL freight Bhubaneswar to Burdwan, Bhubaneswar to Bardhaman part load, LTL transport Bhubaneswar Burdwan, Odisha West Bengal freight, truck booking Burdwan",
    commodities: ["Minerals", "Agricultural products", "Industrial goods", "Consumer products"],
  },
  {
    slug: "rourkela-to-sambalpur",
    from: "Rourkela",
    to: "Sambalpur",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 120,
    transitTime: "2.5",
    dataStatus: "needs_review",
    description:
      "Quick and reliable PTL and LTL freight from Rourkela to Sambalpur within Odisha. LoadSaathi's AI matches local truckers to your shipment for fast, cost-effective delivery.",
    keywords:
      "part load Rourkela to Sambalpur, PTL freight Rourkela to Sambalpur, LTL transport Rourkela Sambalpur, Odisha freight, truck booking Sambalpur, intra-Odisha logistics",
    commodities: ["Steel products", "Cement", "Industrial goods", "FMCG"],
  },
  {
    slug: "ranchi-to-dhanbad",
    from: "Ranchi",
    to: "Dhanbad",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 155,
    transitTime: "4",
    dataStatus: "corrected",
    description:
      "Efficient PTL and LTL freight from Ranchi to Dhanbad within Jharkhand. LoadSaathi connects Jharkhand's capital with its coal mining hub for seamless intra-state logistics.",
    keywords:
      "part load Ranchi to Dhanbad, PTL freight Ranchi to Dhanbad, LTL transport Ranchi Dhanbad, Jharkhand freight, truck booking Dhanbad, coal corridor logistics Jharkhand",
    commodities: ["Mining equipment", "Industrial machinery", "Consumer goods", "Construction materials"],
  },
  {
    slug: "bhubaneswar-to-vizag",
    from: "Bhubaneswar",
    to: "Visakhapatnam",
    fromState: "Odisha",
    toState: "Andhra Pradesh",
    distanceKm: 445,
    transitTime: "7",
    dataStatus: "corrected",
    description:
      "Coastal corridor PTL and LTL freight from Bhubaneswar to Visakhapatnam (Vizag). LoadSaathi's AI platform streamlines cross-state shipping along the East Coast with real-time tracking and fair pricing.",
    keywords:
      "part load Bhubaneswar to Visakhapatnam, PTL freight Bhubaneswar to Visakhapatnam, LTL transport Bhubaneswar Vizag, Odisha Andhra Pradesh freight, truck booking Vizag, coastal corridor logistics",
    commodities: ["Minerals", "Steel products", "Agricultural produce", "Consumer goods"],
  },
  {
    slug: "balasore-to-bhubaneswar",
    from: "Balasore",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 210,
    transitTime: "4",
    dataStatus: "needs_review",
    highway: "NH-16",
    description:
      "Fast PTL and LTL freight from Balasore to Bhubaneswar within Odisha. LoadSaathi helps you find trucks quickly on this busy NH-16 corridor with AI matching and live GPS tracking.",
    keywords:
      "part load Balasore to Bhubaneswar, PTL freight Balasore to Bhubaneswar, LTL transport Balasore Bhubaneswar, Odisha freight, truck booking Balasore, NH-16 logistics Odisha",
    commodities: ["Agricultural produce", "Fish products", "Textiles", "Consumer goods"],
  },
  {
    slug: "berhampur-to-bhubaneswar",
    from: "Berhampur",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 180,
    transitTime: "4",
    dataStatus: "needs_review",
    description:
      "Reliable PTL and LTL freight from Berhampur (Brahmapur) to Bhubaneswar. Connect southern Odisha to the capital with LoadSaathi's AI-optimized truck matching.",
    keywords:
      "part load Berhampur to Bhubaneswar, PTL freight Berhampur to Bhubaneswar, LTL transport Brahmapur Bhubaneswar, Odisha freight, truck booking Berhampur, southern Odisha logistics",
    commodities: ["Agricultural products", "Fish", "Textiles", "Handicrafts"],
  },
  {
    slug: "dhanbad-to-jamshedpur",
    from: "Dhanbad",
    to: "Jamshedpur",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 145,
    transitTime: "3.7",
    dataStatus: "corrected",
    description:
      "Move freight between Jharkhand's coal hub and its steel city. LoadSaathi connects Dhanbad and Jamshedpur with AI-matched PTL and LTL trucks for efficient intra-state logistics.",
    keywords:
      "part load Dhanbad to Jamshedpur, PTL freight Dhanbad to Jamshedpur, LTL transport Dhanbad Jamshedpur, Jharkhand freight, truck booking Dhanbad Jamshedpur, coal steel corridor logistics",
    commodities: ["Coal", "Mining equipment", "Steel products", "Industrial machinery"],
  },
  {
    slug: "kolkata-to-burdwan",
    from: "Kolkata",
    to: "Burdwan",
    fromState: "West Bengal",
    toState: "West Bengal",
    distanceKm: 110,
    transitTime: "2.5",
    dataStatus: "needs_review",
    description:
      "Quick PTL and LTL freight from Kolkata to Burdwan (Bardhaman) within West Bengal. LoadSaathi's network of local truckers ensures fast, affordable shipping on this busy intrastate route.",
    keywords:
      "part load Kolkata to Burdwan, PTL freight Kolkata to Burdwan, Kolkata to Bardhaman part load, LTL transport Kolkata Burdwan, West Bengal freight, truck booking Burdwan",
    commodities: ["Consumer goods", "Textiles", "Agricultural produce", "Electronics"],
  },
  {
    slug: "sambalpur-to-jharsuguda",
    from: "Sambalpur",
    to: "Jharsuguda",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 50,
    transitTime: "1.5",
    dataStatus: "corrected",
    description:
      "Short-haul PTL and LTL freight from Sambalpur to Jharsuguda in western Odisha. LoadSaathi connects these industrial towns with quick, affordable trucking solutions.",
    keywords:
      "part load Sambalpur to Jharsuguda, PTL freight Sambalpur to Jharsuguda, LTL transport Sambalpur Jharsuguda, Odisha freight, truck booking Jharsuguda, western Odisha logistics",
    commodities: ["Mining equipment", "Industrial goods", "Agricultural produce", "Cement"],
  },
  {
    slug: "cuttack-to-bhubaneswar",
    from: "Cuttack",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 30,
    transitTime: "1",
    dataStatus: "needs_review",
    description:
      "Quick PTL and LTL freight from Cuttack to Bhubaneswar — the twin cities of Odisha. LoadSaathi's local trucker network ensures fast, affordable intrastate shipping on this high-traffic corridor.",
    keywords:
      "part load Cuttack to Bhubaneswar, PTL freight Cuttack to Bhubaneswar, LTL transport Cuttack Bhubaneswar, Odisha intrastate freight, truck booking Cuttack Bhubaneswar",
    commodities: ["Consumer goods", "Textiles", "Food products", "Electronics"],
  },
  {
    slug: "cuttack-to-rourkela",
    from: "Cuttack",
    to: "Rourkela",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 300,
    transitTime: "6.4",
    dataStatus: "corrected",
    description:
      "PTL and LTL freight from Cuttack to Rourkela within Odisha. Connect the coastal trading hub with the steel city via LoadSaathi's AI-matched trucks and transparent pricing.",
    keywords:
      "part load Cuttack to Rourkela, PTL freight Cuttack to Rourkela, LTL transport Cuttack Rourkela, Odisha freight, truck booking Cuttack Rourkela, coastal to western Odisha",
    commodities: ["Textiles", "Consumer goods", "Food products", "Industrial materials"],
  },
  {
    slug: "sambalpur-to-bhubaneswar",
    from: "Sambalpur",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 350,
    transitTime: "7",
    dataStatus: "needs_review",
    description:
      "PTL and LTL freight from Sambalpur to Bhubaneswar — connecting western Odisha's industrial belt with the state capital. LoadSaathi offers AI-matched trucks and fair pricing.",
    keywords:
      "part load Sambalpur to Bhubaneswar, PTL freight Sambalpur to Bhubaneswar, LTL transport Sambalpur Bhubaneswar, Odisha freight, truck booking Sambalpur Bhubaneswar",
    commodities: ["Industrial goods", "Machinery", "Agricultural produce", "Consumer goods"],
  },
  {
    slug: "rourkela-to-cuttack",
    from: "Rourkela",
    to: "Cuttack",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 300,
    transitTime: "6.4",
    dataStatus: "corrected",
    description:
      "PTL and LTL freight from Rourkela to Cuttack — connecting the steel city of western Odisha with the commercial hub of the coastal belt. LoadSaathi's AI-matched trucks and transparent pricing make this intra-Odisha corridor affordable.",
    keywords:
      "part load Rourkela to Cuttack, PTL freight Rourkela to Cuttack, LTL transport Rourkela Cuttack, Odisha freight, truck booking Rourkela Cuttack, steel city to coastal Odisha",
    commodities: ["Steel products", "Industrial machinery", "Textiles", "Consumer goods"],
  },

  // ── Reverse lanes (Sprint 3 — each is its own URL with its own copy; never
  // canonicalised to the forward lane — directional queries are distinct).
  {
    slug: "bhubaneswar-to-rourkela",
    from: "Bhubaneswar",
    to: "Rourkela",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 340,
    transitTime: "7",
    dataStatus: "needs_review",
    description:
      "Book part load, PTL and LTL freight from Bhubaneswar to Rourkela — the return leg into Odisha's steel capital. LoadSaathi's AI matching finds trucks heading west across the state with transparent pricing and live GPS tracking.",
    keywords:
      "part load Bhubaneswar to Rourkela, PTL freight Bhubaneswar to Rourkela, LTL transport Bhubaneswar Rourkela, truck booking Rourkela, Odisha freight, return load Bhubaneswar Rourkela",
    commodities: ["Consumer goods", "Textiles", "Packaged food", "Machinery parts"],
  },
  {
    slug: "kolkata-to-rourkela",
    from: "Kolkata",
    to: "Rourkela",
    fromState: "West Bengal",
    toState: "Odisha",
    distanceKm: 420,
    transitTime: "8.8",
    dataStatus: "corrected",
    description:
      "Ship part load, PTL and LTL freight from Kolkata to Rourkela across West Bengal and Odisha. Returning trucks from Kolkata make this direction competitive — compare transparent rates and book on LoadSaathi.",
    keywords:
      "part load Kolkata to Rourkela, PTL freight Kolkata to Rourkela, LTL transport Kolkata Rourkela, truck booking Rourkela, West Bengal Odisha freight, return load Kolkata Rourkela",
    commodities: ["Machinery parts", "FMCG goods", "Textiles", "Industrial consumables"],
  },
  {
    slug: "bhubaneswar-to-ranchi",
    from: "Bhubaneswar",
    to: "Ranchi",
    fromState: "Odisha",
    toState: "Jharkhand",
    distanceKm: 470,
    transitTime: "9.8",
    dataStatus: "corrected",
    highway: "NH-20",
    description:
      "Book part load, PTL and LTL freight from Bhubaneswar to Ranchi via the NH-20 corridor. LoadSaathi matches your shipment with trucks returning to Jharkhand's capital at transparent, GPS-tracked rates.",
    keywords:
      "part load Bhubaneswar to Ranchi, PTL freight Bhubaneswar to Ranchi, LTL transport Bhubaneswar Ranchi, truck booking Ranchi, Odisha Jharkhand freight, NH-20 freight corridor",
    commodities: ["Consumer goods", "Agricultural produce", "Packaged food", "Construction materials"],
  },
  {
    slug: "kolkata-to-ranchi",
    from: "Kolkata",
    to: "Ranchi",
    fromState: "West Bengal",
    toState: "Jharkhand",
    distanceKm: 420,
    transitTime: "8",
    dataStatus: "needs_review",
    description:
      "Find part load, PTL and LTL freight from Kolkata to Ranchi across West Bengal and Jharkhand. LoadSaathi's returning-truck network keeps this high-value commercial corridor affordable and fully tracked.",
    keywords:
      "part load Kolkata to Ranchi, PTL freight Kolkata to Ranchi, LTL transport Kolkata Ranchi, truck booking Ranchi, West Bengal Jharkhand freight, return load Kolkata Ranchi",
    commodities: ["FMCG goods", "Textiles", "Machinery parts", "Packaged food"],
  },
  {
    slug: "bhubaneswar-to-jamshedpur",
    from: "Bhubaneswar",
    to: "Jamshedpur",
    fromState: "Odisha",
    toState: "Jharkhand",
    distanceKm: 347,
    transitTime: "7",
    dataStatus: "corrected",
    highway: "NH-220 / NH-16",
    description:
      "Book part load, PTL and LTL freight from Bhubaneswar to Jamshedpur on the NH-16 / NH-220 corridor. Move goods from Odisha's capital to Jharkhand's steel city with AI-matched trucks and live GPS tracking.",
    keywords:
      "part load Bhubaneswar to Jamshedpur, PTL freight Bhubaneswar to Jamshedpur, LTL transport Bhubaneswar Jamshedpur, truck booking Jamshedpur, Odisha Jharkhand freight, steel city transport",
    commodities: ["Consumer goods", "Agricultural produce", "Cement", "FMCG goods"],
  },
  {
    slug: "kolkata-to-jamshedpur",
    from: "Kolkata",
    to: "Jamshedpur",
    fromState: "West Bengal",
    toState: "Jharkhand",
    distanceKm: 280,
    transitTime: "6",
    dataStatus: "needs_review",
    description:
      "Ship part load, PTL and LTL freight from Kolkata to Jamshedpur on this busy industrial corridor. LoadSaathi's AI matching and transparent pricing make commercial shipping into the steel city simple.",
    keywords:
      "part load Kolkata to Jamshedpur, PTL freight Kolkata to Jamshedpur, LTL transport Kolkata Jamshedpur, truck booking Jamshedpur, West Bengal Jharkhand freight, industrial corridor transport",
    commodities: ["FMCG goods", "Automobile parts", "Textiles", "Consumer electronics"],
  },
  {
    slug: "kolkata-to-bhubaneswar",
    from: "Kolkata",
    to: "Bhubaneswar",
    fromState: "West Bengal",
    toState: "Odisha",
    distanceKm: 440,
    transitTime: "8",
    dataStatus: "verified",
    description:
      "Book part load, PTL and LTL freight from Kolkata to Bhubaneswar — the return direction of East India's busiest commercial corridor. Competitive rates, AI-matched trucks and live GPS tracking on LoadSaathi.",
    keywords:
      "part load Kolkata to Bhubaneswar, PTL freight Kolkata to Bhubaneswar, LTL transport Kolkata Bhubaneswar, truck booking Bhubaneswar, West Bengal Odisha freight, return load Kolkata Bhubaneswar",
    commodities: ["FMCG goods", "Agricultural produce", "Textiles", "Consumer electronics"],
  },
  {
    slug: "dhanbad-to-ranchi",
    from: "Dhanbad",
    to: "Ranchi",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 155,
    transitTime: "4",
    dataStatus: "corrected",
    description:
      "Book part load, PTL and LTL freight from Dhanbad to Ranchi within Jharkhand. Move coal-country cargo to the state capital with AI-matched trucks, transparent rates and live GPS tracking.",
    keywords:
      "part load Dhanbad to Ranchi, PTL freight Dhanbad to Ranchi, LTL transport Dhanbad Ranchi, truck booking Ranchi, Jharkhand freight, coal corridor logistics",
    commodities: ["Coal", "Mining equipment", "Industrial machinery", "Consumer goods"],
  },
  {
    slug: "jamshedpur-to-dhanbad",
    from: "Jamshedpur",
    to: "Dhanbad",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 145,
    transitTime: "3.7",
    dataStatus: "corrected",
    description:
      "Ship part load, PTL and LTL freight from Jamshedpur to Dhanbad on the coal-to-steel corridor. LoadSaathi matches steel-city shipments with trucks heading to Jharkhand's coal hub.",
    keywords:
      "part load Jamshedpur to Dhanbad, PTL freight Jamshedpur to Dhanbad, LTL transport Jamshedpur Dhanbad, truck booking Dhanbad, Jharkhand freight, coal steel corridor logistics",
    commodities: ["Steel products", "Industrial machinery", "Packaged food", "Consumer goods"],
  },
  {
    slug: "sambalpur-to-rourkela",
    from: "Sambalpur",
    to: "Rourkela",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 120,
    transitTime: "2.5",
    dataStatus: "needs_review",
    description:
      "Quick part load, PTL and LTL freight from Sambalpur to Rourkela within Odisha. Local truckers, transparent pricing and live tracking for western Odisha's industrial belt.",
    keywords:
      "part load Sambalpur to Rourkela, PTL freight Sambalpur to Rourkela, LTL transport Sambalpur Rourkela, truck booking Rourkela, Odisha freight, intra-Odisha logistics",
    commodities: ["Agricultural produce", "Cement", "Industrial goods", "Machinery parts"],
  },
  {
    slug: "burdwan-to-rourkela",
    from: "Burdwan",
    to: "Rourkela",
    fromState: "West Bengal",
    toState: "Odisha",
    distanceKm: 320,
    transitTime: "7",
    dataStatus: "needs_review",
    description:
      "Book part load, PTL and LTL freight from Burdwan (Bardhaman) to Rourkela across West Bengal and Odisha. AI-matched trucks and transparent rates on LoadSaathi.",
    keywords:
      "part load Burdwan to Rourkela, PTL freight Burdwan to Rourkela, Bardhaman to Rourkela part load, LTL transport Burdwan Rourkela, West Bengal Odisha freight, truck booking Rourkela",
    commodities: ["Agricultural produce", "Textiles", "Machinery parts", "Consumer goods"],
  },
  {
    slug: "burdwan-to-jamshedpur",
    from: "Burdwan",
    to: "Jamshedpur",
    fromState: "West Bengal",
    toState: "Jharkhand",
    distanceKm: 200,
    transitTime: "4",
    dataStatus: "needs_review",
    description:
      "Ship part load, PTL and LTL freight from Burdwan (Bardhaman) to Jamshedpur across the Bengal–Jharkhand border. Competitive rates and live GPS tracking with LoadSaathi.",
    keywords:
      "part load Burdwan to Jamshedpur, PTL freight Burdwan to Jamshedpur, Bardhaman to Jamshedpur part load, LTL transport Burdwan Jamshedpur, West Bengal Jharkhand freight, truck booking Jamshedpur",
    commodities: ["Agricultural produce", "Consumer goods", "Textiles", "Machinery parts"],
  },
  {
    slug: "burdwan-to-bhubaneswar",
    from: "Burdwan",
    to: "Bhubaneswar",
    fromState: "West Bengal",
    toState: "Odisha",
    distanceKm: 420,
    transitTime: "8",
    dataStatus: "needs_review",
    description:
      "Book part load, PTL and LTL freight from Burdwan (Bardhaman) to Bhubaneswar across West Bengal and Odisha. AI-matched trucks, transparent pricing and live tracking on LoadSaathi.",
    keywords:
      "part load Burdwan to Bhubaneswar, PTL freight Burdwan to Bhubaneswar, Bardhaman to Bhubaneswar part load, LTL transport Burdwan Bhubaneswar, West Bengal Odisha freight, truck booking Bhubaneswar",
    commodities: ["Agricultural produce", "Consumer goods", "Textiles", "Packaged food"],
  },
  {
    slug: "visakhapatnam-to-bhubaneswar",
    from: "Visakhapatnam",
    to: "Bhubaneswar",
    fromState: "Andhra Pradesh",
    toState: "Odisha",
    distanceKm: 445,
    transitTime: "7",
    dataStatus: "corrected",
    description:
      "Book part load, PTL and LTL freight from Visakhapatnam (Vizag) to Bhubaneswar along the East Coast corridor. LoadSaathi's AI matching connects the port city with Odisha's capital at transparent rates.",
    keywords:
      "part load Visakhapatnam to Bhubaneswar, PTL freight Visakhapatnam to Bhubaneswar, Vizag to Bhubaneswar part load, LTL transport Vizag Bhubaneswar, Andhra Pradesh Odisha freight, truck booking Bhubaneswar",
    commodities: ["Consumer goods", "Textiles", "Packaged food", "Machinery parts"],
  },
  {
    slug: "bhubaneswar-to-balasore",
    from: "Bhubaneswar",
    to: "Balasore",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 210,
    transitTime: "4",
    dataStatus: "needs_review",
    highway: "NH-16",
    description:
      "Fast part load, PTL and LTL freight from Bhubaneswar to Balasore within Odisha on the NH-16 corridor. Quick, affordable shipping north along the coast with LoadSaathi.",
    keywords:
      "part load Bhubaneswar to Balasore, PTL freight Bhubaneswar to Balasore, LTL transport Bhubaneswar Balasore, truck booking Balasore, Odisha freight, NH-16 logistics Odisha",
    commodities: ["Packaged food", "Textiles", "Consumer goods", "Agricultural produce"],
  },
  {
    slug: "bhubaneswar-to-berhampur",
    from: "Bhubaneswar",
    to: "Berhampur",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 180,
    transitTime: "4",
    dataStatus: "needs_review",
    description:
      "Reliable part load, PTL and LTL freight from Bhubaneswar to Berhampur (Brahmapur) — connecting the capital with southern Odisha. AI-matched trucks and transparent rates on LoadSaathi.",
    keywords:
      "part load Bhubaneswar to Berhampur, PTL freight Bhubaneswar to Berhampur, Bhubaneswar to Brahmapur part load, LTL transport Bhubaneswar Berhampur, truck booking Berhampur, southern Odisha logistics",
    commodities: ["Consumer goods", "Packaged food", "Machinery parts", "Textiles"],
  },
  {
    slug: "burdwan-to-kolkata",
    from: "Burdwan",
    to: "Kolkata",
    fromState: "West Bengal",
    toState: "West Bengal",
    distanceKm: 110,
    transitTime: "2.5",
    dataStatus: "needs_review",
    description:
      "Quick part load, PTL and LTL freight from Burdwan (Bardhaman) to Kolkata within West Bengal. Fast, affordable intrastate shipping with LoadSaathi's local trucker network.",
    keywords:
      "part load Burdwan to Kolkata, PTL freight Burdwan to Kolkata, Bardhaman to Kolkata part load, LTL transport Burdwan Kolkata, West Bengal freight, truck booking Kolkata",
    commodities: ["Agricultural produce", "Construction materials", "Packaged food", "Machinery parts"],
  },
  {
    slug: "jharsuguda-to-sambalpur",
    from: "Jharsuguda",
    to: "Sambalpur",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 50,
    transitTime: "1.5",
    dataStatus: "corrected",
    description:
      "Short-haul part load, PTL and LTL freight from Jharsuguda to Sambalpur in western Odisha. Quick, affordable trucking between these two industrial towns with LoadSaathi.",
    keywords:
      "part load Jharsuguda to Sambalpur, PTL freight Jharsuguda to Sambalpur, LTL transport Jharsuguda Sambalpur, truck booking Sambalpur, Odisha freight, western Odisha logistics",
    commodities: ["Cement", "Agricultural produce", "Consumer goods", "Industrial goods"],
  },
  {
    slug: "bhubaneswar-to-cuttack",
    from: "Bhubaneswar",
    to: "Cuttack",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 30,
    transitTime: "1",
    dataStatus: "needs_review",
    description:
      "Quick part load, PTL and LTL freight from Bhubaneswar to Cuttack — Odisha's twin cities corridor. LoadSaathi's local trucker network ensures fast, affordable intrastate shipping.",
    keywords:
      "part load Bhubaneswar to Cuttack, PTL freight Bhubaneswar to Cuttack, LTL transport Bhubaneswar Cuttack, Odisha intrastate freight, truck booking Cuttack",
    commodities: ["Agricultural produce", "Textiles", "Consumer electronics", "Packaged goods"],
  },
  {
    slug: "bhubaneswar-to-sambalpur",
    from: "Bhubaneswar",
    to: "Sambalpur",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 350,
    transitTime: "7",
    dataStatus: "needs_review",
    description:
      "Book part load, PTL and LTL freight from Bhubaneswar to Sambalpur — from the state capital into western Odisha's industrial belt. AI-matched trucks and fair pricing on LoadSaathi.",
    keywords:
      "part load Bhubaneswar to Sambalpur, PTL freight Bhubaneswar to Sambalpur, LTL transport Bhubaneswar Sambalpur, truck booking Sambalpur, Odisha freight, intra-Odisha logistics",
    commodities: ["Consumer goods", "Packaged food", "Textiles", "Machinery parts"],
  },
];
