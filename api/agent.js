export const config = { runtime: 'edge' };

// Exact static routes that map to SPA
const EXACT_ROUTES = new Set([
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/features',
  '/how-it-works',
  '/pricing',
  '/faq',
  '/compare',
  '/safety-trust',
  '/solutions/shippers',
  '/solutions/truckers',
  '/screens/dashboard',
  '/screens/matching',
  '/screens/chat',
  '/screens/credit-score',
  '/screens/reviews',
  '/screens/admin',
  '/blog',
  '/routes',
  '/gallery',
  '/return-load',
  '/ptl-transport',
  '/ltl-transport',
  '/truck-load-booking',
  '/freight-marketplace',
  '/truck-near-me',
  '/transport-cost-calculator',
  '/for-msmes',
  '/ai-logistics',
  '/data',
  '/hi',
  '/hi/ptl-transport',
  '/hi/return-load',
  '/hi/bhada-kaise-book-kare',
  '/hi/route/rourkela-to-ranchi',
  '/login',
  '/register',
  '/choose-role',
  '/forgot-password',
  '/onboarding',
  '/profile',
  '/favorites',
  '/credit-score',
  '/browse-trucks',
  '/messages',
  '/tools',
]);

// Prefixes for dynamic routes — any sub-path under these is considered a valid SPA route
const PREFIXES = [
  '/share/trip/',
  '/share/shipment/',
  '/blog/',
  '/routes/',
  '/location/',
  '/guide/',
  '/transport-service/',
  '/admin/',
  '/trucker/',
  '/shipper/',
  '/trips/',
  '/chat/',
  '/tools/',
];

// HTML files that have dedicated prerendered variants (served instead of generic index.html)
// This ensures trust-anchor pages have 500+ chars in raw HTML without JS
const DEDICATED_HTML = new Set(['/about', '/contact', '/privacy']);

// Duplicate-pair sources → canonical targets (301). Both URLs render the same
// component, so only the target is in the sitemap and carries the canonical.
const REDIRECTS = {
  '/freight-intelligence': '/data',
  '/fare-calculator': '/tools/fare-calculator',
  '/freight-rate-calculator': '/tools/freight-rate-calculator',
  '/return-load-calculator': '/tools/return-load-calculator',
  '/truck-load-calculator': '/tools/truck-load-calculator',
  '/ptl-vs-ftl-calculator': '/tools/ptl-vs-ftl-calculator',
  '/location/vizag': '/location/visakhapatnam',
};

// Cities with a real LocationPage (keys of cityData in LocationPage.tsx plus
// the vizag→visakhapatnam alias). Any other /location/* slug is a 404.
const KNOWN_LOCATIONS = new Set([
  'rourkela', 'ranchi', 'kolkata', 'bhubaneswar', 'jamshedpur', 'cuttack',
  'sambalpur', 'angul', 'jharsuguda', 'burdwan', 'dhanbad', 'balasore',
  'berhampur', 'vizag', 'visakhapatnam',
]);

// Dynamic public prefixes whose unknown slugs must 404 (instead of a 200
// "not found" screen). App/private prefixes are NOT listed: they stay 200
// with noindex so the SPA keeps working.
const SLUG_VALIDATED_PREFIXES = ['/blog/', '/routes/', '/location/', '/guide/', '/transport-service/'];

function redirectResponse(to, status = 301) {
  return new Response(null, {
    status,
    headers: { Location: to, 'Cache-Control': 'public, max-age=86400' },
  });
}

function normalizePath(path) {
  // Remove trailing slash except for root
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function isKnownRoute(path) {
  const n = normalizePath(path);
  if (EXACT_ROUTES.has(n)) return true;
  // Prefix match
  for (const p of PREFIXES) {
    if (path.startsWith(p)) return true;
  }
  // Special: /blog with prefix already covers /blog/, but exact /blog handled
  // Also handle /routes with slug etc via prefix
  return false;
}

function markdownForPath(path) {
  const n = normalizePath(path);
  // Map known HTML paths to markdown sources where we have dedicated files
  const map = {
    '/': '/index.md',
    '/pricing': '/pricing.md',
  };
  return map[n] || null;
}

const ROUTE_DATA = {
  "balasore-to-bhubaneswar": {
    from: "Balasore",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 210,
    transitTime: "4",
    description: "Fast PTL and LTL freight from Balasore to Bhubaneswar within Odisha. LoadSaathi helps you find trucks quickly on this busy NH-16 corridor with AI matching and live GPS tracking.",
    metaDescription: "Book PTL/LTL freight from Balasore to Bhubaneswar. Intra-Odisha shipping with LoadSaathi — AI truck matching, GPS tracking, and competitive pricing.",
    keywords: "PTL freight Balasore to Bhubaneswar, LTL transport Balasore Bhubaneswar, Odisha freight, truck booking Balasore, NH-16 logistics Odisha",
    seoTitle: "PTL Freight Balasore to Bhubaneswar | LoadSaathi",
  },
  "berhampur-to-bhubaneswar": {
    from: "Berhampur",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 180,
    transitTime: "4",
    description: "Reliable PTL and LTL freight from Berhampur (Brahmapur) to Bhubaneswar. Connect southern Odisha to the capital with LoadSaathi's AI-optimized truck matching.",
    metaDescription: "Book PTL/LTL freight from Berhampur to Bhubaneswar. Southern Odisha to capital shipping with LoadSaathi — AI matching, GPS tracking, fair pricing.",
    keywords: "PTL freight Berhampur to Bhubaneswar, LTL transport Brahmapur Bhubaneswar, Odisha freight, truck booking Berhampur, southern Odisha logistics",
    seoTitle: "PTL Freight Berhampur to Bhubaneswar | LoadSaathi",
  },
  "bhubaneswar-to-burdwan": {
    from: "Bhubaneswar",
    to: "Burdwan",
    fromState: "Odisha",
    toState: "West Bengal",
    distanceKm: 420,
    transitTime: "8",
    description: "Cost-effective PTL and LTL freight from Bhubaneswar to Burdwan. LoadSaathi's AI matches your shipment with the most suitable trucks on this cross-state Odisha–Bengal route.",
    metaDescription: "Book PTL/LTL freight from Bhubaneswar to Burdwan. Cross-state Odisha–West Bengal shipping with LoadSaathi — AI matching, GPS tracking, fair rates.",
    keywords: "PTL freight Bhubaneswar to Burdwan, LTL transport Bhubaneswar Burdwan, Odisha West Bengal freight, truck booking Burdwan, Bhubaneswar PTL",
    seoTitle: "PTL Freight Bhubaneswar to Burdwan | LoadSaathi",
  },
  "bhubaneswar-to-kolkata": {
    from: "Bhubaneswar",
    to: "Kolkata",
    fromState: "Odisha",
    toState: "West Bengal",
    distanceKm: 440,
    transitTime: "8",
    description: "Major PTL and LTL freight corridor connecting the capital of Odisha with the commercial capital of East India. LoadSaathi offers the best rates and reliable trucking on this busy route.",
    metaDescription: "Book PTL/LTL freight from Bhubaneswar to Kolkata. Odisha to West Bengal shipping with LoadSaathi — AI-matched trucks, live GPS tracking, and competitive pricing.",
    keywords: "PTL freight Bhubaneswar to Kolkata, LTL transport Bhubaneswar Kolkata, Odisha West Bengal freight, truck booking Kolkata, Bhubaneswar logistics",
    seoTitle: "PTL Freight Bhubaneswar to Kolkata | LoadSaathi",
  },
  "bhubaneswar-to-vizag": {
    from: "Bhubaneswar",
    to: "Visakhapatnam",
    fromState: "Odisha",
    toState: "Andhra Pradesh",
    distanceKm: 450,
    transitTime: "8",
    description: "Coastal corridor PTL and LTL freight from Bhubaneswar to Visakhapatnam. LoadSaathi's AI platform streamlines cross-state shipping along the East Coast with real-time tracking and fair pricing.",
    metaDescription: "Book PTL/LTL freight from Bhubaneswar to Visakhapatnam. Coastal corridor shipping with LoadSaathi — AI matching, GPS tracking, transparent rates on the Odisha–AP route.",
    keywords: "PTL freight Bhubaneswar to Visakhapatnam, LTL transport Bhubaneswar Vizag, Odisha Andhra Pradesh freight, truck booking Vizag, coastal corridor logistics",
    seoTitle: "PTL Freight Bhubaneswar to Visakhapatnam | LoadSaathi",
  },
  "cuttack-to-bhubaneswar": {
    from: "Cuttack",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 30,
    transitTime: "1",
    description: "Quick PTL and LTL freight from Cuttack to Bhubaneswar — the twin cities of Odisha. LoadSaathi's local trucker network ensures fast, affordable intrastate shipping on this high-traffic corridor.",
    metaDescription: "Book PTL/LTL freight from Cuttack to Bhubaneswar. Intrastate Odisha shipping on the twin-city corridor with LoadSaathi — AI matching and GPS tracking.",
    keywords: "PTL freight Cuttack to Bhubaneswar, LTL transport Cuttack Bhubaneswar, Odisha intrastate freight, truck booking Cuttack Bhubaneswar",
    seoTitle: "PTL Freight Cuttack to Bhubaneswar | LoadSaathi",
  },
  "cuttack-to-rourkela": {
    from: "Cuttack",
    to: "Rourkela",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 320,
    transitTime: "7",
    description: "PTL and LTL freight from Cuttack to Rourkela across Odisha. Connect the coastal trading hub with the steel city via LoadSaathi's AI-matched trucks and transparent pricing.",
    metaDescription: "Book PTL/LTL freight from Cuttack to Rourkela. Odisha intrastate shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    keywords: "PTL freight Cuttack to Rourkela, LTL transport Cuttack Rourkela, Odisha freight, truck booking Cuttack Rourkela, coastal to western Odisha",
    seoTitle: "PTL Freight Cuttack to Rourkela | LoadSaathi",
  },
  "dhanbad-to-jamshedpur": {
    from: "Dhanbad",
    to: "Jamshedpur",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 170,
    transitTime: "3.5",
    description: "Move freight between Jharkhand's coal hub and its steel city. LoadSaathi connects Dhanbad and Jamshedpur with AI-matched PTL and LTL trucks for efficient intra-state logistics.",
    metaDescription: "Book PTL/LTL freight from Dhanbad to Jamshedpur. Intra-Jharkhand shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    keywords: "PTL freight Dhanbad to Jamshedpur, LTL transport Dhanbad Jamshedpur, Jharkhand freight, truck booking Dhanbad Jamshedpur, coal steel corridor logistics",
    seoTitle: "PTL Freight Dhanbad to Jamshedpur | LoadSaathi",
  },
  "jamshedpur-to-bhubaneswar": {
    from: "Jamshedpur",
    to: "Bhubaneswar",
    fromState: "Jharkhand",
    toState: "Odisha",
    distanceKm: 340,
    transitTime: "8-10",
    description: "Get live 2026 freight rates for Jamshedpur to Bhubaneswar. Book verified PTL and FTL trucks, track your cargo via GPS, and save up to 30% on shared loads.",
    metaDescription: "Get live 2026 freight rates for Jamshedpur to Bhubaneswar. Book verified PTL and FTL trucks, track your cargo via GPS, and save up to 30% on shared loads.",
    keywords: "PTL freight Jamshedpur to Bhubaneswar, LTL transport Jamshedpur Bhubaneswar, Jharkhand Odisha freight, truck booking Bhubaneswar, Jamshedpur logistics, steel transport Bhubaneswar, Jamshedpur to Bhubaneswar truck rates 2026",
    seoTitle: "PTL Freight Jamshedpur to Bhubaneswar | LoadSaathi",
  },
  "jamshedpur-to-burdwan": {
    from: "Jamshedpur",
    to: "Burdwan",
    fromState: "Jharkhand",
    toState: "West Bengal",
    distanceKm: 200,
    transitTime: "4",
    description: "Cross-state PTL and LTL shipping from Jamshedpur to Burdwan. LoadSaathi makes it easy to ship across the Jharkhand–West Bengal border with AI matching and live tracking.",
    metaDescription: "Book PTL freight from Jamshedpur to Burdwan. Cross-border Jharkhand–West Bengal shipping with LoadSaathi's AI truck matching and real-time GPS tracking.",
    keywords: "PTL freight Jamshedpur to Burdwan, LTL transport Jamshedpur Burdwan, Jharkhand West Bengal freight, truck booking Burdwan, cross-state PTL shipping",
    seoTitle: "PTL Freight Jamshedpur to Burdwan | LoadSaathi",
  },
  "jamshedpur-to-kolkata": {
    from: "Jamshedpur",
    to: "Kolkata",
    fromState: "Jharkhand",
    toState: "West Bengal",
    distanceKm: 280,
    transitTime: "6",
    description: "Ship PTL and LTL loads from Jamshedpur to Kolkata efficiently. This busy industrial-to-commercial corridor is a key route on LoadSaathi's AI-powered freight matching network.",
    metaDescription: "Find PTL/LTL freight from Jamshedpur to Kolkata. Save on Jamshedpur–Kolkata shipping with LoadSaathi — AI matching, GPS tracking, transparent pricing.",
    keywords: "PTL freight Jamshedpur to Kolkata, LTL transport Jamshedpur Kolkata, truck booking Kolkata, Jharkhand West Bengal logistics, Jamshedpur Kolkata freight",
    seoTitle: "PTL Freight Jamshedpur to Kolkata | LoadSaathi",
  },
  "jamshedpur-to-ranchi": {
    from: "Jamshedpur",
    to: "Ranchi",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 130,
    transitTime: "3",
    description: "Efficient PTL and LTL freight from Jamshedpur to Ranchi. LoadSaathi helps you find the right truck at the right price with AI matching and transparent booking on this Jharkhand corridor.",
    metaDescription: "Book PTL freight from Jamshedpur to Ranchi. Cost-effective intra-Jharkhand shipping with LoadSaathi's AI truck matching and live tracking.",
    keywords: "PTL freight Jamshedpur to Ranchi, LTL transport Jamshedpur Ranchi, Jharkhand freight, truck booking Jamshedpur Ranchi, Jamshedpur logistics",
    seoTitle: "PTL Freight Jamshedpur to Ranchi | LoadSaathi",
  },
  "jamshedpur-to-rourkela": {
    from: "Jamshedpur",
    to: "Rourkela",
    fromState: "Jharkhand",
    toState: "Odisha",
    distanceKm: 220,
    transitTime: "5",
    description: "Find efficient PTL and LTL freight from Jamshedpur to Rourkela. Leverage LoadSaathi's returning trucks and AI matching for cost-effective shipping on this key industrial corridor.",
    metaDescription: "Book cost-effective PTL freight from Jamshedpur to Rourkela. LoadSaathi offers AI-matched trucks, real-time tracking, and fair pricing on the Jamshedpur–Rourkela route.",
    keywords: "PTL freight Jamshedpur to Rourkela, LTL transport Jamshedpur Rourkela, truck booking Jharkhand Odisha, Jamshedpur Rourkela load, freight transport Jamshedpur",
    seoTitle: "PTL Freight Jamshedpur to Rourkela | LoadSaathi",
  },
  "kolkata-to-burdwan": {
    from: "Kolkata",
    to: "Burdwan",
    fromState: "West Bengal",
    toState: "West Bengal",
    distanceKm: 110,
    transitTime: "2.5",
    description: "Quick PTL and LTL freight from Kolkata to Burdwan within West Bengal. LoadSaathi's network of local truckers ensures fast, affordable shipping on this busy intrastate route.",
    metaDescription: "Book PTL/LTL freight from Kolkata to Burdwan. Intra-West Bengal shipping with LoadSaathi — AI matching, GPS tracking, best rates on the Kolkata–Burdwan route.",
    keywords: "PTL freight Kolkata to Burdwan, LTL transport Kolkata Burdwan, West Bengal freight, truck booking Burdwan, intra-West Bengal logistics",
    seoTitle: "PTL Freight Kolkata to Burdwan | LoadSaathi",
  },
  "ranchi-to-bhubaneswar": {
    from: "Ranchi",
    to: "Bhubaneswar",
    fromState: "Jharkhand",
    toState: "Odisha",
    distanceKm: 450,
    transitTime: "10",
    description: "Cross-state PTL and LTL freight from Ranchi to Bhubaneswar via the NH-20 corridor. LoadSaathi's AI platform matches your shipment with the best trucks for this inter-state route.",
    metaDescription: "Book PTL/LTL freight from Ranchi to Bhubaneswar. Cross-state shipping across Jharkhand–Odisha with LoadSaathi — AI matching, GPS tracking, fair pricing.",
    keywords: "PTL freight Ranchi to Bhubaneswar, LTL transport Ranchi Bhubaneswar, Jharkhand Odisha freight, truck booking Bhubaneswar, NH-20 freight corridor",
    seoTitle: "PTL Freight Ranchi to Bhubaneswar | LoadSaathi",
  },
  "ranchi-to-dhanbad": {
    from: "Ranchi",
    to: "Dhanbad",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 280,
    transitTime: "6",
    description: "Efficient PTL and LTL freight from Ranchi to Dhanbad within Jharkhand. LoadSaathi connects Jharkhand's capital with its coal mining hub for seamless intra-state logistics.",
    metaDescription: "Book PTL/LTL freight from Ranchi to Dhanbad. Intra-Jharkhand shipping with LoadSaathi — AI matching, live GPS tracking, competitive rates on the Ranchi–Dhanbad route.",
    keywords: "PTL freight Ranchi to Dhanbad, LTL transport Ranchi Dhanbad, Jharkhand freight, truck booking Dhanbad, coal corridor logistics Jharkhand",
    seoTitle: "PTL Freight Ranchi to Dhanbad | LoadSaathi",
  },
  "ranchi-to-jamshedpur": {
    from: "Ranchi",
    to: "Jamshedpur",
    fromState: "Jharkhand",
    toState: "Jharkhand",
    distanceKm: 130,
    transitTime: "3",
    description: "Fast and reliable PTL and LTL freight between two of Jharkhand's largest cities. LoadSaathi connects Ranchi and Jamshedpur with AI-matched trucks and real-time GPS tracking.",
    metaDescription: "Book PTL/LTL freight from Ranchi to Jamshedpur. Intra-Jharkhand shipping made easy with LoadSaathi's AI matching and transparent pricing.",
    keywords: "PTL freight Ranchi to Jamshedpur, LTL transport Ranchi Jamshedpur, Jharkhand freight, truck booking Ranchi Jamshedpur, intra-state trucking Jharkhand",
    seoTitle: "PTL Freight Ranchi to Jamshedpur | LoadSaathi",
  },
  "ranchi-to-kolkata": {
    from: "Ranchi",
    to: "Kolkata",
    fromState: "Jharkhand",
    toState: "West Bengal",
    distanceKm: 420,
    transitTime: "8",
    description: "Ship PTL and LTL loads from Ranchi to Kolkata across Jharkhand and West Bengal. LoadSaathi's AI matching and real-time GPS tracking make this key cross-state route simple and transparent.",
    metaDescription: "Find PTL/LTL freight from Ranchi to Kolkata. Book trucks on the Ranchi–Kolkata corridor with LoadSaathi — AI matching, live tracking, transparent pricing.",
    keywords: "PTL freight Ranchi to Kolkata, LTL transport Ranchi Kolkata, truck booking Kolkata, Jharkhand West Bengal logistics, Ranchi Kolkata freight",
    seoTitle: "PTL Freight Ranchi to Kolkata | LoadSaathi",
  },
  "ranchi-to-rourkela": {
    from: "Ranchi",
    to: "Rourkela",
    fromState: "Jharkhand",
    toState: "Odisha",
    distanceKm: 180,
    transitTime: "4",
    description: "Ship goods from the capital of Jharkhand to the steel hub of Odisha. Find returning trucks and competitive rates on the Ranchi–Rourkela route with LoadSaathi's real-time matching and transparent pricing.",
    metaDescription: "Find affordable PTL/LTL freight from Ranchi to Rourkela. Book trucks on the Ranchi–Rourkela corridor with LoadSaathi's AI matching and live GPS tracking.",
    keywords: "PTL freight Ranchi to Rourkela, LTL transport Ranchi Rourkela, truck booking Jharkhand Odisha, Ranchi to Rourkela load, freight transport Ranchi",
    seoTitle: "PTL Freight Ranchi to Rourkela | LoadSaathi",
  },
  "rourkela-to-bhubaneswar": {
    from: "Rourkela",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 340,
    transitTime: "7",
    description: "Reliable PTL and LTL freight from Rourkela to Bhubaneswar — the capital of Odisha. LoadSaathi connects these key Odisha cities with AI-optimized truck matching and live GPS tracking.",
    metaDescription: "Book PTL/LTL freight from Rourkela to Bhubaneswar. Save up to 40% on shipping within Odisha. AI truck matching, GPS tracking, and digital credit scores on LoadSaathi.",
    keywords: "PTL freight Rourkela to Bhubaneswar, LTL transport Rourkela Bhubaneswar, Odisha freight, truck booking Rourkela Bhubaneswar, part load Bhubaneswar",
    seoTitle: "PTL Freight Rourkela to Bhubaneswar | LoadSaathi",
  },
  "rourkela-to-burdwan": {
    from: "Rourkela",
    to: "Burdwan",
    fromState: "Odisha",
    toState: "West Bengal",
    distanceKm: 320,
    transitTime: "7",
    description: "Seamless PTL and LTL freight from Rourkela to Burdwan across the Odisha–West Bengal border. LoadSaathi's platform handles cross-state logistics with AI matching and transparent pricing.",
    metaDescription: "Book PTL freight from Rourkela to Burdwan. Cross-border trucking made easy with LoadSaathi — AI matching, live GPS tracking, and fair rates on the Odisha–West Bengal route.",
    keywords: "PTL freight Rourkela to Burdwan, LTL transport Rourkela Burdwan, Odisha West Bengal freight, truck booking Burdwan, cross-state PTL shipping",
    seoTitle: "PTL Freight Rourkela to Burdwan | LoadSaathi",
  },
  "rourkela-to-cuttack": {
    from: "Rourkela",
    to: "Cuttack",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 320,
    transitTime: "7",
    description: "PTL and LTL freight from Rourkela to Cuttack — connecting the steel city of western Odisha with the commercial hub of the coastal belt. LoadSaathi's AI-matched trucks and transparent pricing make this cross-state corridor affordable.",
    metaDescription: "Book PTL/LTL freight from Rourkela to Cuttack. Odisha intrastate shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    keywords: "PTL freight Rourkela to Cuttack, LTL transport Rourkela Cuttack, Odisha freight, truck booking Rourkela Cuttack, steel city to coastal Odisha",
    seoTitle: "PTL Freight Rourkela to Cuttack | LoadSaathi",
  },
  "rourkela-to-jamshedpur": {
    from: "Rourkela",
    to: "Jamshedpur",
    fromState: "Odisha",
    toState: "Jharkhand",
    distanceKm: 220,
    transitTime: "5",
    description: "Move freight between two of India's largest steel cities. LoadSaathi connects Rourkela and Jamshedpur with AI-matched PTL and LTL trucks, real-time tracking, and competitive rates.",
    metaDescription: "Book PTL/LTL freight from Rourkela to Jamshedpur. Save on steel corridor shipping with LoadSaathi — AI matching, GPS tracking, transparent pricing.",
    keywords: "PTL freight Rourkela to Jamshedpur, LTL transport Rourkela Jamshedpur, truck booking Rourkela Jharkhand, steel corridor freight, Rourkela Jamshedpur load",
    seoTitle: "PTL Freight Rourkela to Jamshedpur | LoadSaathi",
  },
  "rourkela-to-kolkata": {
    from: "Rourkela",
    to: "Kolkata",
    fromState: "Odisha",
    toState: "West Bengal",
    distanceKm: 440,
    transitTime: "9",
    description: "Ship PTL and LTL loads from Rourkela to Kolkata — the commercial capital of East India. LoadSaathi offers AI-matched trucks, real-time tracking, and the best rates on this busy corridor.",
    metaDescription: "Find PTL/LTL freight from Rourkela to Kolkata. Save on East India's busiest freight corridor with LoadSaathi — AI matching, GPS tracking, transparent pricing.",
    keywords: "PTL freight Rourkela to Kolkata, LTL transport Rourkela Kolkata, truck booking Kolkata, Odisha West Bengal logistics, Kolkata freight corridor",
    seoTitle: "PTL Freight Rourkela to Kolkata | LoadSaathi",
  },
  "rourkela-to-ranchi": {
    from: "Rourkela",
    to: "Ranchi",
    fromState: "Odisha",
    toState: "Jharkhand",
    distanceKm: 180,
    transitTime: "4",
    description: "Connect the steel city of Odisha with the capital of Jharkhand via LoadSaathi's AI-powered freight marketplace. Book PTL and LTL truck loads on the Rourkela–Ranchi corridor with GPS tracking, transparent pricing, and digital credit scores.",
    metaDescription: "Book PTL/LTL freight from Rourkela to Ranchi. Save up to 40% with LoadSaathi's shared truck network. GPS tracking, AI matching, and transparent pricing on the Rourkela–Ranchi corridor.",
    keywords: "PTL freight Rourkela to Ranchi, LTL transport Rourkela Ranchi, truck booking Rourkela Jharkhand, part load Rourkela, shared freight Odisha Jharkhand, LoadSaathi Rourkela Ranchi",
    seoTitle: "PTL Freight Rourkela to Ranchi | LoadSaathi",
  },
  "rourkela-to-sambalpur": {
    from: "Rourkela",
    to: "Sambalpur",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 120,
    transitTime: "2.5",
    description: "Quick and reliable PTL and LTL freight from Rourkela to Sambalpur within Odisha. LoadSaathi's AI matches local truckers to your shipment for fast, cost-effective delivery.",
    metaDescription: "Book PTL/LTL freight from Rourkela to Sambalpur. Intra-Odisha shipping made simple with LoadSaathi — AI matching, GPS tracking, transparent pricing.",
    keywords: "PTL freight Rourkela to Sambalpur, LTL transport Rourkela Sambalpur, Odisha freight, truck booking Sambalpur, intra-Odisha logistics",
    seoTitle: "PTL Freight Rourkela to Sambalpur | LoadSaathi",
  },
  "sambalpur-to-bhubaneswar": {
    from: "Sambalpur",
    to: "Bhubaneswar",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 350,
    transitTime: "7",
    description: "PTL and LTL freight from Sambalpur to Bhubaneswar — connecting western Odisha's industrial belt with the state capital. LoadSaathi offers AI-matched trucks and fair pricing.",
    metaDescription: "Book PTL/LTL freight from Sambalpur to Bhubaneswar. Odisha intrastate shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    keywords: "PTL freight Sambalpur to Bhubaneswar, LTL transport Sambalpur Bhubaneswar, Odisha freight, truck booking Sambalpur Bhubaneswar",
    seoTitle: "PTL Freight Sambalpur to Bhubaneswar | LoadSaathi",
  },
  "sambalpur-to-jharsuguda": {
    from: "Sambalpur",
    to: "Jharsuguda",
    fromState: "Odisha",
    toState: "Odisha",
    distanceKm: 100,
    transitTime: "2",
    description: "Short-haul PTL and LTL freight from Sambalpur to Jharsuguda in western Odisha. LoadSaathi connects these industrial towns with quick, affordable trucking solutions.",
    metaDescription: "Book PTL/LTL freight from Sambalpur to Jharsuguda. Quick intrastate Odisha shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    keywords: "PTL freight Sambalpur to Jharsuguda, LTL transport Sambalpur Jharsuguda, Odisha freight, truck booking Jharsuguda, western Odisha logistics",
    seoTitle: "PTL Freight Sambalpur to Jharsuguda | LoadSaathi",
  },
};

// ── Static page SEO metadata ──────────────────────────────────────────────────
const STATIC_PAGE_DATA = {
  "/": {
    title: "Shared Freight Marketplace | PTL/LTL East India | LoadSaathi",
    metaDescription: "LoadSaathi connects shippers and truckers for PTL and LTL shared freight across East India. Save up to 40% on freight costs on the Rourkela–Ranchi–Burdwan corridor. Book part loads online.",
    keywords: "PTL freight Rourkela, LTL transport East India, shared truck Ranchi Burdwan, part load Jharkhand Odisha, freight marketplace India, truck booking Rourkela",
    summary: "LoadSaathi is India's AI-powered freight marketplace for booking trucks and loads across 500+ corridors."
  },
  "/about": {
    title: "About LoadSaathi - India's Trusted Freight Marketplace",
    metaDescription: "Learn about LoadSaathi's mission to connect shippers with verified truckers across India. Founded at NIT Rourkela, serving 500+ corridors.",
    keywords: ["about loadsaathi", "freight marketplace india", "nabh sagar sahu", "nit rourkela logistics"],
    summary: "LoadSaathi is India's AI-powered freight marketplace founded at NIT Rourkela, connecting shippers with verified truckers across 500+ corridors."
  },
  "/contact": {
    title: "Contact LoadSaathi - Get Help with Freight Booking",
    metaDescription: "Contact LoadSaathi for freight booking support. Reach us via email, phone, or visit our registered office. Available 24/7.",
    keywords: ["contact loadsaathi", "freight support india", "loadsaathi customer care"],
    summary: "Reach LoadSaathi for freight booking support via email, phone, or visit our registered office at NIT Rourkela."
  },
  "/pricing": {
    title: "LoadSaathi Pricing - Transparent Freight Rates",
    metaDescription: "View LoadSaathi's transparent pricing. Shipper: 1.5-3% platform fee. Trucker: 1.5-2.5% commission. No hidden charges.",
    keywords: ["loadsaathi pricing", "freight rates india", "trucking platform fees", "transparent freight pricing"],
    summary: "LoadSaathi charges transparent fees: 1.5-3% for shippers, 1.5-2.5% for truckers with no hidden charges."
  },
  "/tools": {
    title: "Freight Tools - Fare Calculator, Distance Finder | LoadSaathi",
    metaDescription: "Use free freight tools: fare calculator, distance finder, EMI calculator, and weight converter. Plan your shipments with confidence.",
    keywords: ["freight calculator", "fare estimator", "distance calculator india", "truck emi calculator", "weight converter"],
    summary: "Free freight tools: fare calculator, distance finder, EMI calculator, and weight converter for planning shipments."
  },
  "/features": {
    title: "LoadSaathi Features - AI Matching, Real-Time GPS Tracking, Smart Pricing",
    metaDescription: "Discover LoadSaathi features: AI-powered matching, real-time GPS tracking, instant quotes, secure payments, and digital credit scores.",
    keywords: ["loadsaathi features", "ai freight matching", "gps tracking trucks", "instant freight quotes"],
    summary: "LoadSaathi offers AI-powered matching, real-time GPS tracking, instant quotes, secure payments, and digital credit scores."
  },
  "/how-it-works": {
    title: "How LoadSaathi Works - Step-by-Step Freight Booking Guide",
    metaDescription: "Learn how LoadSaathi works: post your load, get matched with verified truckers, track shipment in real-time, and pay securely.",
    keywords: ["how loadsaathi works", "freight booking steps", "truck booking guide india", "shipment process"],
    summary: "Step-by-step guide: post your load, get matched with verified truckers, track in real-time, and pay securely."
  },
  "/privacy": {
    title: "Privacy Policy - LoadSaathi Data Protection",
    metaDescription: "Read LoadSaathi's privacy policy. Learn how we protect your personal and business data under Indian data protection laws.",
    keywords: ["loadsaathi privacy policy", "data protection india", "freight app privacy"],
    summary: "LoadSaathi's privacy policy explaining how we protect your personal and business data."
  },
  "/terms": {
    title: "Terms & Conditions - LoadSaathi Platform Agreement",
    metaDescription: "Read LoadSaathi's terms and conditions governing the use of our freight marketplace platform and services.",
    keywords: ["loadsaathi terms", "platform agreement", "freight marketplace terms", "trucking service conditions"],
    summary: "Terms and conditions governing the use of LoadSaathi's freight marketplace platform and services."
  },
  "/faq": {
    title: "LoadSaathi FAQ - Booking, Payments & Trucker Queries",
    metaDescription: "Answers to common LoadSaathi questions: how to book a truck, payments, tracking, refunds, trucker verification, and platform fees.",
    keywords: ["loadsaathi faq", "freight booking help", "trucking app questions", "payment support"],
    summary: "Answers to common questions about LoadSaathi: booking, payments, tracking, refunds, and trucker verification."
  },
  "/sitemap": {
    title: "Sitemap - LoadSaathi Website Index",
    metaDescription: "Navigate the LoadSaathi website with our complete sitemap. Find all pages including routes, blogs, tools, and more.",
    keywords: ["loadsaathi sitemap", "website index", "page navigation"],
    summary: "Complete sitemap of LoadSaathi website for easy navigation."
  },
  "/login": {
    title: "Login - LoadSaathi Account Access",
    metaDescription: "Log in to your LoadSaathi account. Access your dashboard, manage shipments, track loads, and view reports.",
    keywords: ["loadsaathi login", "account access", "freight platform login"],
    summary: "Log in to your LoadSaathi account to access dashboard and manage shipments.",
    noindex: true
  },
  "/hi": {
    title: "ऑनलाइन ट्रक बुकिंग भारत — PTL/FTL भाड़ा | LoadSaathi",
    metaDescription: "पूर्वी भारत में AI-संचालित शेयर्ड फ्रेट मार्केटप्लेस। PTL, FTL और रिटर्न लोड बुक करें — लाइव GPS ट्रैकिंग और सुरक्षित पेमेंट के साथ।",
    keywords: ["online truck booking hindi", "truck book kaise kare", "part load booking india", "return load bharat"],
    summary: "भारत में ऑनलाइन ट्रक बुकिंग: PTL, FTL और रिटर्न लोड हिंदी में।"
  },
  "/hi/ptl-transport": {
    title: "PTL ट्रांसपोर्ट भारत — पार्ट ट्रक लोड बुकिंग | LoadSaathi",
    metaDescription: "MSME के लिए किफ़ायती PTL शिपिंग: 0.5–3 टन माल 30–40% कम लागत में भेजें। AI-मैच्ड ट्रक, लाइव GPS ट्रैकिंग।",
    keywords: ["ptl transport hindi", "part load booking", "chhota maal bhejna", "ptl vs ftl hindi"],
    summary: "PTL ट्रांसपोर्ट: छोटा माल साझा ट्रक में 30–40% सस्ता भेजें।"
  },
  "/hi/return-load": {
    title: "रिटर्न लोड भारत — खाली वापसी पर कमाई | LoadSaathi",
    metaDescription: "डिलीवरी के बाद खाली लौटने के बजाय वापसी का माल पाएं। AI मैचिंग से राउंड ट्रिप पर 40–60% ज़्यादा कमाई।",
    keywords: ["return load hindi", "khali truck load", "wapsi ka maal", "return load kaise milega"],
    summary: "रिटर्न लोड: खाली वापसी को कमाई में बदलें।"
  },
  "/hi/bhada-kaise-book-kare": {
    title: "ट्रक भाड़ा कैसे बुक करें — स्टेप-बाय-स्टेप गाइड | LoadSaathi",
    metaDescription: "बिना दलाल के ऑनलाइन ट्रक बुक करने की पूरी प्रक्रिया: माल पोस्ट करना, AI मैचिंग, GPS ट्रैकिंग और सुरक्षित पेमेंट।",
    keywords: ["truck kaise book kare", "bhada booking online", "bina dalal truck", "maal bhejne ka tarika"],
    summary: "बिना दलाल के ऑनलाइन ट्रक बुक करने की स्टेप-बाय-स्टेप गाइड।"
  },
  "/hi/route/rourkela-to-ranchi": {
    title: "राउरकेला से रांची भाड़ा — PTL/FTL ट्रक बुकिंग | LoadSaathi",
    metaDescription: "राउरकेला–रांची (180 किमी) कॉरिडोर पर PTL ₹14–₹22/किलो, FTL ₹15,300–₹21,600। लाइव GPS ट्रैकिंग के साथ बुक करें।",
    keywords: ["rourkela ranchi bhada", "rourkela se ranchi truck", "ranchi freight rate hindi"],
    summary: "राउरकेला–रांची कॉरिडोर की PTL/FTL भाड़ा दरें और बुकिंग।"
  },
  "/register": {
    title: "Sign Up - Create LoadSaathi Account",
    metaDescription: "Create your free LoadSaathi account. Register as shipper or trucker to start booking or carrying freight loads.",
    keywords: ["loadsaathi signup", "create account", "register shipper", "register trucker"],
    summary: "Create your free LoadSaathi account as shipper or trucker."
  },
  "/blog": {
    title: "Logistics Blog - Trucking Tips & Freight Guides | LoadSaathi",
    metaDescription: "Practical guides on trucking, return loads, PTL vs FTL shipping, freight pricing, and Indian logistics trends from the LoadSaathi team.",
    keywords: ["trucking blog india", "freight logistics articles", "loadsaathi blog", "truck driver tips"],
    summary: "Articles and guides covering trucking business advice, freight market trends, and shipping best practices in India."
  },
  "/routes": {
    title: "Freight Routes - 30+ India Corridors | LoadSaathi",
    metaDescription: "Explore 30+ freight routes across India: distance, transit time, truck rates, and toll costs for corridors like Jamshedpur-Delhi and Rourkela-Kolkata.",
    keywords: ["freight routes india", "truck routes", "transport corridor india", "loadsaathi routes"],
    summary: "Directory of 30+ intercity freight routes with distance, transit time, and rate estimates for planning shipments."
  },
  "/compare": {
    title: "LoadSaathi vs Vahak vs BlackBuck - Freight App Comparison",
    metaDescription: "Compare LoadSaathi with Vahak, BlackBuck, Trukky, and Porter: features, pricing, coverage, GPS tracking, and trucker payouts in one table.",
    keywords: ["loadsaathi vs vahak", "blackbuck vs loadsaathi", "freight app comparison india", "truck booking app comparison"],
    summary: "Side-by-side comparison of LoadSaathi and leading Indian freight platforms across features, fees, and coverage."
  },
  "/safety-trust": {
    title: "Safety & Trust - Verified Truckers | LoadSaathi",
    metaDescription: "How LoadSaathi keeps freight safe: trucker KYC verification, GPS tracking, escrow-backed payments, and dispute resolution for shippers.",
    keywords: ["verified truckers india", "freight safety", "safe truck booking", "loadsaathi trust"],
    summary: "LoadSaathi's safety features: verified truckers, live GPS tracking, escrow payments, and dispute support."
  },
  "/gallery": {
    title: "App Screenshots & Demo - LoadSaathi Freight Platform",
    metaDescription: "See the LoadSaathi app: screenshots of dashboards, load matching, GPS tracking, chat, and credit score for shippers and truckers.",
    keywords: ["loadsaathi screenshots", "freight app demo", "truck booking app images", "loadsaathi gallery"],
    summary: "Screenshots and previews of the LoadSaathi web and mobile app across its core features."
  },
  "/for-msmes": {
    title: "LoadSaathi for MSMEs - Freight Savings for Small Business",
    metaDescription: "How Indian MSMEs cut freight costs with LoadSaathi: transparent rates, part-load options, GST invoices, and shipment tracking.",
    keywords: ["freight for msme", "small business shipping india", "truck booking for business", "loadsaathi msmes"],
    summary: "LoadSaathi helps MSMEs reduce logistics costs with transparent pricing, part-loads, and verified carriers."
  },
  "/ai-logistics": {
    title: "AI in Indian Logistics - Smarter Freight Matching | LoadSaathi",
    metaDescription: "How LoadSaathi uses AI for load-truck matching, route optimization, and freight price prediction to reduce empty runs in Indian logistics.",
    keywords: ["ai logistics india", "ai freight matching", "smart truck dispatch", "ai in trucking"],
    summary: "AI-driven matching, routing, and pricing that cut empty kilometers and freight costs for Indian shippers and truckers."
  },
  "/data": {
    title: "Freight Data & Market Insights - LoadSaathi",
    metaDescription: "Freight market data and logistics insights: corridor rates, demand trends, and trucking statistics for Indian shipping decisions.",
    keywords: ["freight market data india", "trucking statistics", "logistics insights", "loadsaathi data"],
    summary: "Market insights and freight data from the LoadSaathi platform for shippers and truckers."
  },
  "/freight-intelligence": {
    title: "Freight Intelligence - Data-Driven Logistics Decisions",
    metaDescription: "LoadSaathi freight intelligence: rate benchmarks, corridor demand signals, and predictive insights to plan shipments smarter.",
    keywords: ["freight intelligence", "freight rate benchmarks", "logistics analytics india", "trucking demand data"],
    summary: "Analytics and rate intelligence that help shippers and truckers make better freight decisions."
  },
  "/freight-marketplace": {
    title: "Online Freight Marketplace India - Shippers Meet Truckers",
    metaDescription: "LoadSaathi is an online freight marketplace connecting Indian shippers with verified truckers for PTL and FTL loads with instant pricing.",
    keywords: ["freight marketplace india", "online truck booking", "load transport marketplace", "shipper trucker platform"],
    summary: "Two-sided marketplace where shippers post loads and verified truckers bid and book."
  },
  "/return-load": {
    title: "Return Loads for Truckers - Reduce Empty KM | LoadSaathi",
    metaDescription: "Find return loads on LoadSaathi to cut empty kilometers between trips. Book backhaul freight and increase truck earnings on every route.",
    keywords: ["return load for trucker", "backhaul loads india", "empty truck loads", "return trip loads"],
    summary: "Backhaul and return-load discovery that helps truckers fill empty return trips and earn more."
  },
  "/ptl-transport": {
    title: "PTL Transport - Partial Truckload Shipping India",
    metaDescription: "PTL (partial truckload) shipping with LoadSaathi: share truck space, pay only for your load, and ship smaller cargo across India affordably.",
    keywords: ["ptl transport", "partial truckload india", "part load truck booking", "shared truck shipping"],
    summary: "Partial truckload service that lets shippers share truck space and pay only for the volume they ship."
  },
  "/ltl-transport": {
    title: "LTL Shipping - Less Than Truckload Freight India",
    metaDescription: "LTL freight made simple: consolidate smaller shipments with LoadSaathi, get transparent per-kg rates, and track deliveries in real time.",
    keywords: ["ltl shipping india", "less than truckload freight", "ltl logistics", "small shipment truck"],
    summary: "Less-than-truckload shipping with consolidated cargo, per-kg pricing, and live tracking."
  },
  "/truck-load-booking": {
    title: "Truck Load Booking Online - Book Truck for Cargo India",
    metaDescription: "Book a truck online with LoadSaathi: get instant quotes, compare verified truckers, and track your cargo from pickup to delivery.",
    keywords: ["book truck online india", "truck load booking", "cargo truck booking", "hire truck for goods"],
    summary: "End-to-end online truck booking: instant quotes, verified truckers, and live cargo tracking."
  },
  "/truck-near-me": {
    title: "Truck Near Me - Find a Truck for Loading Nearby",
    metaDescription: "Searching for a truck near you? Compare trucks, market rates and trucker credit scores on LoadSaathi, then book without calling brokers. Live in Odisha, Jharkhand and West Bengal.",
    keywords: ["truck near me", "transport service near me", "truck booking near me", "hire truck for loading", "goods carrier near me", "lorry near me"],
    summary: "Find trucks near your location: compare capacity, market rates and verified trucker credit scores, then book with live GPS tracking."
  },
  "/fare-calculator": {
    title: "Truck Fare Calculator - Estimate Freight Cost India",
    metaDescription: "Free truck fare calculator: estimate freight charges per km and per kg for any Indian route, including tolls and diesel estimates.",
    keywords: ["truck fare calculator", "freight cost calculator india", "truck rate per km", "transport charge calculator"],
    summary: "Free calculator that estimates truck freight charges by distance, weight, and route."
  },
  "/transport-cost-calculator": {
    title: "Transport Cost Calculator - Per KM Truck Charges India",
    metaDescription: "Calculate transport cost per kilometre for Indian trucks. Factor in distance, load type, tolls, and fuel for an accurate freight estimate.",
    keywords: ["transport cost calculator", "truck charges per km", "freight cost per km india", "logistics cost calculator"],
    summary: "Per-kilometre transport cost calculator covering fuel, tolls, and load type."
  },
  "/truck-load-calculator": {
    title: "Truck Load Calculator - Weight, Volume & Truck Size",
    metaDescription: "Find the right truck for your cargo: calculate weight, volume, and recommended truck type (Tata 407, 1109, 3118) for Indian shipments.",
    keywords: ["truck load calculator", "truck capacity calculator", "which truck for my load", "cargo volume calculator"],
    summary: "Calculates cargo weight and volume and suggests the right Indian truck type."
  },
  "/ptl-vs-ftl-calculator": {
    title: "PTL vs FTL Calculator - Which Truckload Type is Cheaper?",
    metaDescription: "Compare partial truckload (PTL) vs full truckload (FTL) costs. See which option saves money for your shipment weight and route.",
    keywords: ["ptl vs ftl", "partial vs full truckload", "ptl ftl calculator", "truckload cost comparison"],
    summary: "Side-by-side PTL vs FTL cost comparison to pick the cheaper shipping mode."
  },
  "/freight-rate-calculator": {
    title: "Freight Rate Calculator - Estimate Per KG/Per KM Rates",
    metaDescription: "Estimate freight rates per kg and per km for any Indian corridor. Compare market rates before booking trucks with LoadSaathi.",
    keywords: ["freight rate calculator", "per kg freight rate india", "truck rate estimate", "shipping rate calculator"],
    summary: "Estimates per-kg and per-km freight rates for Indian routes."
  },
  "/return-load-calculator": {
    title: "Return Load Calculator - Save on Empty Truck Trips",
    metaDescription: "Estimate how much empty return trips cost you and what you save by booking backhaul loads on LoadSaathi instead.",
    keywords: ["return load savings", "empty km calculator", "backhaul savings calculator", "truck fuel savings"],
    summary: "Shows the cost of empty return runs and savings from filling them with backhaul loads."
  },
  "/tools/fare-calculator": {
    title: "Truck Fare Calculator - Estimate Freight Cost India",
    metaDescription: "Free truck fare calculator: estimate freight charges per km and per kg for any Indian route, including tolls and diesel estimates.",
    keywords: ["truck fare calculator", "freight cost calculator india", "truck rate per km", "transport charge calculator"],
    summary: "Free calculator that estimates truck freight charges by distance, weight, and route."
  },
  "/tools/truck-load-calculator": {
    title: "Truck Load Calculator - Weight, Volume & Truck Size",
    metaDescription: "Find the right truck for your cargo: calculate weight, volume, and recommended truck type (Tata 407, 1109, 3118) for Indian shipments.",
    keywords: ["truck load calculator", "truck capacity calculator", "which truck for my load", "cargo volume calculator"],
    summary: "Calculates cargo weight and volume and suggests the right Indian truck type."
  },
  "/tools/ptl-vs-ftl-calculator": {
    title: "PTL vs FTL Calculator - Which Truckload Type is Cheaper?",
    metaDescription: "Compare partial truckload (PTL) vs full truckload (FTL) costs. See which option saves money for your shipment weight and route.",
    keywords: ["ptl vs ftl", "partial vs full truckload", "ptl ftl calculator", "truckload cost comparison"],
    summary: "Side-by-side PTL vs FTL cost comparison to pick the cheaper shipping mode."
  },
  "/tools/freight-rate-calculator": {
    title: "Freight Rate Calculator - Estimate Per KG/Per KM Rates",
    metaDescription: "Estimate freight rates per kg and per km for any Indian corridor. Compare market rates before booking trucks with LoadSaathi.",
    keywords: ["freight rate calculator", "per kg freight rate india", "truck rate estimate", "shipping rate calculator"],
    summary: "Estimates per-kg and per-km freight rates for Indian routes."
  },
  "/tools/return-load-calculator": {
    title: "Return Load Calculator - Save on Empty Truck Trips",
    metaDescription: "Estimate how much empty return trips cost you and what you save by booking backhaul loads on LoadSaathi instead.",
    keywords: ["return load savings", "empty km calculator", "backhaul savings calculator", "truck fuel savings"],
    summary: "Shows the cost of empty return runs and savings from filling them with backhaul loads."
  },
  "/solutions/shippers": {
    title: "LoadSaathi for Shippers - Book Trucks at Best Rates",
    metaDescription: "LoadSaathi for shippers: post loads, get instant quotes from verified truckers, track shipments live, and pay securely with GST invoices.",
    keywords: ["book truck for cargo", "shipper solution india", "freight booking for business", "loadsaathi for shippers"],
    summary: "Shipper-focused solution: post loads, instant quotes, live tracking, secure payments."
  },
  "/solutions/truckers": {
    title: "LoadSaathi for Truckers - Find Loads & Earn More",
    metaDescription: "LoadSaathi for truckers: find return loads, get fair freight rates, reduce empty kilometers, and get paid fast for every trip.",
    keywords: ["find loads for my truck", "trucker solution india", "load matching for truckers", "loadsaathi for truckers"],
    summary: "Trucker-focused solution: load discovery, fair rates, fewer empty runs, fast payouts."
  },
  "/tools/route-optimizer": {
    title: "Truck Route Optimizer - Find Shortest Route India",
    metaDescription: "Optimize truck routes to save fuel and time: compare route distances and transit times for Indian corridors.",
    keywords: ["route optimizer truck", "shortest route calculator india", "truck route planning", "fuel efficient route"],
    summary: "Route optimization tool comparing distances and transit times for Indian freight corridors."
  },
  "/tools/empty-km-savings": {
    title: "Empty KM Savings Calculator - Cut Truck Deadhead Miles",
    metaDescription: "Calculate how much you lose to empty (deadhead) kilometres and how much you save by booking return loads on LoadSaathi.",
    keywords: ["empty km savings", "deadhead miles calculator", "empty running cost truck", "backhaul savings"],
    summary: "Quantifies losses from empty running and savings from backhaul loads."
  },
  "/tools/trip-profit": {
    title: "Truck Trip Profit Calculator - Estimate Earnings Per Trip",
    metaDescription: "Estimate profit per truck trip: subtract fuel, tolls, driver, and maintenance costs from freight income to know your real earnings.",
    keywords: ["truck trip profit calculator", "trucker earnings calculator", "per trip profit india", "truck business profit"],
    summary: "Per-trip profit calculator accounting for fuel, tolls, driver pay, and maintenance."
  },
  "/tools/shared-savings": {
    title: "Shared Load Savings Calculator - PTL Cost Split",
    metaDescription: "See how much shippers save by sharing truck space (PTL) instead of booking a full truck for smaller loads.",
    keywords: ["shared truck savings", "ptl savings calculator", "share truck cost", "partial load savings"],
    summary: "Compares full-truck vs shared-space cost to show PTL savings."
  },
  "/tools/document-checklist": {
    title: "Truck Transport Document Checklist - RC, Permit, Insurance",
    metaDescription: "Essential Indian truck transport documents: RC, permit, insurance, fitness certificate, e-way bill, and driver papers checklist.",
    keywords: ["truck documents checklist", "transport permit india", "goods carrier documents", "truck rc permit insurance"],
    summary: "Checklist of mandatory documents for legal goods transport in India."
  },
  "/tools/carbon-savings": {
    title: "Carbon Emissions Savings Calculator - Green Logistics",
    metaDescription: "Estimate CO2 savings from optimized routes and shared loads. Measure the environmental impact of smarter freight planning.",
    keywords: ["carbon savings logistics", "co2 calculator freight", "green logistics india", "emission reduction transport"],
    summary: "Estimates CO2 reductions from route optimization and load consolidation."
  },
  "/tools/toll-fuel": {
    title: "Toll & Fuel Cost Calculator - India Truck Trip Expenses",
    metaDescription: "Estimate toll charges and diesel costs for Indian truck trips by route and truck type before you book.",
    keywords: ["toll calculator india", "diesel cost calculator truck", "trip fuel cost", "truck running cost"],
    summary: "Estimates toll and fuel expenses for a given Indian route and truck type."
  },
  "/tools/gst-calculator": {
    title: "Freight GST Calculator - Calculate GST on Transport Bill",
    metaDescription: "Calculate GST on freight and transport charges in India. Enter invoice amount to get the applicable GST split for logistics bills.",
    keywords: ["gst on freight", "transport gst calculator", "goods transport tax india", "logistics invoice gst"],
    summary: "Applies the correct GST rate to freight and transport invoice amounts."
  },
  "/tools/payload-utilization": {
    title: "Payload Utilization Calculator - Maximize Truck Capacity",
    metaDescription: "Measure truck payload utilization: compare cargo weight and volume against rated capacity to avoid running half-empty trucks.",
    keywords: ["payload utilization", "truck capacity utilization", "gvw calculator", "truck load efficiency"],
    summary: "Compares actual load against rated truck capacity to flag underutilisation."
  },
  "/screens/dashboard": {
    title: "Dashboard Preview - LoadSaathi App Screens",
    metaDescription: "Preview of the LoadSaathi dashboard screen for shippers and truckers.",
    keywords: ["loadsaathi dashboard preview"],
    summary: "In-app preview of the LoadSaathi dashboard.",
    noindex: true
  },
  "/screens/matching": {
    title: "Load Matching Preview - LoadSaathi App Screens",
    metaDescription: "Preview of the LoadSaathi AI load-truck matching screen.",
    keywords: ["load matching preview"],
    summary: "In-app preview of AI load matching.",
    noindex: true
  },
  "/screens/chat": {
    title: "Chat Preview - LoadSaathi App Screens",
    metaDescription: "Preview of the LoadSaathi shipper-trucker chat screen.",
    keywords: ["freight chat preview"],
    summary: "In-app preview of shipper-trucker chat.",
    noindex: true
  },
  "/screens/credit-score": {
    title: "Credit Score Preview - LoadSaathi App Screens",
    metaDescription: "Preview of the LoadSaathi trucker credit score screen.",
    keywords: ["trucker credit score preview"],
    summary: "In-app preview of the credit score screen.",
    noindex: true
  },
  "/screens/reviews": {
    title: "Reviews Preview - LoadSaathi App Screens",
    metaDescription: "Preview of the LoadSaathi reviews screen for shippers and truckers.",
    keywords: ["freight reviews preview"],
    summary: "In-app preview of the reviews screen.",
    noindex: true
  },
  "/screens/admin": {
    title: "Admin Preview - LoadSaathi App Screens",
    metaDescription: "Preview of the LoadSaathi admin moderation screen.",
    keywords: ["admin preview"],
    summary: "In-app preview of the admin screen.",
    noindex: true
  }
};

// ── Blog SEO metadata (71 articles) ──────────────────────────────────────────
const BLOG_DATA = {
  "reduce-empty-kilometers": {
    "title": "5 Ways to Reduce Empty Truck Kilometers | LoadSaathi",
    "metaDescription": "Empty truck kilometers cost ₹35-45 per km to operate. Indian truckers can reduce deadheading by using digital load boards proactively, building route...",
    "keywords": [
      "5 ways to reduce empty truck kilometers",
      "reduce empty kilometers",
      "trucker tips"
    ],
    "summary": "Empty truck kilometers cost ₹35-45 per km to operate. Indian truckers can reduce deadheading by using digital load boards proactively, building route clusters on high-demand corridors, leveraging credit scores for priority matching, joining networks early, and accepting partial loads when full returns aren't available.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-06-10",
    "readTime": "4 min",
    "faq": [],
    "category": "Trucker Tips",
    "lastUpdated": "2026-07-05"
  },
  "freight-credit-score-guide": {
    "title": "Understanding the Digital Freight Credit Score | LoadSaathi",
    "metaDescription": "The LoadSaathi Digital Freight Credit Score ranges from 300 to 900, calculated from five factors: completion rate (30%), reliability (25%), reviews (20%)...",
    "keywords": [
      "understanding the digital freight credit score",
      "freight credit score guide",
      "product updates"
    ],
    "summary": "The LoadSaathi Digital Freight Credit Score ranges from 300 to 900, calculated from five factors: completion rate (30%), reliability (25%), reviews (20%), communication (15%), and tenure (10%). A score above 750 unlocks priority matching, expanded load visibility, and faster dispute resolution.",
    "author": "Priya Sharma",
    "authorBio": "Priya Sharma is the Product Lead at LoadSaathi, specializing in trust and reputation systems for marketplace platforms.",
    "date": "2026-06-05",
    "readTime": "6 min",
    "faq": [],
    "category": "Product Updates",
    "lastUpdated": "2026-07-08"
  },
  "first-shipment-guide": {
    "title": "The Complete Guide to Posting Your First Shipment | LoadSaathi",
    "metaDescription": "Posting a shipment on LoadSaathi takes under 3 minutes. Provide accurate origin/destination, weight, and cargo details for best AI matching. Use the AI Price...",
    "keywords": [
      "the complete guide to posting your first shipment",
      "first shipment guide",
      "shipper guide"
    ],
    "summary": "Posting a shipment on LoadSaathi takes under 3 minutes. Provide accurate origin/destination, weight, and cargo details for best AI matching. Use the AI Price Predictor for market-aligned rates, review trucker credit scores and reviews before selecting, and communicate through the in-app chat for dispute protection.",
    "author": "Amit Verma",
    "authorBio": "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    "date": "2026-05-28",
    "readTime": "7 min",
    "faq": [],
    "category": "Shipper Guide",
    "lastUpdated": "2026-07-12"
  },
  "real-time-tracking-launch": {
    "title": "LoadSaathi Launches Real-Time GPS Tracking | LoadSaathi",
    "metaDescription": "LoadSaathi's real-time GPS tracking shares live trucker location with shippers via interactive maps, providing ETAs, route visualization, and geofence...",
    "keywords": [
      "loadsaathi launches real time gps tracking",
      "real time tracking launch",
      "product updates"
    ],
    "summary": "LoadSaathi's real-time GPS tracking shares live trucker location with shippers via interactive maps, providing ETAs, route visualization, and geofence alerts. The feature doubles as proof-of-delivery, feeding into the credit score system. Built on Leaflet and OSRM, location data stays within the platform for privacy.",
    "author": "Vikram Singh",
    "authorBio": "Vikram Singh is the CTO at LoadSaathi, overseeing platform architecture and mapping infrastructure.",
    "date": "2026-05-12",
    "readTime": "3 min",
    "faq": [],
    "category": "Product Updates",
    "lastUpdated": "2026-06-20"
  },
  "ai-price-prediction": {
    "title": "How Our AI Price Predictions Work | LoadSaathi",
    "metaDescription": "LoadSaathi's AI Price Predictor uses a multi-provider chain (Gemini, Groq, OpenRouter, local algorithms) to recommend fair freight rates. Each prediction...",
    "keywords": [
      "how our ai price predictions work",
      "ai price prediction",
      "product updates"
    ],
    "summary": "LoadSaathi's AI Price Predictor uses a multi-provider chain (Gemini, Groq, OpenRouter, local algorithms) to recommend fair freight rates. Each prediction includes price per tonne, confidence range, market trend, and reasoning. The system learns from every transaction, converging to within 8% of actual accepted rates after 100 transactions per route.",
    "author": "Priya Sharma",
    "authorBio": "Priya Sharma is the Product Lead at LoadSaathi, specializing in trust and reputation systems for marketplace platforms.",
    "date": "2026-05-05",
    "readTime": "6 min",
    "faq": [],
    "category": "Product Updates",
    "lastUpdated": "2026-07-01"
  },
  "broker-to-direct-shipper": {
    "title": "From Broker-Dependent to Direct: One Shipper's Journey | LoadSaathi",
    "metaDescription": "Sharma Fabrics in Delhi reduced logistics costs by 28% (₹4.2 lakh/month savings) after switching from brokers to LoadSaathi. On-time delivery improved from...",
    "keywords": [
      "from broker dependent to direct one shipper s journey",
      "broker to direct shipper",
      "case study"
    ],
    "summary": "Sharma Fabrics in Delhi reduced logistics costs by 28% (₹4.2 lakh/month savings) after switching from brokers to LoadSaathi. On-time delivery improved from 62% to 94%, and freight arrangement time dropped from 8 hours/week to under 1 hour.",
    "author": "Amit Verma",
    "authorBio": "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    "date": "2026-04-28",
    "readTime": "8 min",
    "faq": [],
    "category": "Case Study",
    "lastUpdated": "2026-06-15"
  },
  "indian-logistics-eway-bill-gst-2026": {
    "title": "e-Way Bill Rules 2026: New GST Compliance Changes Every Indian Business Must Know | LoadSaathi",
    "metaDescription": "The GSTN put the Ship-To GSTIN field and voluntary e-Way Bill closure on hold under Advisory 668, announced August 5, 2026 — no system changes are required...",
    "keywords": [
      "e way bill rules 2026 new gst compliance changes every indian business must know",
      "indian logistics eway bill gst 2026",
      "industry insights"
    ],
    "summary": "The GSTN put the Ship-To GSTIN field and voluntary e-Way Bill closure on hold under Advisory 668, announced August 5, 2026 — no system changes are required for now. This guide explains the current status of both proposals, what remains unchanged under existing e-Way Bill rules, penalty risks, transporter obligations — including Part-B vehicle details and driver documentation — and how LoadSaathi automates compliance for freight operators.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry. With deep expertise in GST compliance, e-Way Bill automation, and MSME freight operations, the team helps Indian businesses navigate regulatory changes in real time.",
    "date": "2026-07-23",
    "readTime": "14 min",
    "faq": [
      {
        "question": "What is the current status of the Ship-To GSTIN requirement in 2026?",
        "answer": "The mandatory Ship-To GSTIN rule is on hold under GSTN Advisory 668 (August 5, 2026). No system or process changes are required until GSTN re-notifies it. The Ship-To field remains optional, and the existing single-GSTIN workflow continues to work."
      },
      {
        "question": "Can I still use a single GSTIN for multi-location shipments?",
        "answer": "Yes. Because the Ship-To GSTIN requirement is on hold, using a single GSTIN for invoicing remains valid. When the rule is eventually implemented, the actual destination entity's GSTIN (or URP for unregistered recipients) will need to be recorded."
      },
      {
        "question": "What happens if my e-Way Bill data doesn't match my GSTR-3B filing?",
        "answer": "Standard e-Way Bill matching rules continue to apply. Discrepancies between e-Way Bill data and GSTR-3B filings can still trigger scrutiny and, where goods move without a valid e-Way Bill, penalties of up to 200% of the tax amount under existing provisions."
      },
      {
        "question": "Is voluntary e-Way Bill closure available now?",
        "answer": "No. Voluntary e-Way Bill closure is also on hold under GSTN Advisory 668. e-Way Bills continue to close automatically on expiry as before; no workflow change is required until GSTN re-notifies the feature."
      },
      {
        "question": "What is the penalty for non-compliance with e-Way Bill rules?",
        "answer": "Penalties for moving goods without a valid e-Way Bill or with invoice-to-cargo mismatches can reach up to 200% of the tax amount. Existing rules and penalties are unchanged by Advisory 668."
      }
    ],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-14"
  },
  "rourkela-to-ranchi-trucking-rates": {
    "title": "Trucking Rates from Rourkela to Ranchi: Complete Pricing Guide 2026 | LoadSaathi",
    "metaDescription": "Trucking rates from Rourkela to Ranchi typically range from ₹1,800-2,500 per tonne for PTL loads depending on cargo type, vehicle availability, and season...",
    "keywords": [
      "trucking rates from rourkela to ranchi complete pricing guide 2026",
      "rourkela to ranchi trucking rates",
      "shipper guide"
    ],
    "summary": "Trucking rates from Rourkela to Ranchi typically range from ₹1,800-2,500 per tonne for PTL loads depending on cargo type, vehicle availability, and season. This 180 km corridor connects two major industrial cities and sees consistent demand in both directions.",
    "author": "Amit Verma",
    "authorBio": "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    "date": "2026-07-25",
    "readTime": "5 min",
    "faq": [],
    "category": "Shipper Guide"
  },
  "jamshedpur-to-kolkata-freight-rates": {
    "title": "Jamshedpur to Kolkata Freight Rates: What to Expect in 2026 | LoadSaathi",
    "metaDescription": "Freight rates from Jamshedpur to Kolkata range from ₹2,000-2,800 per tonne for PTL loads over the 280 km route. This Jharkhand to West Bengal corridor is...",
    "keywords": [
      "jamshedpur to kolkata freight rates what to expect in 2026",
      "jamshedpur to kolkata freight rates",
      "shipper guide"
    ],
    "summary": "Freight rates from Jamshedpur to Kolkata range from ₹2,000-2,800 per tonne for PTL loads over the 280 km route. This Jharkhand to West Bengal corridor is vital for steel, automotive, and manufactured goods shipments.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-07-22",
    "readTime": "4 min",
    "faq": [],
    "category": "Shipper Guide",
    "lastUpdated": "2026-08-22"
  },
  "how-to-ship-textiles-india": {
    "title": "Textile Shipping Guide: Transporting Fabrics and Garments Safely | LoadSaathi",
    "metaDescription": "Shipping textiles requires clean, dry trucks, proper packing in waterproof materials, and careful handling to prevent damage. India's textile hubs include...",
    "keywords": [
      "textile shipping guide transporting fabrics and garments safely",
      "how to ship textiles india",
      "shipper guide"
    ],
    "summary": "Shipping textiles requires clean, dry trucks, proper packing in waterproof materials, and careful handling to prevent damage. India's textile hubs include Ludhiana, Surat, Tirupur, and Kolkata. PTL shipping is often the most cost-effective option for textile manufacturers.",
    "author": "Priya Sharma",
    "authorBio": "Priya Sharma is the Product Lead at LoadSaathi, specializing in trust and reputation systems for marketplace platforms.",
    "date": "2026-07-15",
    "readTime": "5 min",
    "faq": [],
    "category": "Shipper Guide",
    "lastUpdated": "2026-08-22"
  },
  "seafood-transport-odisha": {
    "title": "Cold Chain Transport: Shipping Seafood from Odisha Ports | LoadSaathi",
    "metaDescription": "Odisha's seafood industry ships frozen fish, shrimp, and crab from Paradip and Gopalpur ports to markets in Kolkata, Bengaluru, and Delhi. Reefers...",
    "keywords": [
      "cold chain transport shipping seafood from odisha ports",
      "seafood transport odisha",
      "trucker tips"
    ],
    "summary": "Odisha's seafood industry ships frozen fish, shrimp, and crab from Paradip and Gopalpur ports to markets in Kolkata, Bengaluru, and Delhi. Reefers (refrigerated trucks) are mandatory, with temperature maintained at -18°C to -20°C throughout transit.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-07-12",
    "readTime": "5 min",
    "faq": [],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-22"
  },
  "coal-transport-jharkhand": {
    "title": "Coal Transport in Jharkhand: Logistics for the Energy Sector | LoadSaathi",
    "metaDescription": "Jharkhand produces over 140 million tonnes of coal annually, primarily transported from Dhanbad, Ranchi, and Hazaribagh to power plants and industrial...",
    "keywords": [
      "coal transport in jharkhand logistics for the energy sector",
      "coal transport jharkhand",
      "industry insights"
    ],
    "summary": "Jharkhand produces over 140 million tonnes of coal annually, primarily transported from Dhanbad, Ranchi, and Hazaribagh to power plants and industrial consumers. Heavy-duty tippers and trailers are the standard vehicles, with rates varying by distance and road quality.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    "date": "2026-07-10",
    "readTime": "5 min",
    "faq": [],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-22"
  },
  "shipping-agricultural-products-india": {
    "title": "Shipping Agricultural Products: A Guide for Farmers and Traders | LoadSaathi",
    "metaDescription": "Agricultural shipping requires careful planning: use ventilated trucks for fresh produce, avoid overloading, and plan transport during cooler hours. Key...",
    "keywords": [
      "shipping agricultural products a guide for farmers and traders",
      "shipping agricultural products india",
      "trucker tips"
    ],
    "summary": "Agricultural shipping requires careful planning: use ventilated trucks for fresh produce, avoid overloading, and plan transport during cooler hours. Key agri-routes in East India include Balasore–Bhubaneswar (rice), Berhampur–Kolkata (vegetables), and Rourkela–Sambalpur (forest produce).",
    "author": "Amit Verma",
    "authorBio": "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    "date": "2026-07-08",
    "readTime": "6 min",
    "faq": [],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-22"
  },
  "monsoon-logistics-tips": {
    "title": "Monsoon Logistics: Shipping During India's Rainy Season | LoadSaathi",
    "metaDescription": "Monsoon season (June–September) adds 15–20% to freight rates and increases transit times by 20–30%. Protect cargo with waterproof packaging, heavy-duty...",
    "keywords": [
      "monsoon logistics shipping during india s rainy season",
      "monsoon logistics tips",
      "trucker tips"
    ],
    "summary": "Monsoon season (June–September) adds 15–20% to freight rates and increases transit times by 20–30%. Protect cargo with waterproof packaging, heavy-duty lashing, and GPS tracking. Book 48–72 hours early for best rates. Flood-prone routes in Odisha, Jharkhand, and West Bengal require careful planning.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-07-05",
    "readTime": "5 min",
    "faq": [],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-22"
  },
  "how-to-become-truck-owner-india": {
    "title": "How to Become a Truck Owner in India: 2026 Guide | LoadSaathi",
    "metaDescription": "Starting a trucking business in India requires ₹15-35 lakh for a used truck or ₹30-70 lakh for a new one. Essential steps include obtaining a commercial...",
    "keywords": [
      "how to become a truck owner in india 2026 guide",
      "how to become truck owner india",
      "trucker tips"
    ],
    "summary": "Starting a trucking business in India requires ₹15-35 lakh for a used truck or ₹30-70 lakh for a new one. Essential steps include obtaining a commercial vehicle registration, Transport Business permit (GST), National Permit for inter-state operations, and comprehensive insurance. Digital load boards like LoadSaathi can help new owners find loads immediately.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-07-01",
    "readTime": "8 min",
    "faq": [],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-22"
  },
  "digital-payments-for-truckers": {
    "title": "Digital Payments for Truckers: How LoadSaathi Ensures Fast Settlement | LoadSaathi",
    "metaDescription": "LoadSaathi processes payments through escrow-backed settlement: shippers pay into escrow at booking, funds are released to truckers within 24-48 hours of...",
    "keywords": [
      "digital payments for truckers how loadsaathi ensures fast settlement",
      "digital payments for truckers",
      "product updates"
    ],
    "summary": "LoadSaathi processes payments through escrow-backed settlement: shippers pay into escrow at booking, funds are released to truckers within 24-48 hours of delivery confirmation. Digital payments eliminate the traditional 30-45 day payment cycles that truckers face in broker-mediated models.",
    "author": "Priya Sharma",
    "authorBio": "Priya Sharma is the Product Lead at LoadSaathi, specializing in trust and reputation systems for marketplace platforms.",
    "date": "2026-06-28",
    "readTime": "4 min",
    "faq": [],
    "category": "Product Updates",
    "lastUpdated": "2026-08-22"
  },
  "rourkela-logistics-guide": {
    "title": "Rourkela Logistics and Transportation: Complete Guide 2026 | LoadSaathi",
    "metaDescription": "Rourkela is a major logistics hub in western Odisha, anchored by the Rourkela Steel Plant. Key freight routes connect to Ranchi (180 km, 4 hrs), Jamshedpur...",
    "keywords": [
      "rourkela logistics and transportation complete guide 2026",
      "rourkela logistics guide",
      "industry insights"
    ],
    "summary": "Rourkela is a major logistics hub in western Odisha, anchored by the Rourkela Steel Plant. Key freight routes connect to Ranchi (180 km, 4 hrs), Jamshedpur (220 km, 5 hrs), Bhubaneswar (340 km, 7 hrs), and Kolkata (430 km, 9 hrs). The city handles steel, cement, and forest products.",
    "author": "Amit Verma",
    "authorBio": "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    "date": "2026-06-25",
    "readTime": "6 min",
    "faq": [],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-22"
  },
  "ranchi-logistics-guide": {
    "title": "Ranchi Logistics and Transportation: Complete Guide 2026 | LoadSaathi",
    "metaDescription": "Ranchi, the capital of Jharkhand, is a growing logistics hub with key routes to Rourkela (180 km), Jamshedpur (130 km), Dhanbad (280 km), and Kolkata (420...",
    "keywords": [
      "ranchi logistics and transportation complete guide 2026",
      "ranchi logistics guide",
      "industry insights"
    ],
    "summary": "Ranchi, the capital of Jharkhand, is a growing logistics hub with key routes to Rourkela (180 km), Jamshedpur (130 km), Dhanbad (280 km), and Kolkata (420 km). The city handles coal, steel, heavy machinery, and consumer goods.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    "date": "2026-06-22",
    "readTime": "5 min",
    "faq": [],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-22"
  },
  "bhubaneswar-logistics-guide": {
    "title": "Bhubaneswar Logistics and Transportation: Complete Guide 2026 | LoadSaathi",
    "metaDescription": "Bhubaneswar, the capital of Odisha, is the state's primary logistics hub. Key freight routes connect to Kolkata (440 km, 8 hrs), Vizag (450 km, 8 hrs)...",
    "keywords": [
      "bhubaneswar logistics and transportation complete guide 2026",
      "bhubaneswar logistics guide",
      "industry insights"
    ],
    "summary": "Bhubaneswar, the capital of Odisha, is the state's primary logistics hub. Key freight routes connect to Kolkata (440 km, 8 hrs), Vizag (450 km, 8 hrs), Rourkela (340 km, 7 hrs), Cuttack (30 km), and Balasore (210 km). The city handles textiles, seafood, agricultural products, and manufactured goods.",
    "author": "Amit Verma",
    "authorBio": "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    "date": "2026-06-20",
    "readTime": "5 min",
    "faq": [],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-22"
  },
  "kolkata-logistics-guide": {
    "title": "Kolkata Logistics and Transportation: Complete Guide 2026 | LoadSaathi",
    "metaDescription": "Kolkata is East India's largest logistics and distribution hub. Key freight routes connect to Rourkela (430 km), Jamshedpur (280 km), Ranchi (420 km)...",
    "keywords": [
      "kolkata logistics and transportation complete guide 2026",
      "kolkata logistics guide",
      "industry insights"
    ],
    "summary": "Kolkata is East India's largest logistics and distribution hub. Key freight routes connect to Rourkela (430 km), Jamshedpur (280 km), Ranchi (420 km), Bhubaneswar (440 km), and Burdwan (110 km). The Port of Kolkata handles major import-export cargo.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-06-18",
    "readTime": "6 min",
    "faq": [],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-22"
  },
  "jamshedpur-industrial-logistics": {
    "title": "Jamshedpur Industrial Logistics: Shipping Steel and Heavy Machinery | LoadSaathi",
    "metaDescription": "Jamshedpur is the industrial heart of Jharkhand, anchored by Tata Steel and numerous engineering firms. Key freight routes connect to Kolkata (280 km, 6...",
    "keywords": [
      "jamshedpur industrial logistics shipping steel and heavy machinery",
      "jamshedpur industrial logistics",
      "industry insights"
    ],
    "summary": "Jamshedpur is the industrial heart of Jharkhand, anchored by Tata Steel and numerous engineering firms. Key freight routes connect to Kolkata (280 km, 6 hrs), Ranchi (130 km, 3 hrs), Rourkela (220 km, 5 hrs), and Burdwan (200 km, 4 hrs). Heavy-haul and oversize cargo shipping is common.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-06-15",
    "readTime": "5 min",
    "faq": [],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-22"
  },
  "east-india-freight-corridors": {
    "title": "East India Freight Corridors: Routes, Industries, Rates, and Return Loads | LoadSaathi",
    "metaDescription": "Explore East India freight corridors across Odisha, Jharkhand, and West Bengal — the main routes, industries, truck types, PTL vs LTL vs FTL choices, route...",
    "keywords": [
      "east india freight corridors routes industries rates and return loads",
      "east india freight corridors",
      "industry insights"
    ],
    "summary": "Explore East India freight corridors across Odisha, Jharkhand, and West Bengal — the main routes, industries, truck types, PTL vs LTL vs FTL choices, route quotes, and return-load opportunities for shippers and truckers. Includes 2026 corridor rates: Kolkata–Jamshedpur ₹25,000–₹38,000, Rourkela–Bhubaneswar ₹28,000–₹42,000, and more.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    "date": "2026-06-12",
    "readTime": "8 min",
    "faq": [
      {
        "question": "Which are the main freight cities in East India?",
        "answer": "For LoadSaathi's initial network, important locations include Rourkela, Ranchi, Jamshedpur, Bhubaneswar, Kolkata, Burdwan, Dhanbad, Sambalpur, and nearby industrial or commercial centres. Coverage and live truck availability change, so confirm the route before booking."
      },
      {
        "question": "Is PTL available between Odisha and Jharkhand?",
        "answer": "PTL availability depends on live shipper demand, truck capacity, cargo compatibility, pickup timing, and route direction. Submit the shipment details through LoadSaathi to check current options."
      },
      {
        "question": "How can I reduce freight costs on an East India corridor?",
        "answer": "Compare PTL with FTL, provide accurate shipment details, reduce loading delays, plan flexible windows, use suitable packaging, and check whether compatible shared or return capacity is available. Do not compromise safe loading or legal payload limits."
      },
      {
        "question": "Can truckers find return loads on East India routes?",
        "answer": "Return-load availability depends on current demand and the truck's location, vehicle, capacity, and timing. Digital matching can make suitable opportunities easier to discover, but no platform can guarantee a return load on every trip."
      }
    ],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-16"
  },
  "shipper-tips-lower-freight-cost": {
    "title": "10 Proven Tips to Lower Your Freight Costs in India | LoadSaathi",
    "metaDescription": "Reduce freight costs by up to 40% with these 10 strategies: use PTL for small loads, book return-load trucks, use AI price predictions, consolidate...",
    "keywords": [
      "10 proven tips to lower your freight costs in india",
      "shipper tips lower freight cost",
      "shipper guide"
    ],
    "summary": "Reduce freight costs by up to 40% with these 10 strategies: use PTL for small loads, book return-load trucks, use AI price predictions, consolidate shipments, negotiate annual contracts, optimize packaging, avoid peak seasons, use digital platforms, maintain good credit scores, and plan routes efficiently.",
    "author": "Amit Verma",
    "authorBio": "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    "date": "2026-06-08",
    "readTime": "6 min",
    "faq": [],
    "category": "Shipper Guide",
    "lastUpdated": "2026-08-22"
  },
  "how-load-saathi-matching-works": {
    "title": "How LoadSaathi AI Matching Works Under the Hood | LoadSaathi",
    "metaDescription": "LoadSaathi's AI matching engine uses 7 weighted factors — route alignment (25%), capacity fit (20%), price compatibility (15%), timeliness (15%), historical...",
    "keywords": [
      "how loadsaathi ai matching works under the hood",
      "how load saathi matching works",
      "product updates"
    ],
    "summary": "LoadSaathi's AI matching engine uses 7 weighted factors — route alignment (25%), capacity fit (20%), price compatibility (15%), timeliness (15%), historical performance (15%), communication (5%), tenure (5%) — plus LLM refinement to rank trucker-shipper matches in real time. The system processes matches in under 2 seconds.",
    "author": "Vikram Singh",
    "authorBio": "Vikram Singh is the CTO at LoadSaathi, overseeing platform architecture and mapping infrastructure.",
    "date": "2026-06-01",
    "readTime": "5 min",
    "faq": [],
    "category": "Product Updates",
    "lastUpdated": "2026-08-22"
  },
  "gst-advisory-668-eway-bill-ship-to-gstin-hold-msme-logistics-2026": {
    "title": "GST Advisory 668: E-Way Bill Rule Enhancements Put On Hold — What Indian MSMEs & Transporters Must Do Now | LoadSaathi",
    "metaDescription": "Through GSTN Advisory No. 668, the Goods and Services Tax Network has put on hold indefinitely the proposed e-Way Bill enhancements slated for mandatory...",
    "keywords": [
      "gst advisory 668 e way bill rule enhancements put on hold what indian msmes transporters must do now",
      "gst advisory 668 eway bill ship to gstin hold msme logistics 2026",
      "industry insights"
    ],
    "summary": "Through GSTN Advisory No. 668, the Goods and Services Tax Network has put on hold indefinitely the proposed e-Way Bill enhancements slated for mandatory enforcement on August 1, 2026 — the mandatory 'Ship-To' GSTIN field and the voluntary e-Way Bill closure facility. MSMEs and transporters do NOT need to modify their ERP or API systems immediately and can continue standard e-Way Bill Part-A and Part-B generation while leveraging AI shared freight platforms like LoadSaathi to optimize PTL truckload costs.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry. With deep expertise in GST compliance, e-Way Bill automation, and MSME freight operations, the team helps Indian businesses navigate regulatory changes in real time.",
    "date": "2026-08-05",
    "readTime": "14 min",
    "faq": [],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-22"
  },
  "india-truck-freight-rates-2026": {
    "title": "PTL vs FTL vs LTL Freight Rates India 2026: Complete Pricing Guide | LoadSaathi",
    "metaDescription": "India's road freight market is worth USD 167.5 billion in 2026 and growing at 8.8% CAGR (Mordor Intelligence). This guide compares PTL, FTL, and LTL freight...",
    "keywords": [
      "ptl vs ftl vs ltl freight rates india 2026 complete pricing guide",
      "india truck freight rates 2026",
      "freight rates"
    ],
    "summary": "India's road freight market is worth USD 167.5 billion in 2026 and growing at 8.8% CAGR (Mordor Intelligence). This guide compares PTL, FTL, and LTL freight modes — when to use each, per-tonne vs per-km pricing, and how partial-load shipping saves 25–35% on East India corridors.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the Founder & CEO of LoadSaathi, an AI-powered shared freight marketplace for East India's industrial corridors.",
    "date": "2026-08-08",
    "readTime": "7 min",
    "faq": [],
    "category": "Freight Rates",
    "lastUpdated": "2026-08-22"
  },
  "truck-transport-charges-per-km-india": {
    "title": "Truck Transport Cost per KM India 2026: Per-Km Rate Breakdown | LoadSaathi",
    "metaDescription": "How truck transport cost per km is calculated in India — 2026 per-km rates by truck type (mini ₹10–25, medium ₹18–40, container ₹35–85), cost formula, and...",
    "keywords": [
      "truck transport cost per km india 2026 per km rate breakdown",
      "truck transport charges per km india",
      "freight rates"
    ],
    "summary": "How truck transport cost per km is calculated in India — 2026 per-km rates by truck type (mini ₹10–25, medium ₹18–40, container ₹35–85), cost formula, and the seven factors that determine your actual freight cost: distance, vehicle type, cargo weight, fuel, tolls, seasonality, and return-load availability.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    "date": "2026-08-16",
    "readTime": "6 min",
    "faq": [
      {
        "question": "What is the average truck transport cost per km in India?",
        "answer": "There is no single reliable national average. The cost depends on vehicle class, route, cargo, distance, fuel, tolls, seasonality, loading time, and return-load availability. Use a current route-specific estimate rather than relying on a generic number."
      },
      {
        "question": "Is PTL priced per kilometre or per kilogram?",
        "answer": "PTL may be quoted using a combination of shipment weight, volume, route, used capacity, and service conditions. Some providers communicate a per-kilogram or per-tonne estimate, while others provide a route quote. Ask what is included before comparing providers."
      },
      {
        "question": "Why can the same truck cost different amounts on two routes?",
        "answer": "Route distance, tolls, road conditions, demand, truck availability, cargo requirements, loading time, and the probability of a paid return trip can all differ. The same vehicle does not have the same operating economics on every corridor."
      },
      {
        "question": "How can a shipper reduce freight cost?",
        "answer": "Provide accurate shipment details, compare PTL with FTL, improve packaging, reduce loading delays, plan flexible pickup windows, consolidate compatible orders, and consider routes where shared or return capacity is available. Do not reduce cost by compromising safe loading or legal payload limits."
      }
    ],
    "category": "Freight Rates",
    "lastUpdated": "2026-08-16"
  },
  "how-to-find-return-loads-india": {
    "title": "How to Find Return Loads in India: A Practical Backhaul Guide for Truckers | LoadSaathi",
    "metaDescription": "Learn how Indian truckers and fleet owners can find return loads, reduce empty kilometres, measure backhaul performance, and improve paid-mile utilization...",
    "keywords": [
      "how to find return loads in india a practical backhaul guide for truckers",
      "how to find return loads india",
      "trucker tips"
    ],
    "summary": "Learn how Indian truckers and fleet owners can find return loads, reduce empty kilometres, measure backhaul performance, and improve paid-mile utilization. India's digital freight market is growing at 12% annually — early adopters capture the best loads. Includes five practical ways to find return loads, verification steps, KPIs, and a return-load decision rule.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-08-16",
    "readTime": "7 min",
    "faq": [
      {
        "question": "Where can truckers find return loads in India?",
        "answer": "Truckers can use digital load boards, freight marketplaces, direct shipper relationships, transport associations, local networks, and fleet-management systems. Digital platforms are useful when they provide verified shipment information and route-compatible matching rather than only a large list of unfiltered loads."
      },
      {
        "question": "Is every backhaul better than returning empty?",
        "answer": "No. A backhaul can be unprofitable if it requires a long detour, excessive waiting, unsuitable cargo handling, or unreliable payment. Evaluate the complete trip economics before accepting it."
      },
      {
        "question": "How do return loads reduce truck operating costs?",
        "answer": "A paid return leg can spread the cost of the vehicle, driver, fuel, and trip cycle across more revenue-generating kilometres. The actual benefit depends on the load price and additional operating costs."
      },
      {
        "question": "How can LoadSaathi help truckers find suitable loads?",
        "answer": "LoadSaathi connects truckers with shipper freight and uses route, capacity, timing, pricing, and profile information to support matching. Availability depends on the live network and the trucker's vehicle and service area."
      }
    ],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-16"
  },
  "digital-freight-matching-india": {
    "title": "Digital Freight Matching in India: How AI Helps Shippers and Truckers | LoadSaathi",
    "metaDescription": "Discover how digital freight matching connects loads with suitable trucks using route, capacity, timing, price, and reliability data — and how AI improves...",
    "keywords": [
      "digital freight matching in india how ai helps shippers and truckers",
      "digital freight matching india",
      "industry insights"
    ],
    "summary": "Discover how digital freight matching connects loads with suitable trucks using route, capacity, timing, price, and reliability data — and how AI improves matching for shippers and truckers across India. India's freight market is USD 167.5 billion, growing at 18% CAGR, with 78% of truckers reporting higher earnings after switching to digital matching.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    "date": "2026-08-16",
    "readTime": "6 min",
    "faq": [
      {
        "question": "Is digital freight matching the same as a load board?",
        "answer": "Not always. A basic load board may display available loads and trucks. Digital freight matching can go further by comparing route, timing, capacity, cargo, pricing, and reliability signals to suggest more relevant options."
      },
      {
        "question": "Can AI eliminate empty truck kilometres completely?",
        "answer": "No platform should promise that every empty kilometre will disappear. Demand is often unbalanced between locations, and operational constraints remain. Better matching can improve the probability of finding suitable paid capacity, but the result depends on live demand, route, timing, and truck availability."
      },
      {
        "question": "Is digital freight matching useful for small shippers?",
        "answer": "Yes. Small shippers may benefit from shared capacity, structured quotes, shipment visibility, and access to a wider network. They should provide accurate shipment details and compare service conditions before booking."
      },
      {
        "question": "How does LoadSaathi use digital matching?",
        "answer": "LoadSaathi connects shippers and truckers for PTL and LTL freight across East India. Its matching approach considers shipment and vehicle details such as route, capacity, timing, price, and reliability. The live result depends on current network availability."
      }
    ],
    "category": "Industry Insights",
    "lastUpdated": "2026-08-16"
  },
  "ptl-freight-rates-india": {
    "title": "PTL Freight Rates in India: How Part-Load Shipping Costs Are Calculated | LoadSaathi",
    "metaDescription": "Understand how PTL freight rates are calculated in India. Learn how weight, volume, route, vehicle capacity, timing, handling, and return loads affect...",
    "keywords": [
      "ptl freight rates in india how part load shipping costs are calculated",
      "ptl freight rates india",
      "freight rates"
    ],
    "summary": "Understand how PTL freight rates are calculated in India. Learn how weight, volume, route, vehicle capacity, timing, handling, and return loads affect part-load shipping costs, plus a simple PTL rate framework and booking questions.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    "date": "2026-08-16",
    "readTime": "7 min",
    "faq": [
      {
        "question": "What is PTL freight and how is it priced?",
        "answer": "PTL (Part Truck Load) freight pricing is based on the proportion of truck capacity used — weight, volume, route, and cargo type. Unlike FTL (full truck), you pay only for the space your shipment occupies. Pricing considers load density, distance, handling requirements, and market conditions."
      },
      {
        "question": "Is PTL cheaper than booking a full truck?",
        "answer": "It can be, when the shipment does not need dedicated capacity and suitable shared capacity is available. The result depends on the route and service conditions."
      },
      {
        "question": "Is PTL safe for industrial cargo?",
        "answer": "PTL can be suitable when the vehicle, loading plan, cargo compatibility, securing, packaging, and handling process are appropriate. Heavy or sensitive cargo should be assessed before booking."
      },
      {
        "question": "Can LoadSaathi provide a fixed PTL rate?",
        "answer": "LoadSaathi can provide an indicative estimate based on the shipment and route information available. The final quote depends on live capacity, cargo details, timing, and confirmed service conditions."
      }
    ],
    "category": "Freight Rates",
    "lastUpdated": "2026-08-16"
  },
  "rourkela-to-bhubaneswar-freight": {
    "title": "Rourkela to Bhubaneswar Freight: Rates, Routes & Tips (2026) | LoadSaathi",
    "metaDescription": "The Rourkela–Bhubaneswar corridor covers 310 km in 7–8 hours with FTL rates from ₹28,000–₹42,000 and PTL rates from ₹5–8/kg. This guide covers 2026 rates...",
    "keywords": [
      "rourkela to bhubaneswar freight rates routes tips 2026",
      "rourkela to bhubaneswar freight",
      "route guide"
    ],
    "summary": "The Rourkela–Bhubaneswar corridor covers 310 km in 7–8 hours with FTL rates from ₹28,000–₹42,000 and PTL rates from ₹5–8/kg. This guide covers 2026 rates, optimal routes, truck availability, and tips for saving up to 35% on this key Odisha freight corridor.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    "date": "2026-08-09",
    "readTime": "5 min",
    "faq": [],
    "category": "Route Guide"
  },
  "kolkata-to-rourkela-freight-rates": {
    "title": "Kolkata to Rourkela Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Kolkata to Rourkela freight covers 530 km in 12–14 hours. FTL rates range from ₹45,000–₹65,000 and PTL from ₹6–9/kg. Learn about the optimal NH-16 route...",
    "keywords": [
      "kolkata to rourkela freight rates 2026 complete cost guide",
      "kolkata to rourkela freight rates",
      "route guide"
    ],
    "summary": "Kolkata to Rourkela freight covers 530 km in 12–14 hours. FTL rates range from ₹45,000–₹65,000 and PTL from ₹6–9/kg. Learn about the optimal NH-16 route, seasonal rate patterns, and how to save on this cross-state East India corridor.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    "date": "2026-08-09",
    "readTime": "5 min",
    "faq": [],
    "category": "Route Guide"
  },
  "ptl-vs-ftl-when-to-use-each": {
    "title": "PTL vs FTL: When to Use Each Freight Mode (2026 Guide) | LoadSaathi",
    "metaDescription": "PTL (Part Truck Load) is 25–35% cheaper than FTL for shipments under 8 tonnes. This guide compares PTL and FTL on cost, transit time, safety, and best use...",
    "keywords": [
      "ptl vs ftl when to use each freight mode 2026 guide",
      "ptl vs ftl when to use each",
      "freight guide"
    ],
    "summary": "PTL (Part Truck Load) is 25–35% cheaper than FTL for shipments under 8 tonnes. This guide compares PTL and FTL on cost, transit time, safety, and best use cases, with 2026 pricing benchmarks for Indian freight corridors.",
    "author": "Priya Sharma",
    "authorBio": "Priya Sharma is the Product Lead at LoadSaathi, specializing in trust and reputation systems for marketplace platforms.",
    "date": "2026-08-09",
    "readTime": "4 min",
    "faq": [],
    "category": "Freight Guide"
  },
  "freight-booking-mistakes-to-avoid": {
    "title": "7 Freight Booking Mistakes That Cost Shippers Money | LoadSaathi",
    "metaDescription": "Common freight booking mistakes include inaccurate weight estimates, skipping price comparison, ignoring trucker ratings, not using PTL for partial loads...",
    "keywords": [
      "7 freight booking mistakes that cost shippers money",
      "freight booking mistakes to avoid",
      "shipper guide"
    ],
    "summary": "Common freight booking mistakes include inaccurate weight estimates, skipping price comparison, ignoring trucker ratings, not using PTL for partial loads, booking too late, skipping insurance, and poor communication. Avoid these 7 errors to save 15–30% on shipping.",
    "author": "Amit Verma",
    "authorBio": "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    "date": "2026-08-09",
    "readTime": "5 min",
    "faq": [],
    "category": "Shipper Guide",
    "lastUpdated": "2026-08-22"
  },
  "steel-transport-india-guide": {
    "title": "Steel Transport in India: Complete Guide to Safe & Cost-Effective Shipping | LoadSaathi",
    "metaDescription": "India produces 140+ million tonnes of steel annually, with 60% transported by road. Steel freight requires specialised trucks (flatbed, low-bed, container)...",
    "keywords": [
      "steel transport in india complete guide to safe cost effective shipping",
      "steel transport india guide",
      "industry guide"
    ],
    "summary": "India produces 140+ million tonnes of steel annually, with 60% transported by road. Steel freight requires specialised trucks (flatbed, low-bed, container), proper lashing, and insurance. This guide covers rates, safety, corridors, and logistics for steel transport in 2026.",
    "author": "LoadSaathi Team",
    "authorBio": "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    "date": "2026-08-09",
    "readTime": "6 min",
    "faq": [],
    "category": "Industry Guide",
    "lastUpdated": "2026-08-22"
  },
  "msme-freight-saving-guide": {
    "title": "MSME Freight Saving Guide: Cut Logistics Costs by 30% in 2026 | LoadSaathi",
    "metaDescription": "Indian MSMEs spend 12–15% of turnover on logistics vs 8% for large enterprises. PTL shared freight, digital load boards, route optimisation, and credit score...",
    "keywords": [
      "msme freight saving guide cut logistics costs by 30 in 2026",
      "msme freight saving guide",
      "shipper guide"
    ],
    "summary": "Indian MSMEs spend 12–15% of turnover on logistics vs 8% for large enterprises. PTL shared freight, digital load boards, route optimisation, and credit score leverage can cut MSME freight costs by 25–35%. This guide provides actionable strategies for 2026.",
    "author": "Amit Verma",
    "authorBio": "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    "date": "2026-08-09",
    "readTime": "5 min",
    "faq": [],
    "category": "Shipper Guide",
    "lastUpdated": "2026-08-22"
  },
  "trucker-credit-score-guide": {
    "title": "How Truckers Can Build a Strong Digital Credit Score on LoadSaathi | LoadSaathi",
    "metaDescription": "A 700+ digital credit score on LoadSaathi unlocks priority matching, 5–10% better rates, and more load offers. Score is calculated from completion rate...",
    "keywords": [
      "how truckers can build a strong digital credit score on loadsaathi",
      "trucker credit score guide",
      "trucker tips"
    ],
    "summary": "A 700+ digital credit score on LoadSaathi unlocks priority matching, 5–10% better rates, and more load offers. Score is calculated from completion rate (30%), reliability (25%), reviews (20%), communication (15%), and tenure (10%). Build your score with these strategies.",
    "author": "Priya Sharma",
    "authorBio": "Priya Sharma is the Product Lead at LoadSaathi, specializing in trust and reputation systems for marketplace platforms.",
    "date": "2026-08-09",
    "readTime": "4 min",
    "faq": [],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-22"
  },
  "return-loads-rourkela": {
    "title": "Finding Return Loads from Rourkela: A Trucker's Complete Guide (2026) | LoadSaathi",
    "metaDescription": "Truckers leaving Rourkela with empty trucks lose ₹15,000-25,000 per round trip. In 2026, digital platforms like LoadSaathi match truckers with return loads...",
    "keywords": [
      "finding return loads from rourkela a trucker s complete guide 2026",
      "return loads rourkela",
      "trucker tips"
    ],
    "summary": "Truckers leaving Rourkela with empty trucks lose ₹15,000-25,000 per round trip. In 2026, digital platforms like LoadSaathi match truckers with return loads across 6 major corridors — Rourkela-Kolkata, Rourkela-Ranchi, Rourkela-Bhubaneswar, Rourkela-Jamshedpur, and more. Learn corridor rates, platform strategies, and pricing tactics to fill every leg.",
    "author": "LoadSaathi Team",
    "authorBio": "LoadSaathi's editorial team publishes practical guides for truckers and fleet operators across East India, covering freight corridors, earnings optimization, and compliance.",
    "date": "2026-08-14",
    "readTime": "9 min",
    "faq": [
      {
        "question": "What is a return load in trucking?",
        "answer": "A return load is cargo booked for the return leg of a trip. For truckers based in or passing through Rourkela, one-way trips often end with an empty truck driving back. Return loads fill that empty leg, turning diesel and toll costs into profit."
      },
      {
        "question": "What are the top return load corridors from Rourkela?",
        "answer": "The most active corridors are Rourkela-Kolkata (430 km, ₹1,800-2,500/tonne PTL), Rourkela-Ranchi (180 km, ₹800-1,200/tonne), Rourkela-Bhubaneswar (310 km, ₹1,200-1,800/tonne), Rourkela-Jamshedpur (120 km, ₹500-800/tonne), and Rourkela-Sambalpur (150 km)."
      },
      {
        "question": "How much can truckers save by avoiding empty return trips?",
        "answer": "An empty Rourkela-to-Kolkata return leg (430 km) costs approximately ₹4,500-5,500 in diesel plus ₹1,800-2,200 in tolls. A loaded return leg earning ₹8,000-12,000 in freight turns that loss into profit — a swing of ₹15,000-25,000 per round trip."
      },
      {
        "question": "How does LoadSaathi help truckers find return loads?",
        "answer": "LoadSaathi's AI-powered matching connects truckers with return loads based on route, capacity, and vehicle type — often while the truck is still unloading. Escrow payments are released within 24 hours of delivery confirmation, and verified shipper credit scores reduce payment risk."
      },
      {
        "question": "What is the payment cycle for return loads on LoadSaathi?",
        "answer": "LoadSaathi's escrow payment system holds the shipper's payment until delivery is confirmed via GPS verification. Payments are released within 24 hours, eliminating the 30-60 day payment cycles common in traditional freight."
      }
    ],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-22"
  },
  "ptl-transport-odisha-jharkhand-2026": {
    "title": "PTL Transport in Odisha and Jharkhand: How to Ship Smarter in 2026 | LoadSaathi",
    "metaDescription": "PTL (Partial Truckload) shipping lets Odisha and Jharkhand shippers pay only for the truck space they use — cutting freight costs by 30-40%. In 2026, PTL...",
    "keywords": [
      "ptl transport in odisha and jharkhand how to ship smarter in 2026",
      "ptl transport odisha jharkhand 2026",
      "shipper guide"
    ],
    "summary": "PTL (Partial Truckload) shipping lets Odisha and Jharkhand shippers pay only for the truck space they use — cutting freight costs by 30-40%. In 2026, PTL rates on Rourkela-Kolkata are ₹1,800-2,500/tonne, Rourkela-Ranchi is ₹800-1,200/tonne, and Rourkela-Bhubaneswar is ₹1,200-1,800/tonne. Learn corridors, booking steps, and why LoadSaathi is the best PTL platform.",
    "author": "LoadSaathi Team",
    "authorBio": "LoadSaathi's editorial team publishes practical guides for shippers and fleet operators across East India, covering freight corridors, cost optimization, and logistics compliance.",
    "date": "2026-08-14",
    "readTime": "10 min",
    "faq": [
      {
        "question": "What is PTL transport?",
        "answer": "PTL (Part Truck Load) transport is a shipping method where multiple shippers share space in the same truck. Instead of booking an entire truck (FTL), you pay only for the space your cargo occupies — typically 500 kg to 5 tonnes. This makes PTL 30-40% cheaper than FTL for smaller shipments."
      },
      {
        "question": "How much cheaper is PTL compared to FTL?",
        "answer": "PTL rates are typically 30-40% lower than FTL rates for the same corridor. For example, a 2-tonne PTL shipment from Rourkela to Kolkata costs ₹9,000-12,000, while a full 9-tonne FTL booking costs ₹55,000-70,000."
      },
      {
        "question": "Which corridors are best for PTL in Odisha and Jharkhand?",
        "answer": "The highest-volume PTL corridors are Rourkela-Kolkata (430 km), Rourkela-Ranchi (180 km), Rourkela-Bhubaneswar (310 km), Bhubaneswar-Kolkata (470 km), and Ranchi-Kolkata (350 km)."
      },
      {
        "question": "How do I book PTL transport online?",
        "answer": "Enter your shipment details on LoadSaathi — origin, destination, weight, and departure date. The AI matches you with verified carriers within minutes. Compare offers, book, track via GPS, and pay through escrow."
      },
      {
        "question": "What is the minimum weight for PTL shipping?",
        "answer": "Most PTL carriers accept shipments from 100 kg upwards. There is no strict minimum, but rates are most competitive for shipments between 500 kg and 5 tonnes."
      }
    ],
    "category": "Shipper Guide"
  },
  "steel-transport-rourkela-2026": {
    "title": "Steel Transport from Rourkela: The Complete Guide for 2026 | LoadSaathi",
    "metaDescription": "Rourkela produces over 18 million tonnes of steel annually. In 2026, steel freight rates from Rourkela to Kolkata are ₹28,000-35,000 (FTL), to Bhubaneswar...",
    "keywords": [
      "steel transport from rourkela the complete guide for 2026",
      "steel transport rourkela 2026",
      "industry guide"
    ],
    "summary": "Rourkela produces over 18 million tonnes of steel annually. In 2026, steel freight rates from Rourkela to Kolkata are ₹28,000-35,000 (FTL), to Bhubaneswar ₹20,000-26,000, and to Ranchi ₹12,000-16,000. This guide covers truck selection, compliance requirements, corridor rates, and how to book verified carriers via LoadSaathi.",
    "author": "LoadSaathi Team",
    "authorBio": "LoadSaathi's editorial team publishes industry guides for steel and industrial freight corridors, covering compliance, rates, and best practices for shippers and transporters.",
    "date": "2026-08-14",
    "readTime": "8 min",
    "faq": [
      {
        "question": "What is the best truck type for steel transport from Rourkela?",
        "answer": "The best truck type depends on steel product. Flatbed trucks (open sides) are ideal for long steel bars and structural steel. Low-bed trailers handle heavy coils and oversized loads. Container trucks suit finished steel products needing weather protection. curtain-side trucks balance accessibility with protection."
      },
      {
        "question": "What is the truck rate per tonne for steel from Rourkela to Kolkata?",
        "answer": "In 2026, FTL rates for steel from Rourkela to Kolkata range from ₹55,000-70,000 for a 9-tonne truck (₹6,100-7,800 per tonne). PTL rates for smaller steel shipments are ₹1,800-2,500 per tonne."
      },
      {
        "question": "What permits are needed for steel transport in India?",
        "answer": "Standard goods carrier permits cover most steel transport. However, oversize or overweight loads require special permits from state transport authorities. All steel shipments exceeding ₹50,000 in value need a valid e-Way Bill before departure."
      },
      {
        "question": "How does LoadSaathi help steel shippers?",
        "answer": "LoadSaathi connects steel shippers with verified carriers experienced in steel transport. The platform matches by vehicle type, capacity, and corridor. Escrow payments ensure carriers get paid on delivery, and GPS tracking provides real-time visibility."
      }
    ],
    "category": "Industry Guide"
  },
  "trucker-earnings-odisha-2026": {
    "title": "Trucker Salary and Earnings in Odisha 2026: Complete Pay Breakdown | LoadSaathi",
    "metaDescription": "Trucker salaries in Odisha in 2026: light commercial vehicle drivers earn ₹12,000-18,000/month, 10-wheelers ₹18,000-25,000, multi-axle ₹25,000-35,000. A...",
    "keywords": [
      "trucker salary and earnings in odisha 2026 complete pay breakdown",
      "trucker earnings odisha 2026",
      "trucker tips"
    ],
    "summary": "Trucker salaries in Odisha in 2026: light commercial vehicle drivers earn ₹12,000-18,000/month, 10-wheelers ₹18,000-25,000, multi-axle ₹25,000-35,000. A Rourkela-Kolkata round trip yields ₹50,000-65,000 in revenue, with ₹22,000-28,000 in costs. Return loads are the key to profitability — filling empty legs adds ₹8,000-15,000 per trip.",
    "author": "LoadSaathi Team",
    "authorBio": "LoadSaathi's editorial team publishes earnings guides for truckers and fleet operators across Odisha, Jharkhand, and West Bengal, covering salary benchmarks, profit optimization, and cost management.",
    "date": "2026-08-14",
    "readTime": "11 min",
    "faq": [
      {
        "question": "How much do truck drivers earn in Odisha in 2026?",
        "answer": "Truck driver salaries in Odisha vary by vehicle type: LCV drivers earn ₹12,000-18,000/month, 10-wheeler drivers ₹18,000-25,000/month, and multi-axle truck drivers ₹25,000-35,000/month. Owner-operators can earn significantly more — ₹30,000-80,000+ per month depending on routes and return-load utilisation."
      },
      {
        "question": "How much profit does a Rourkela-Kolkata round trip generate?",
        "answer": "A Rourkela-Kolkata round trip (860 km total) generates ₹50,000-65,000 in revenue. After deducting ₹22,000-28,000 in costs (diesel, tolls, maintenance, driver), net profit is ₹28,000-37,000. With return loads, net profit jumps to ₹36,000-52,000."
      },
      {
        "question": "What are the biggest costs for truckers in Odisha?",
        "answer": "Diesel accounts for 45-50% of running costs (₹7.50-9.00/km at ₹90/litre). Tolls account for 15-20% (NH-16 Rourkela-Kolkata tolls total ₹3,600-4,400 round trip). Maintenance and tyres account for 12-15%. Insurance and permits 8-12%. EMI 15-20%."
      },
      {
        "question": "How do return loads affect trucker profitability?",
        "answer": "A trucker who consistently books return loads earns ₹58,000-67,000 per round trip. A trucker running empty on the return earns only ₹30,000-35,000 — a difference of ₹28,000-32,000 per trip. Over 8 trips per month, that's ₹2,24,000-2,56,000 in lost revenue."
      },
      {
        "question": "How long does it take to pay off a new truck in 2026?",
        "answer": "At 8 trips per month with ₹35,000-45,000 net profit per trip, a new 10-wheeler (₹25-35 lakh) has a payback period of 18-24 months. Truckers who consistently book return loads achieve payback in 14-18 months, while those running empty returns take 24-30 months."
      }
    ],
    "category": "Trucker Tips"
  },
  "hidden-cost-empty-miles-msme-logistics": {
    "title": "The Hidden Cost of Empty Miles: How Indian MSMEs Lose Lakhs | LoadSaathi",
    "metaDescription": "40% of Indian trucks run empty on return trips, inflating logistics costs for MSMEs. Learn how AI-powered PTL matching eliminates empty miles and saves MSMEs...",
    "keywords": [
      "the hidden cost of empty miles how indian msmes lose lakhs",
      "hidden cost empty miles msme logistics",
      "freight strategy"
    ],
    "summary": "40% of Indian trucks run empty on return trips, inflating logistics costs for MSMEs. Learn how AI-powered PTL matching eliminates empty miles and saves MSMEs 25-35% on freight.",
    "author": "Sanjaya Sahu",
    "date": "2026-08-10",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are empty miles in trucking?",
        "answer": "Empty miles are kilometres driven by a truck without cargo — typically on the return leg after a delivery. In India, roughly 40% of truck kilometres are driven empty, which inflates freight rates for shippers because truckers recover deadhead costs from the outbound shipment."
      },
      {
        "question": "How do empty miles affect MSME logistics costs?",
        "answer": "MSMEs already spend 12-15% of operating expenses on logistics (vs. 8% for large enterprises). Empty miles inflate freight rates by 15-25% because truckers add a premium to cover potential empty returns. MSMEs using Full Truckload for partial cargo also waste 25-40% of paid capacity on unused space."
      },
      {
        "question": "How does PTL reduce empty miles?",
        "answer": "PTL (Part Truckload) allows multiple shippers to share space on a single truck. AI matching platforms like LoadSaathi fill return legs with return-load cargo before the outbound trip concludes, eliminating deadhead kilometres and reducing the overall cost of transportation for both shippers and truckers."
      },
      {
        "question": "How much can MSMEs save by switching to shared freight?",
        "answer": "MSMEs switching from FTL to PTL for partial cargo typically save 25-35% on freight costs. When combined with AI-matched return loads that reduce deadheading, total logistics costs can drop by up to 40%."
      }
    ],
    "category": "Freight Strategy",
    "lastUpdated": "2026-08-22"
  },
  "return-loads-kolkata": {
    "title": "Finding Return Loads from Kolkata: A Trucker's Complete Guide | LoadSaathi",
    "metaDescription": "Kolkata is East India's largest logistics hub, but truckers leaving empty lose 20,000-35,000 rupees per round trip. Learn the top return-load corridors...",
    "keywords": [
      "finding return loads from kolkata a trucker s complete guide",
      "return loads kolkata",
      "trucker tips"
    ],
    "summary": "Kolkata is East India's largest logistics hub, but truckers leaving empty lose 20,000-35,000 rupees per round trip. Learn the top return-load corridors, digital matching strategies, and pricing tactics to fill every leg from Kolkata.",
    "author": "Sanjaya Sahu",
    "date": "2026-08-20",
    "readTime": "6 min",
    "faq": [
      {
        "question": "What are the best return load corridors from Kolkata?",
        "answer": "The most active corridors are Kolkata to Rourkela (430 km, steel and industrial goods), Kolkata to Jamshedpur (280 km, automotive and engineering), Kolkata to Ranchi (420 km, coal and heavy machinery), and Kolkata to Bhubaneswar (440 km, textiles and FMCG)."
      },
      {
        "question": "How much can truckers earn from Kolkata return loads?",
        "answer": "Truckers who book return loads from Kolkata earn 40-60% more per round trip compared to running empty. A Kolkata-Rourkela round trip with return load generates 55,000-70,000 rupees revenue versus 30,000-38,000 without a return load."
      },
      {
        "question": "How does LoadSaathi find return loads from Kolkata?",
        "answer": "LoadSaathi's AI matching engine identifies return-load opportunities before the outbound trip concludes. It matches the truck's route, capacity, and vehicle type with verified shipper requirements, pushing offers in real-time as the trucker approaches Kolkata."
      }
    ],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-22"
  },
  "trucker-earnings-jharkhand-2026": {
    "title": "Trucker Salary and Earnings in Jharkhand 2026: Complete Pay Breakdown | LoadSaathi",
    "metaDescription": "How much do truck drivers earn in Jharkhand in 2026? See salary ranges by vehicle type, round-trip P and L for major corridors (Dhanbad-Kolkata...",
    "keywords": [
      "trucker salary and earnings in jharkhand 2026 complete pay breakdown",
      "trucker earnings jharkhand 2026",
      "trucker tips"
    ],
    "summary": "How much do truck drivers earn in Jharkhand in 2026? See salary ranges by vehicle type, round-trip P and L for major corridors (Dhanbad-Kolkata, Ranchi-Jamshedpur, Jamshedpur-Bhubaneswar), and how return loads boost net income by 40-60%.",
    "author": "Sanjaya Sahu",
    "date": "2026-08-18",
    "readTime": "6 min",
    "faq": [
      {
        "question": "How much do truck drivers earn in Jharkhand in 2026?",
        "answer": "Truck driver salaries in Jharkhand vary by vehicle type: LCV drivers earn 14,000-20,000 per month, 10-wheeler drivers 20,000-28,000 per month, and multi-axle truck drivers 28,000-40,000 per month. Owner-operators can earn 40,000-90,000 plus per month depending on routes and return-load utilisation."
      },
      {
        "question": "How much profit does a Dhanbad-Kolkata round trip generate?",
        "answer": "A Dhanbad-Kolkata round trip (700 km total) generates 52,000-65,000 rupees in revenue with return loads. After deducting 16,000-18,000 in costs (diesel, tolls, maintenance, driver), net profit is 36,000-49,000. Without return loads, net profit drops to 14,000-22,000."
      },
      {
        "question": "How long does it take to pay off a new truck in Jharkhand?",
        "answer": "At 8 trips per month with 35,000-45,000 net profit per trip, a new 10-wheeler (25-35 lakh) has a payback period of 18-24 months. Truckers who consistently book return loads achieve payback in 14-18 months."
      },
      {
        "question": "What cargo types are most common on Jharkhand routes?",
        "answer": "Jharkhand main freight includes coal (Dhanbad-Ranchi, Dhanbad-Kolkata), steel and heavy machinery (Jamshedpur corridors), construction materials, and FMCG goods. Coal transport uses heavy-duty tippers and trailers, while steel requires flatbeds and low-bed trailers."
      }
    ],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-22"
  },
  "loadsaathi-vs-brokers": {
    "title": "LoadSaathi vs Traditional Brokers: Cost, Trust, and Speed Compared | LoadSaathi",
    "metaDescription": "Traditional freight brokers add 15-25% markup, take 30-45 days to pay truckers, and offer no tracking. See how LoadSaathi AI matching, escrow payments, and...",
    "keywords": [
      "loadsaathi vs traditional brokers cost trust and speed compared",
      "loadsaathi vs brokers",
      "shipper guide"
    ],
    "summary": "Traditional freight brokers add 15-25% markup, take 30-45 days to pay truckers, and offer no tracking. See how LoadSaathi AI matching, escrow payments, and digital credit scores compare on cost, trust, and speed for Indian shippers.",
    "author": "Sanjaya Sahu",
    "date": "2026-08-16",
    "readTime": "5 min",
    "faq": [
      {
        "question": "How much do freight brokers charge in India?",
        "answer": "Traditional freight brokers in India typically add 15-25% markup between the shipper payment and the trucker rate. On a 35,000 rupee shipment, the broker may take 5,000-8,000 as commission. LoadSaathi charges 2-5% per completed transaction with full rate transparency."
      },
      {
        "question": "How is LoadSaathi different from a broker?",
        "answer": "LoadSaathi is a digital freight marketplace, not a broker. It connects shippers directly with verified truckers using AI matching. The shipper sees the trucker actual rate, credit score, and reviews. Payments are held in escrow and released within 24 hours of delivery. There are no hidden markups."
      },
      {
        "question": "Is LoadSaathi safe for cargo?",
        "answer": "LoadSaathi verifies every trucker with document validation, vehicle RC checks, and a digital freight credit score (300-900). Real-time GPS tracking provides visibility from pickup to delivery. Escrow payments ensure the trucker is paid only after successful delivery confirmation."
      },
      {
        "question": "Can I still use my broker and LoadSaathi?",
        "answer": "Yes. Many shippers use LoadSaathi alongside existing broker relationships. The platform is free to join with no minimum commitments. Compare rates from LoadSaathi against your broker quote to see the savings."
      }
    ],
    "category": "Shipper Guide",
    "lastUpdated": "2026-08-22"
  },
  "bhubaneswar-to-kolkata-freight-rates": {
    "title": "Bhubaneswar to Kolkata Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Bhubaneswar to Kolkata freight rates for 2026: PTL 5-8 rupees per kg, FTL 35,000-55,000 rupees by vehicle type. 440 km via NH-16, 9-11 hours transit...",
    "keywords": [
      "bhubaneswar to kolkata freight rates 2026 complete cost guide",
      "bhubaneswar to kolkata freight rates",
      "route guide"
    ],
    "summary": "Bhubaneswar to Kolkata freight rates for 2026: PTL 5-8 rupees per kg, FTL 35,000-55,000 rupees by vehicle type. 440 km via NH-16, 9-11 hours transit. Includes return-load opportunities, cargo types, and booking tips.",
    "author": "Sanjaya Sahu",
    "date": "2026-08-15",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What is the truck freight rate from Bhubaneswar to Kolkata in 2026?",
        "answer": "FTL rates range from 12,000-16,000 rupees for LCVs, 35,000-42,000 for 10-wheelers, 42,000-50,000 for multi-axle trucks, and 50,000-55,000 for trailers. PTL rates are 5-8 rupees per kg depending on cargo type."
      },
      {
        "question": "How long does Bhubaneswar to Kolkata truck transport take?",
        "answer": "The 440 km journey via NH-16 takes 9-11 hours for most vehicles. Transit time varies by vehicle type, traffic conditions, and number of stops."
      },
      {
        "question": "What cargo is commonly shipped on this route?",
        "answer": "Major cargo includes construction materials, agricultural produce (rice, sugar), textiles, FMCG products, engineering goods, and pharmaceutical supplies. Kolkata port also handles containerized cargo from Bhubaneswar."
      },
      {
        "question": "Are return loads available from Kolkata to Bhubaneswar?",
        "answer": "Yes. Kolkata has consistent outbound freight including textiles, engineering goods, FMCG products, and pharmaceutical supplies. The round trip with return loads generates 15-20% more profit than one-way trips."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-22"
  },
  "cargo-insurance-guide-india": {
    "title": "Cargo Insurance in India: What Truckers and Shippers Must Know | LoadSaathi",
    "metaDescription": "Cargo damage, theft, and accidents cost Indian shippers 2-5% of cargo value annually. Learn the difference between carrier liability and cargo insurance...",
    "keywords": [
      "cargo insurance in india what truckers and shippers must know",
      "cargo insurance guide india",
      "compliance"
    ],
    "summary": "Cargo damage, theft, and accidents cost Indian shippers 2-5% of cargo value annually. Learn the difference between carrier liability and cargo insurance, coverage types, claim processes, and how digital freight platforms handle insurance.",
    "author": "Sanjaya Sahu",
    "date": "2026-08-12",
    "readTime": "6 min",
    "faq": [
      {
        "question": "Is cargo insurance mandatory in India?",
        "answer": "Cargo insurance is not legally mandatory under the Motor Vehicles Act, but most commercial shipping contracts and bank letters of credit require it. Carrier liability covers only 5-10 rupees per kg, making additional cargo insurance essential for valuable shipments."
      },
      {
        "question": "How much does cargo insurance cost in India?",
        "answer": "Premiums range from 0.3% to 2% of declared cargo value. For a 10 lakh rupee shipment, annual premiums are 3,000-20,000 rupees. High-risk cargo (electronics, pharmaceuticals) and long-distance routes command higher premiums."
      },
      {
        "question": "What does carrier liability cover?",
        "answer": "Under the Motor Vehicles Act, carrier liability covers cargo loss or damage due to the trucker negligence. However, liability is limited to 5-10 rupees per kg of cargo weight, which is far below actual cargo value for most goods."
      },
      {
        "question": "How do I file a cargo damage claim?",
        "answer": "Document damage immediately with photographs and a joint survey report at delivery. File the claim within 7-30 days with the insurer, submitting transport documents, invoice, packing list, and damage assessment. Settlement typically takes 30-60 days."
      }
    ],
    "category": "Compliance",
    "lastUpdated": "2026-08-22"
  },
  "return-loads-ranchi": {
    "title": "Finding Return Loads from Ranchi: A Trucker's Complete Guide (2026) | LoadSaathi",
    "metaDescription": "Truckers delivering to Ranchi can earn 40-60% more by booking return loads to Kolkata, Jamshedpur, Bhubaneswar, and Dhanbad. See top corridors, earnings per...",
    "keywords": [
      "finding return loads from ranchi a trucker s complete guide 2026",
      "return loads ranchi",
      "trucker tips"
    ],
    "summary": "Truckers delivering to Ranchi can earn 40-60% more by booking return loads to Kolkata, Jamshedpur, Bhubaneswar, and Dhanbad. See top corridors, earnings per trip, cargo types, and how LoadSaathi AI matching fills return legs.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-08-23",
    "readTime": "6 min",
    "faq": [
      {
        "question": "What are the best return load corridors from Ranchi?",
        "answer": "The most active corridors are Ranchi to Kolkata (420 km, steel and machinery), Ranchi to Jamshedpur (130 km, automotive parts — ideal for daily trips), Ranchi to Bhubaneswar (450 km, agricultural produce and FMCG), and Ranchi to Dhanbad (280 km, coal and mining equipment)."
      },
      {
        "question": "How much can truckers earn from Ranchi return loads?",
        "answer": "Truckers who book return loads from Ranchi earn 40-60% more per round trip compared to running empty. A Ranchi-Kolkata round trip with return load generates 50,000-65,000 rupees revenue versus 25,000-35,000 without a return load."
      },
      {
        "question": "How does LoadSaathi find return loads from Ranchi?",
        "answer": "LoadSaathi AI matching engine identifies return-load opportunities before the outbound trip concludes. It matches the truck route, capacity, and vehicle type with verified shipper requirements, pushing offers in real-time as the trucker approaches Ranchi."
      }
    ],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-23"
  },
  "return-loads-jamshedpur": {
    "title": "Finding Return Loads from Jamshedpur: A Trucker's Complete Guide (2026) | LoadSaathi",
    "metaDescription": "Truckers delivering to Jamshedpur can earn 40-60% more by booking return loads to Kolkata, Ranchi, Bhubaneswar, and Rourkela. See top corridors, earnings per...",
    "keywords": [
      "finding return loads from jamshedpur a trucker s complete guide 2026",
      "return loads jamshedpur",
      "trucker tips"
    ],
    "summary": "Truckers delivering to Jamshedpur can earn 40-60% more by booking return loads to Kolkata, Ranchi, Bhubaneswar, and Rourkela. See top corridors, earnings per trip, Tata Steel freight patterns, and LoadSaathi AI matching.",
    "author": "Rajesh Kumar",
    "authorBio": "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    "date": "2026-08-23",
    "readTime": "6 min",
    "faq": [
      {
        "question": "What are the best return load corridors from Jamshedpur?",
        "answer": "The most active corridors are Jamshedpur to Kolkata (280 km, textiles and FMCG), Jamshedpur to Ranchi (130 km, coal and construction — ideal for daily trips), Jamshedpur to Bhubaneswar (340 km, agricultural produce and machinery), and Jamshedpur to Rourkela (220 km, steel products and industrial goods)."
      },
      {
        "question": "How much can truckers earn from Jamshedpur return loads?",
        "answer": "Truckers who book return loads from Jamshedpur earn 40-60% more per round trip compared to running empty. A Jamshedpur-Kolkata round trip with return load generates 40,000-53,000 rupees revenue versus 20,000-28,000 without a return load."
      },
      {
        "question": "How does LoadSaathi find return loads from Jamshedpur?",
        "answer": "LoadSaathi AI matching engine identifies return-load opportunities before the outbound trip concludes. It matches the truck route, capacity, and vehicle type with verified shipper requirements, pushing offers in real-time as the trucker approaches Jamshedpur."
      }
    ],
    "category": "Trucker Tips",
    "lastUpdated": "2026-08-23"
  },
  "ranchi-to-bhubaneswar-freight-rates": {
    "title": "Ranchi to Bhubaneswar Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Ranchi to Bhubaneswar freight rates for 2026: PTL 6-9 rupees per kg, FTL 30,000-45,000 rupees by vehicle type. 450 km via NH-20 and NH-16, 10-12 hours...",
    "keywords": [
      "ranchi to bhubaneswar freight rates 2026 complete cost guide",
      "ranchi to bhubaneswar freight rates",
      "route guide"
    ],
    "summary": "Ranchi to Bhubaneswar freight rates for 2026: PTL 6-9 rupees per kg, FTL 30,000-45,000 rupees by vehicle type. 450 km via NH-20 and NH-16, 10-12 hours transit. Includes return-load opportunities, cargo types, and booking tips.",
    "author": "Sanjaya Sahu",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Ranchi to Bhubaneswar?",
        "answer": "PTL rates range from 6-9 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 2 tonnes typically qualify for lower per-kg rates. Transit time is 10-12 hours."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Ranchi to Bhubaneswar?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Ranchi to Bhubaneswar costs 30,000-38,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Bhubaneswar to Ranchi?",
        "answer": "Yes, the corridor has strong return-load demand. Bhubaneswar exports agricultural produce, FMCG goods, and textiles. Truckers returning from Bhubaneswar can earn 25,000-35,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "ranchi-to-kolkata-freight-rates": {
    "title": "Ranchi to Kolkata Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Ranchi to Kolkata freight rates for 2026: PTL 5-8 rupees per kg, FTL 25,000-40,000 rupees by vehicle type. 420 km via NH-33 and NH-2, 9-11 hours transit...",
    "keywords": [
      "ranchi to kolkata freight rates 2026 complete cost guide",
      "ranchi to kolkata freight rates",
      "route guide"
    ],
    "summary": "Ranchi to Kolkata freight rates for 2026: PTL 5-8 rupees per kg, FTL 25,000-40,000 rupees by vehicle type. 420 km via NH-33 and NH-2, 9-11 hours transit. Includes return-load opportunities, cargo types, and booking tips.",
    "author": "Sanjaya Sahu",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Ranchi to Kolkata?",
        "answer": "PTL rates range from 5-8 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 2 tonnes typically qualify for lower per-kg rates. Transit time is 9-11 hours."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Ranchi to Kolkata?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Ranchi to Kolkata costs 25,000-32,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Kolkata to Ranchi?",
        "answer": "Yes, the corridor has the strongest return-load demand in Jharkhand. Kolkata exports textiles, FMCG products, and engineering goods. Truckers returning from Kolkata can earn 25,000-35,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "jamshedpur-to-bhubaneswar-freight-rates": {
    "title": "Jamshedpur to Bhubaneswar Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Jamshedpur to Bhubaneswar freight rates for 2026: PTL 6-9 rupees per kg, FTL 25,000-38,000 rupees by vehicle type. 340 km via NH-16, 8-10 hours transit...",
    "keywords": [
      "jamshedpur to bhubaneswar freight rates 2026 complete cost guide",
      "jamshedpur to bhubaneswar freight rates",
      "route guide"
    ],
    "summary": "Jamshedpur to Bhubaneswar freight rates for 2026: PTL 6-9 rupees per kg, FTL 25,000-38,000 rupees by vehicle type. 340 km via NH-16, 8-10 hours transit. Includes return-load opportunities, Tata Steel cargo patterns, and booking tips.",
    "author": "Sanjaya Sahu",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Jamshedpur to Bhubaneswar?",
        "answer": "PTL rates range from 6-9 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 2 tonnes typically qualify for lower per-kg rates. Transit time is 8-10 hours."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Jamshedpur to Bhubaneswar?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Jamshedpur to Bhubaneswar costs 25,000-32,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Bhubaneswar to Jamshedpur?",
        "answer": "Yes, the corridor has moderate return-load demand. Bhubaneswar exports agricultural produce, FMCG goods, and port cargo. Truckers returning from Bhubaneswar can earn 22,000-30,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "kolkata-to-burdwan-freight-rates": {
    "title": "Kolkata to Burdwan Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Kolkata to Burdwan freight rates for 2026: PTL 3-5 rupees per kg, FTL 8,000-18,000 rupees by vehicle type. 110 km via NH-2, 2.5 hours transit. West Bengal...",
    "keywords": [
      "kolkata to burdwan freight rates 2026 complete cost guide",
      "kolkata to burdwan freight rates",
      "route guide"
    ],
    "summary": "Kolkata to Burdwan freight rates for 2026: PTL 3-5 rupees per kg, FTL 8,000-18,000 rupees by vehicle type. 110 km via NH-2, 2.5 hours transit. West Bengal intrastate corridor for coal, rice, and engineering goods with strong return-load demand.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Kolkata to Burdwan?",
        "answer": "PTL rates range from 3-5 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 2 tonnes typically qualify for lower per-kg rates. Transit time is 2-2.5 hours via NH-2."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Kolkata to Burdwan?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Kolkata to Burdwan costs 14,000-16,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Burdwan to Kolkata?",
        "answer": "Yes, the corridor has strong return-load demand. Burdwan exports coal, rice, sugar, and engineering goods. Truckers returning from Burdwan can earn 8,000-12,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "dhanbad-to-jamshedpur-freight-rates": {
    "title": "Dhanbad to Jamshedpur Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Dhanbad to Jamshedpur freight rates for 2026: PTL 4-6 rupees per kg, FTL 12,000-22,000 rupees by vehicle type. 170 km via NH-33, 3.5 hours transit. Jharkhand...",
    "keywords": [
      "dhanbad to jamshedpur freight rates 2026 complete cost guide",
      "dhanbad to jamshedpur freight rates",
      "route guide"
    ],
    "summary": "Dhanbad to Jamshedpur freight rates for 2026: PTL 4-6 rupees per kg, FTL 12,000-22,000 rupees by vehicle type. 170 km via NH-33, 3.5 hours transit. Jharkhand coal-steel corridor with coke, coal, and steel products dominating freight.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Dhanbad to Jamshedpur?",
        "answer": "PTL rates range from 4-6 rupees per kilogram depending on weight, cargo type, and delivery urgency. Coal and coke shipments often qualify for bulk discounts. Transit time is 3-3.5 hours via NH-33."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Dhanbad to Jamshedpur?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Dhanbad to Jamshedpur costs 16,000-19,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Jamshedpur to Dhanbad?",
        "answer": "Yes, the corridor has strong return-load demand. Jamshedpur exports steel products, automotive parts, and engineering goods. Truckers returning from Jamshedpur can earn 12,000-16,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "ranchi-to-dhanbad-freight-rates": {
    "title": "Ranchi to Dhanbad Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Ranchi to Dhanbad freight rates for 2026: PTL 5-8 rupees per kg, FTL 18,000-32,000 rupees by vehicle type. 280 km via NH-33, 6 hours transit. Jharkhand coal...",
    "keywords": [
      "ranchi to dhanbad freight rates 2026 complete cost guide",
      "ranchi to dhanbad freight rates",
      "route guide"
    ],
    "summary": "Ranchi to Dhanbad freight rates for 2026: PTL 5-8 rupees per kg, FTL 18,000-32,000 rupees by vehicle type. 280 km via NH-33, 6 hours transit. Jharkhand coal corridor for coal, mining equipment, and FMCG products.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Ranchi to Dhanbad?",
        "answer": "PTL rates range from 5-8 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 3 tonnes typically qualify for lower per-kg rates. Transit time is 5.5-6.5 hours via NH-33."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Ranchi to Dhanbad?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Ranchi to Dhanbad costs 24,000-28,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Dhanbad to Ranchi?",
        "answer": "Yes, the corridor has strong return-load demand. Dhanbad exports coal, coke, and mining equipment. Truckers returning from Dhanbad can earn 18,000-24,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "bhubaneswar-to-vizag-freight-rates": {
    "title": "Bhubaneswar to Visakhapatnam Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Bhubaneswar to Visakhapatnam freight rates for 2026: PTL 5-8 rupees per kg, FTL 22,000-42,000 rupees by vehicle type. 450 km via NH-16, 8-9 hours transit...",
    "keywords": [
      "bhubaneswar to visakhapatnam freight rates 2026 complete cost guide",
      "bhubaneswar to vizag freight rates",
      "route guide"
    ],
    "summary": "Bhubaneswar to Visakhapatnam freight rates for 2026: PTL 5-8 rupees per kg, FTL 22,000-42,000 rupees by vehicle type. 450 km via NH-16, 8-9 hours transit. Coastal corridor connecting Odisha and Andhra Pradesh for steel, petroleum, and seafood.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Bhubaneswar to Visakhapatnam?",
        "answer": "PTL rates range from 5-8 rupees per kilogram depending on weight, cargo type, and delivery urgency. Seafood and perishables command higher rates due to refrigerated transport requirements. Transit time is 8-9 hours via NH-16."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Bhubaneswar to Visakhapatnam?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Bhubaneswar to Visakhapatnam costs 22,000-30,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Visakhapatnam to Bhubaneswar?",
        "answer": "Yes, the corridor has moderate return-load demand. Visakhapatnam exports petroleum products, steel, and seafood. Truckers returning from Visakhapatnam can earn 18,000-26,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "balasore-to-bhubaneswar-freight-rates": {
    "title": "Balasore to Bhubaneswar Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Balasore to Bhubaneswar freight rates for 2026: PTL 3-5 rupees per kg, FTL 10,000-20,000 rupees by vehicle type. 210 km via NH-16, 4 hours transit...",
    "keywords": [
      "balasore to bhubaneswar freight rates 2026 complete cost guide",
      "balasore to bhubaneswar freight rates",
      "route guide"
    ],
    "summary": "Balasore to Bhubaneswar freight rates for 2026: PTL 3-5 rupees per kg, FTL 10,000-20,000 rupees by vehicle type. 210 km via NH-16, 4 hours transit. Intra-Odisha corridor for rice, seafood, and textiles with consistent daily demand.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Balasore to Bhubaneswar?",
        "answer": "PTL rates range from 3-5 rupees per kilogram depending on weight, cargo type, and delivery urgency. Seafood shipments command higher rates due to refrigerated transport. Transit time is 3.5-4.5 hours via NH-16."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Balasore to Bhubaneswar?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Balasore to Bhubaneswar costs 14,000-17,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Bhubaneswar to Balasore?",
        "answer": "Yes, the corridor has strong return-load demand. Bhubaneswar exports FMCG products, construction materials, and textiles. Truckers returning from Bhubaneswar can earn 10,000-14,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "berhampur-to-bhubaneswar-freight-rates": {
    "title": "Berhampur to Bhubaneswar Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Berhampur to Bhubaneswar freight rates for 2026: PTL 3-5 rupees per kg, FTL 10,000-18,000 rupees by vehicle type. 180 km via NH-16, 3.5-4 hours transit...",
    "keywords": [
      "berhampur to bhubaneswar freight rates 2026 complete cost guide",
      "berhampur to bhubaneswar freight rates",
      "route guide"
    ],
    "summary": "Berhampur to Bhubaneswar freight rates for 2026: PTL 3-5 rupees per kg, FTL 10,000-18,000 rupees by vehicle type. 180 km via NH-16, 3.5-4 hours transit. Southern Odisha to capital corridor for silk, rice, fish, and cashew.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Berhampur to Bhubaneswar?",
        "answer": "PTL rates range from 3-5 rupees per kilogram depending on weight, cargo type, and delivery urgency. Silk and fish shipments command higher rates. Transit time is 3.5-4 hours via NH-16."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Berhampur to Bhubaneswar?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Berhampur to Bhubaneswar costs 13,000-16,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Bhubaneswar to Berhampur?",
        "answer": "Yes, the corridor has moderate return-load demand. Bhubaneswar exports FMCG products, construction materials, and textiles. Truckers returning from Bhubaneswar can earn 10,000-14,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "rourkela-to-sambalpur-freight-rates": {
    "title": "Rourkela to Sambalpur Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Rourkela to Sambalpur freight rates for 2026: PTL 4-6 rupees per kg, FTL 10,000-20,000 rupees by vehicle type. 120 km via NH-14 and NH-53, 2.5 hours transit...",
    "keywords": [
      "rourkela to sambalpur freight rates 2026 complete cost guide",
      "rourkela to sambalpur freight rates",
      "route guide"
    ],
    "summary": "Rourkela to Sambalpur freight rates for 2026: PTL 4-6 rupees per kg, FTL 10,000-20,000 rupees by vehicle type. 120 km via NH-14 and NH-53, 2.5 hours transit. Western Odisha intra-state corridor for steel, aluminium, and forest products.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Rourkela to Sambalpur?",
        "answer": "PTL rates range from 4-6 rupees per kilogram depending on weight, cargo type, and delivery urgency. Steel and aluminium products have specific rate structures. Transit time is 2-2.5 hours via NH-14 and NH-53."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Rourkela to Sambalpur?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Rourkela to Sambalpur costs 14,000-17,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Sambalpur to Rourkela?",
        "answer": "Yes, the corridor has moderate return-load demand. Sambalpur exports agricultural produce, FMCG products, and construction materials. Truckers returning from Sambalpur can earn 10,000-14,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "cuttack-to-bhubaneswar-freight-rates": {
    "title": "Cuttack to Bhubaneswar Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Cuttack to Bhubaneswar freight rates for 2026: PTL 2-4 rupees per kg, FTL 5,000-12,000 rupees by vehicle type. 30 km via NH-16, 1 hour transit. Twin cities...",
    "keywords": [
      "cuttack to bhubaneswar freight rates 2026 complete cost guide",
      "cuttack to bhubaneswar freight rates",
      "route guide"
    ],
    "summary": "Cuttack to Bhubaneswar freight rates for 2026: PTL 2-4 rupees per kg, FTL 5,000-12,000 rupees by vehicle type. 30 km via NH-16, 1 hour transit. Twin cities corridor for textiles, food grains, and handicrafts with highest daily frequency in Odisha.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Cuttack to Bhubaneswar?",
        "answer": "PTL rates range from 2-4 rupees per kilogram depending on weight, cargo type, and delivery urgency. The short distance keeps rates very competitive. Transit time is 45 minutes to 1 hour via NH-16."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Cuttack to Bhubaneswar?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Cuttack to Bhubaneswar costs 8,000-10,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Bhubaneswar to Cuttack?",
        "answer": "Yes, the corridor has strong return-load demand. Bhubaneswar exports FMCG products, construction materials, and IT equipment. Truckers returning from Bhubaneswar can earn 5,000-8,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "ranchi-to-rourkela-freight-rates": {
    "title": "Ranchi to Rourkela Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Ranchi to Rourkela freight rates for 2026: PTL 4-7 rupees per kg, FTL 18,000-35,000 rupees by vehicle type. 210 km via NH-23, 5 hours transit. Jharkhand...",
    "keywords": [
      "ranchi to rourkela freight rates 2026 complete cost guide",
      "ranchi to rourkela freight rates",
      "route guide"
    ],
    "summary": "Ranchi to Rourkela freight rates for 2026: PTL 4-7 rupees per kg, FTL 18,000-35,000 rupees by vehicle type. 210 km via NH-23, 5 hours transit. Jharkhand steel corridor for coal, steel products, and mining equipment.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Ranchi to Rourkela?",
        "answer": "PTL rates range from 4-7 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 3 tonnes typically qualify for lower per-kg rates. Transit time is 4.5-5.5 hours via NH-23."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Ranchi to Rourkela?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Ranchi to Rourkela costs 24,000-28,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Rourkela to Ranchi?",
        "answer": "Yes, the corridor has strong return-load demand. Rourkela exports steel products, aluminium goods, and construction materials. Truckers returning from Rourkela can earn 18,000-24,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "rourkela-to-jamshedpur-freight-rates": {
    "title": "Rourkela to Jamshedpur Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Rourkela to Jamshedpur freight rates for 2026: PTL 4-6 rupees per kg, FTL 15,000-28,000 rupees by vehicle type. 180 km via NH-23, 4 hours transit...",
    "keywords": [
      "rourkela to jamshedpur freight rates 2026 complete cost guide",
      "rourkela to jamshedpur freight rates",
      "route guide"
    ],
    "summary": "Rourkela to Jamshedpur freight rates for 2026: PTL 4-6 rupees per kg, FTL 15,000-28,000 rupees by vehicle type. 180 km via NH-23, 4 hours transit. Steel-steel corridor for coils, sheets, automotive parts, and industrial goods.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Rourkela to Jamshedpur?",
        "answer": "PTL rates range from 4-6 rupees per kilogram depending on weight, cargo type, and delivery urgency. Bulk steel shipments often qualify for volume discounts. Transit time is 3.5-4.5 hours via NH-23."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Rourkela to Jamshedpur?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Rourkela to Jamshedpur costs 20,000-24,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Jamshedpur to Rourkela?",
        "answer": "Yes, the corridor has strong return-load demand. Jamshedpur exports automotive parts, engineering goods, and machinery. Truckers returning from Jamshedpur can earn 15,000-20,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "jamshedpur-to-rourkela-freight-rates": {
    "title": "Jamshedpur to Rourkela Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Jamshedpur to Rourkela freight rates for 2026: PTL 4-6 rupees per kg, FTL 15,000-28,000 rupees by vehicle type. 180 km via NH-33, 4 hours transit. Reverse...",
    "keywords": [
      "jamshedpur to rourkela freight rates 2026 complete cost guide",
      "jamshedpur to rourkela freight rates",
      "route guide"
    ],
    "summary": "Jamshedpur to Rourkela freight rates for 2026: PTL 4-6 rupees per kg, FTL 15,000-28,000 rupees by vehicle type. 180 km via NH-33, 4 hours transit. Reverse steel corridor for Tata Steel products, automotive parts, and engineering goods.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Jamshedpur to Rourkela?",
        "answer": "PTL rates range from 4-6 rupees per kilogram depending on weight, cargo type, and delivery urgency. Tata Steel shipments often have specific rate structures. Transit time is 3.5-4.5 hours via NH-33."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Jamshedpur to Rourkela?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Jamshedpur to Rourkela costs 20,000-24,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Rourkela to Jamshedpur?",
        "answer": "Yes, the corridor has strong return-load demand. Rourkela exports steel products, aluminium goods, and construction materials. Truckers returning from Rourkela can earn 15,000-20,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "rourkela-to-burdwan-freight-rates": {
    "title": "Rourkela to Burdwan Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Rourkela to Burdwan freight rates for 2026: PTL 5-8 rupees per kg, FTL 20,000-38,000 rupees by vehicle type. 350 km via NH-14 and NH-2, 8 hours transit...",
    "keywords": [
      "rourkela to burdwan freight rates 2026 complete cost guide",
      "rourkela to burdwan freight rates",
      "route guide"
    ],
    "summary": "Rourkela to Burdwan freight rates for 2026: PTL 5-8 rupees per kg, FTL 20,000-38,000 rupees by vehicle type. 350 km via NH-14 and NH-2, 8 hours transit. Cross-state corridor for steel, coal, and agricultural produce.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Rourkela to Burdwan?",
        "answer": "PTL rates range from 5-8 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 3 tonnes typically qualify for lower per-kg rates. Transit time is 7-9 hours via NH-14 and NH-2."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Rourkela to Burdwan?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Rourkela to Burdwan costs 28,000-32,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Burdwan to Rourkela?",
        "answer": "Yes, the corridor has moderate return-load demand. Burdwan exports coal, rice, sugar, and engineering goods. Truckers returning from Burdwan can earn 18,000-24,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "ranchi-to-jamshedpur-freight-rates": {
    "title": "Ranchi to Jamshedpur Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Ranchi to Jamshedpur freight rates for 2026: PTL 4-6 rupees per kg, FTL 12,000-22,000 rupees by vehicle type. 130 km via NH-33, 3 hours transit. Short-haul...",
    "keywords": [
      "ranchi to jamshedpur freight rates 2026 complete cost guide",
      "ranchi to jamshedpur freight rates",
      "route guide"
    ],
    "summary": "Ranchi to Jamshedpur freight rates for 2026: PTL 4-6 rupees per kg, FTL 12,000-22,000 rupees by vehicle type. 130 km via NH-33, 3 hours transit. Short-haul industrial corridor for coal, steel products, and FMCG goods.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Ranchi to Jamshedpur?",
        "answer": "PTL rates range from 4-6 rupees per kilogram depending on weight, cargo type, and delivery urgency. The short distance keeps per-kg rates competitive. Transit time is 2.5-3.5 hours via NH-33."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Ranchi to Jamshedpur?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Ranchi to Jamshedpur costs 16,000-19,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Jamshedpur to Ranchi?",
        "answer": "Yes, the corridor has strong return-load demand. Jamshedpur exports automotive parts, engineering goods, and machinery. Truckers returning from Jamshedpur can earn 12,000-16,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "jamshedpur-to-ranchi-freight-rates": {
    "title": "Jamshedpur to Ranchi Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Jamshedpur to Ranchi freight rates for 2026: PTL 4-6 rupees per kg, FTL 12,000-22,000 rupees by vehicle type. 130 km via NH-33, 3 hours transit. Reverse...",
    "keywords": [
      "jamshedpur to ranchi freight rates 2026 complete cost guide",
      "jamshedpur to ranchi freight rates",
      "route guide"
    ],
    "summary": "Jamshedpur to Ranchi freight rates for 2026: PTL 4-6 rupees per kg, FTL 12,000-22,000 rupees by vehicle type. 130 km via NH-33, 3 hours transit. Reverse short-haul corridor for Tata Steel products, automotive parts, and engineering goods.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Jamshedpur to Ranchi?",
        "answer": "PTL rates range from 4-6 rupees per kilogram depending on weight, cargo type, and delivery urgency. Tata Steel shipments often have specific rate structures. Transit time is 2.5-3.5 hours via NH-33."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Jamshedpur to Ranchi?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Jamshedpur to Ranchi costs 16,000-19,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Ranchi to Jamshedpur?",
        "answer": "Yes, the corridor has strong return-load demand. Ranchi exports coal, FMCG products, and construction materials. Truckers returning from Ranchi can earn 12,000-16,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "jamshedpur-to-burdwan-freight-rates": {
    "title": "Jamshedpur to Burdwan Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Jamshedpur to Burdwan freight rates for 2026: PTL 5-8 rupees per kg, FTL 18,000-35,000 rupees by vehicle type. 320 km via NH-33 and NH-2, 7 hours transit...",
    "keywords": [
      "jamshedpur to burdwan freight rates 2026 complete cost guide",
      "jamshedpur to burdwan freight rates",
      "route guide"
    ],
    "summary": "Jamshedpur to Burdwan freight rates for 2026: PTL 5-8 rupees per kg, FTL 18,000-35,000 rupees by vehicle type. 320 km via NH-33 and NH-2, 7 hours transit. Cross-state corridor for steel, automotive parts, and agricultural produce.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Jamshedpur to Burdwan?",
        "answer": "PTL rates range from 5-8 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 3 tonnes typically qualify for lower per-kg rates. Transit time is 6-8 hours via NH-33 and NH-2."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Jamshedpur to Burdwan?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Jamshedpur to Burdwan costs 26,000-30,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Burdwan to Jamshedpur?",
        "answer": "Yes, the corridor has moderate return-load demand. Burdwan exports coal, rice, sugar, and engineering goods. Truckers returning from Burdwan can earn 16,000-22,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "bhubaneswar-to-burdwan-freight-rates": {
    "title": "Bhubaneswar to Burdwan Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Bhubaneswar to Burdwan freight rates for 2026: PTL 5-8 rupees per kg, FTL 22,000-42,000 rupees by vehicle type. 480 km via NH-16 and NH-2, 10-12 hours...",
    "keywords": [
      "bhubaneswar to burdwan freight rates 2026 complete cost guide",
      "bhubaneswar to burdwan freight rates",
      "route guide"
    ],
    "summary": "Bhubaneswar to Burdwan freight rates for 2026: PTL 5-8 rupees per kg, FTL 22,000-42,000 rupees by vehicle type. 480 km via NH-16 and NH-2, 10-12 hours transit. Cross-state corridor connecting Odisha and West Bengal for agricultural produce, FMCG, and construction materials.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Bhubaneswar to Burdwan?",
        "answer": "PTL rates range from 5-8 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 3 tonnes typically qualify for lower per-kg rates. Transit time is 10-12 hours via NH-16 and NH-2."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Bhubaneswar to Burdwan?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Bhubaneswar to Burdwan costs 30,000-36,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Burdwan to Bhubaneswar?",
        "answer": "Yes, the corridor has moderate return-load demand. Burdwan exports coal, rice, sugar, and engineering goods. Truckers returning from Burdwan can earn 20,000-28,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "sambalpur-to-jharsuguda-freight-rates": {
    "title": "Sambalpur to Jharsuguda Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Sambalpur to Jharsuguda freight rates for 2026: PTL 3-5 rupees per kg, FTL 8,000-16,000 rupees by vehicle type. 80 km via NH-53, 2 hours transit. Western...",
    "keywords": [
      "sambalpur to jharsuguda freight rates 2026 complete cost guide",
      "sambalpur to jharsuguda freight rates",
      "route guide"
    ],
    "summary": "Sambalpur to Jharsuguda freight rates for 2026: PTL 3-5 rupees per kg, FTL 8,000-16,000 rupees by vehicle type. 80 km via NH-53, 2 hours transit. Western Odisha short-haul corridor for coal, aluminium, and forest products.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Sambalpur to Jharsuguda?",
        "answer": "PTL rates range from 3-5 rupees per kilogram depending on weight, cargo type, and delivery urgency. The short distance keeps per-kg rates competitive. Transit time is 1.5-2.5 hours via NH-53."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Sambalpur to Jharsuguda?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Sambalpur to Jharsuguda costs 12,000-14,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Jharsuguda to Sambalpur?",
        "answer": "Yes, the corridor has strong return-load demand. Jharsuguda exports aluminium products, power equipment, and construction materials. Truckers returning from Jharsuguda can earn 8,000-12,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "sambalpur-to-bhubaneswar-freight-rates": {
    "title": "Sambalpur to Bhubaneswar Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Sambalpur to Bhubaneswar freight rates for 2026: PTL 4-6 rupees per kg, FTL 12,000-24,000 rupees by vehicle type. 280 km via NH-53 and NH-16, 6 hours...",
    "keywords": [
      "sambalpur to bhubaneswar freight rates 2026 complete cost guide",
      "sambalpur to bhubaneswar freight rates",
      "route guide"
    ],
    "summary": "Sambalpur to Bhubaneswar freight rates for 2026: PTL 4-6 rupees per kg, FTL 12,000-24,000 rupees by vehicle type. 280 km via NH-53 and NH-16, 6 hours transit. Intra-Odisha corridor for coal, aluminium, and agricultural produce.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Sambalpur to Bhubaneswar?",
        "answer": "PTL rates range from 4-6 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 3 tonnes typically qualify for lower per-kg rates. Transit time is 5.5-6.5 hours via NH-53 and NH-16."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Sambalpur to Bhubaneswar?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Sambalpur to Bhubaneswar costs 18,000-22,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Bhubaneswar to Sambalpur?",
        "answer": "Yes, the corridor has moderate return-load demand. Bhubaneswar exports FMCG products, construction materials, and textiles. Truckers returning from Bhubaneswar can earn 12,000-18,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "rourkela-to-cuttack-freight-rates": {
    "title": "Rourkela to Cuttack Freight Rates 2026: Complete Cost Guide | LoadSaathi",
    "metaDescription": "Rourkela to Cuttack freight rates for 2026: PTL 4-7 rupees per kg, FTL 18,000-35,000 rupees by vehicle type. 350 km via NH-14 and NH-16, 8 hours transit...",
    "keywords": [
      "rourkela to cuttack freight rates 2026 complete cost guide",
      "rourkela to cuttack freight rates",
      "route guide"
    ],
    "summary": "Rourkela to Cuttack freight rates for 2026: PTL 4-7 rupees per kg, FTL 18,000-35,000 rupees by vehicle type. 350 km via NH-14 and NH-16, 8 hours transit. Intra-Odisha corridor connecting steel hub with commercial capital for steel, textiles, and handicrafts.",
    "author": "Sanjaya Sahu",
    "authorBio": "Sanjaya Sahu is the founder of LoadSaathi with deep expertise in Indian logistics and freight corridors.",
    "date": "2026-08-23",
    "readTime": "5 min",
    "faq": [
      {
        "question": "What are the PTL rates from Rourkela to Cuttack?",
        "answer": "PTL rates range from 4-7 rupees per kilogram depending on weight, cargo type, and delivery urgency. Shipments over 3 tonnes typically qualify for lower per-kg rates. Transit time is 7-9 hours via NH-14 and NH-16."
      },
      {
        "question": "What is the FTL rate for a 10-wheeler from Rourkela to Cuttack?",
        "answer": "A 10-wheeler (20-22 ft) FTL from Rourkela to Cuttack costs 26,000-30,000 rupees for 9-15 tonne loads. Rates include fuel and driver costs but exclude tolls and loading/unloading charges."
      },
      {
        "question": "Are there return loads from Cuttack to Rourkela?",
        "answer": "Yes, the corridor has moderate return-load demand. Cuttack exports textiles, handicrafts, and agricultural produce. Truckers returning from Cuttack can earn 16,000-22,000 rupees on the return leg."
      }
    ],
    "category": "Route Guide",
    "lastUpdated": "2026-08-23"
  },
  "gst-verified-transporters": {
    "title": "GST-Verified Transporters: Why It Matters When You Book a Truck Online | LoadSaathi",
    "metaDescription": "GST-verified transporters give shippers valid tax invoices, input tax credit, and clean e-Way Bills. As of September 2026, here is how to verify any...",
    "keywords": [
      "gst verified transporters why it matters when you book a truck online",
      "gst verified transporters",
      "compliance"
    ],
    "summary": "GST-verified transporters give shippers valid tax invoices, input tax credit, and clean e-Way Bills. As of September 2026, here is how to verify any transporter's GSTIN free on the GST portal before you book.",
    "author": "LoadSaathi Team",
    "authorBio": "LoadSaathi compliance desk publishes practical guides on GST, e-Way Bills, and freight documentation for Indian shippers and truckers.",
    "date": "2026-09-15",
    "readTime": "7 min",
    "faq": [
      {
        "question": "What does GST-verified mean for a transporter?",
        "answer": "It means the transporter's GST registration is shown as Active on the official GST portal. Their invoices carry a valid GSTIN, which lets business shippers claim input tax credit and keeps e-Way Bill details consistent. Verification is free on gst.gov.in under Services, Search Taxpayer, Search by GSTIN."
      },
      {
        "question": "How do I check a transporter's GST number for free?",
        "answer": "Go to gst.gov.in, open Services, then Search Taxpayer, then Search by GSTIN. Enter the GSTIN from the transporter's quote or invoice. Confirm the trade name matches the business you are dealing with and that the status is Active. No login or fee is required, and the check takes about a minute as of September 2026."
      },
      {
        "question": "Can I claim input tax credit on freight charges?",
        "answer": "Yes, when a GST-registered transporter issues a compliant invoice and the normal ITC conditions are met. Whether GST on freight is charged by the transporter under forward charge or paid by you under reverse charge depends on the status of both parties, so confirm the treatment with your accountant alongside the invoice."
      },
      {
        "question": "GST kitna lagta hai truck transport pe?",
        "answer": "September 2026 tak ke rules ke mutabik, ek registered goods transport agency freight par 5% (bina input tax credit) ya 12% (input tax credit ke saath) option charge kar sakta hai, aur ye option invoice par likha hona chahiye. Registration threshold aam states me 40 lakh rupees hai. Exact liability forward charge ya reverse charge me decide hoti hai, isliye invoice par GSTIN aur rate dono verify karein."
      },
      {
        "question": "Kya bina GST bill ke truck book karna chahiye?",
        "answer": "Avoid karein. 50,000 rupees se upar consignment value ke liye e-Way Bill mandatory hai, jisme transporter GSTIN ya enrollment ID lagti hai. Bina GST invoice ke aap input tax credit nahi le paate, dispute me documented proof nahi bachta, aur checkpoint par document mismatch ka risk rehta hai. GST-verified transporter se booking confirm karein."
      }
    ],
    "category": "Compliance",
    "lastUpdated": "2026-09-25"
  },
  "what-is-load-board": {
    "title": "What Is a Load Board and How Does Freight Matching Work in India? | LoadSaathi",
    "metaDescription": "A load board is an online marketplace where shippers post loads and truckers post available trucks. As of September 2026, here is how load boards and freight...",
    "keywords": [
      "what is a load board and how does freight matching work in india",
      "what is load board",
      "trucker tips"
    ],
    "summary": "A load board is an online marketplace where shippers post loads and truckers post available trucks. As of September 2026, here is how load boards and freight matching work in India, and how to pick one.",
    "author": "LoadSaathi Team",
    "authorBio": "LoadSaathi team explains how digital freight matching works for Indian truckers and MSME shippers, corridor by corridor.",
    "date": "2026-09-12",
    "readTime": "8 min",
    "faq": [
      {
        "question": "Load board kya hota hai?",
        "answer": "Load board ek online marketplace hai jahan shipper apna load post karta hai aur trucker apni khaali truck ki details post karta hai. Route, weight, vehicle type aur date dekh kar dono side baat karte hain aur deal fix karte hain. Ye transport-nagar ki physical wall ka digital version hai, jaise September 2026 me app-based platforms kaam karte hain."
      },
      {
        "question": "Load board aur transport broker me kya farak hai?",
        "answer": "Broker shipment ki poori zimmedari leta hai aur margin par sab arrange karta hai. Load board aapko visibility aur tools deta hai, carrier aur terms aap khud choose karte hain. Brokers complex lanes ke liye comfortable hain, direct matching routine corridor runs ke liye zyada control aur rate transparency deti hai."
      },
      {
        "question": "How does a load board match a truck to a shipment?",
        "answer": "Both sides are geocoded, a road route is calculated, and postings are filtered by capacity, vehicle type, and departure window. Surviving pairs are scored on route overlap, capacity fit, price alignment, timing, and carrier track record. The strongest pairs are surfaced first, and once a request is accepted, chat, payment, and tracking open for that booking."
      },
      {
        "question": "Are load boards free to use in India?",
        "answer": "Models vary. Some charge truckers a monthly subscription, some take a commission per completed load, some are free for carriers and monetise shipper-side features, and broker-private boards charge per posting. Before paying, confirm the board covers your corridors, verifies its postings, and protects payment until delivery."
      },
      {
        "question": "How do load boards reduce empty kilometres?",
        "answer": "They make the return leg visible before the truck commits to the outbound trip. India's Ministry of Road Transport and Highways estimates over 35% of commercial truck-kilometres run empty, so posting the return load on a board turns a blind leg into a booked one. Pair boards with route planning tactics from our return loads guide for the full picture."
      }
    ],
    "category": "Trucker Tips",
    "lastUpdated": "2026-09-25"
  }
};

// ── Guide SEO metadata (3 guides) ─────────────────────────────────────────────
const GUIDE_DATA = {
  "ptl-vs-ftl": {
    title: "PTL vs FTL: Which Freight Option Is Right for Your Business? | LoadSaathi",
    metaDescription: "PTL (Part Truck Load) is ideal for shipments under 3 tonnes, offering 30-40% savings by sharing truck space. FTL (Full Truck Load) is best for shipments over 7 ",
    keywords: ["ptl vs ftl", "part truck load", "full truck load", "shipping comparison india"],
    summary: "PTL (Part Truck Load) is ideal for shipments under 3 tonnes, offering 30-40% savings by sharing truck space. FTL (Full Truck Load) is best for shipments over 7 tonnes needing exclusive vehicle use. LoadSaathi offers both options on all East India corridors.",
    author: "LoadSaathi Team",
    authorBio: "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    readTime: "6 min read",
    date: "2026-06-01",
    lastUpdated: "2026-08-08",
    steps: [
      { name: "Measure your shipment weight and volume", text: "Weigh your goods and measure their dimensions. Shipments under 3 tonnes are typically more cost-effective as PTL, while loads over 7 tonnes generally require FTL." },
      { name: "Set your delivery timeline", text: "If your cargo is urgent or time-sensitive, choose FTL for direct point-to-point delivery. If you have 1-2 extra days of buffer, PTL saves you 30-40%." },
      { name: "Compare costs for your route", text: "Use the LoadSaathi Fare Calculator to compare PTL and FTL pricing on your specific corridor before committing." },
      { name: "Book through LoadSaathi", text: "Post your shipment and the platform's AI automatically recommends the most cost-effective option based on weight, volume, and delivery requirements." },
    ],
    rateTable: {
      caption: "PTL vs FTL at a glance",
      headers: ["Factor", "PTL (Part Truck Load)", "FTL (Full Truck Load)"],
      rows: [
        ["Best for", "Shipments under 3 tonnes", "Shipments over 7 tonnes"],
        ["Cost", "30-40% less than booking a full truck", "Full vehicle rate"],
        ["Transit time", "Slightly longer, multiple pickups and deliveries", "Fastest, direct with no intermediate stops"],
        ["Vehicle use", "Shared truck space", "Exclusive use of the entire vehicle"],
        ["Ideal when", "Regular MSME shipments with flexible timelines", "Urgent or high-value cargo"],
      ],
      footnote: "Indicative guidance for East India corridors. Compare live prices with the LoadSaathi Fare Calculator.",
    }
  },
  "freight-rates-east-india": {
    title: "Freight Rates in East India: Complete Guide 2026 | LoadSaathi",
    metaDescription: "Freight rates across East India corridors vary by distance, cargo type, and vehicle availability. The Rourkela–Ranchi corridor averages ₹1,800-2,500/tonne for P",
    keywords: ["east india freight rates", "freight rates odisha", "west bengal freight", "jharkhand shipping rates"],
    summary: "Freight rates across East India corridors vary by distance, cargo type, and vehicle availability. The Rourkela–Ranchi corridor averages ₹1,800-2,500/tonne for PTL, while longer routes like Rourkela–Kolkata range from ₹2,500-3,500/tonne.",
    author: "Amit Verma",
    authorBio: "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    readTime: "8 min read",
    date: "2026-06-01",
    lastUpdated: "2026-08-08",
    steps: [
      { name: "Identify your origin and destination corridors", text: "Rates vary by route. Short corridors like Rourkela–Ranchi (180 km) are cheaper per tonne than long-haul routes like Rourkela–Kolkata (430 km)." },
      { name: "Estimate cargo weight and type", text: "PTL rates are quoted per tonne while FTL rates are per vehicle. Steel and heavy industrial cargo typically command a premium." },
      { name: "Check current market rates", text: "Reference corridor averages such as ₹1,800-2,500/tonne for Rourkela–Ranchi PTL and ₹9,000-12,000 for a 7-ton FTL on the same route." },
      { name: "Use LoadSaathi's AI Price Predictor", text: "Post your shipment and the AI analyzes live market conditions, fuel, and truck availability to recommend fair pricing." },
    ],
    rateTable: {
      caption: "East India corridor freight rate snapshot",
      headers: ["Corridor", "Distance", "PTL rate (per tonne)", "FTL rate (per vehicle)"],
      rows: [
        ["Rourkela–Ranchi", "180 km", "₹1,800–2,500", "₹9,000–12,000 (7-ton) / ₹22,000–28,000 (25-ton)"],
        ["Rourkela–Bhubaneswar", "340 km", "₹2,200–3,000", "—"],
        ["Rourkela–Kolkata", "430 km", "₹2,500–3,500", "—"],
      ],
      footnote: "Indicative 2026 corridor averages from this guide. FTL is quoted per vehicle — check the Fare Calculator for current pricing.",
    }
  },
  "shipping-steel": {
    title: "How to Ship Steel in India: A Complete Guide for Manufacturers | LoadSaathi",
    metaDescription: "Shipping steel requires specialized handling: covered trucks to prevent rust, proper load distribution, and secure tie-downs. Major corridors include Rourkela–J",
    keywords: ["shipping steel india", "steel transport", "steel logistics", "heavy cargo shipping"],
    summary: "Shipping steel requires specialized handling: covered trucks to prevent rust, proper load distribution, and secure tie-downs. Major corridors include Rourkela–Jamshedpur, Jamshedpur–Kolkata, and Bhubaneswar–Vizag.",
    author: "Rajesh Kumar",
    authorBio: "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    readTime: "7 min read",
    date: "2026-06-01",
    lastUpdated: "2026-08-08",
    steps: [
      { name: "Choose the right truck type", text: "Use covered or waterproofed trucks to prevent rust on TMT bars, HR coils, CR sheets, and structural steel, especially during monsoon months." },
      { name: "Distribute weight evenly", text: "Balance the load across axles to avoid overloading penalties and comply with RTO regulations." },
      { name: "Secure all loads properly", text: "Use steel straps or chains rated for the cargo weight so the load does not shift during transit." },
      { name: "Post exact specs on LoadSaathi", text: "Include the steel grade, dimensions, and weight when posting so the AI matches you with trucks that have the right equipment." },
    ]
  }
};

// /transport-service/[city] pages — generated from TransportServicePage.tsx
const TRANSPORT_SERVICE_DATA = {
  "ranchi": {
    "cityName": "Ranchi",
    "title": "Part Load Transport in Ranchi - PTL & FTL Truck Booking | LoadSaathi",
    "metaDescription": "Part load transport in Ranchi connects pickups across Hatia, Kokar, Morabadi, Doranda and Namkum to Kolkata, Jamshedpur, Patna and Rourkela. PTL booking in Ranc",
    "keywords": [
      "part load transport ranchi",
      "PTL booking ranchi",
      "truck booking ranchi",
      "freight service ranchi"
    ],
    "summary": "Part load and full truck booking for Ranchi's Hatia, Kokar, Morabadi, Doranda and Namkum belts, moving coal, machinery spares, agriculture produce and retail stock across Jharkhand, West Bengal and Bihar.",
    "faq": [
      {
        "question": "Ranchi se Kolkata truck booking kaise karein aur kitna time lagta hai?",
        "answer": "Ranchi se Kolkata ke liye booking teen step mein hoti hai — pickup aur drop area choose karein, cargo weight aur type daalein, phir verified trucker ka rate range aur rating compare karke confirm karein. Ranchi se Kolkata tak lagbhag 390 km hai; transit time truck type, loading window aur route ke hisaab se 8–12 hours hota hai. Shared PTL load ke liye Kolkata aur Jamshedpur side daily departures milti hain, aur FTL ke liye aap apni preferred date choose kar sakte hain. Booking se pehle aap truck type, estimated arrival aur trucker rating sab app mein dekh sakte hain."
      },
      {
        "question": "Ranchi mein pickup kis area se ho sakta hai?",
        "answer": "LoadSaathi par Ranchi ke Hatia, Kokar, Morabadi, Doranda aur Namkum areas se pickup book ho sakta hai. Sheetal Nagar, Ratu Road aur Ring Road ke godowns aur industrial sheds se bhi loaders available hain. Aapko sirf pickup address aur loading time dena hai — trucker location confirm karke aata hai, aur aapko driver details, vehicle number aur live location booking ke andar mil jaate hain."
      },
      {
        "question": "Coal aur heavy machinery Ranchi se safely kaise load hota hai?",
        "answer": "Coal ke liye high-bed aur tippers suggest kiye jaate hain, aur machinery spares ke liye craned loading aur wooden packing chahiye hoti hai. Loading ke waqt tarpaulin covering, lashing straps aur weighbridge slip verify karein — in sab ko aap booking ki special instructions mein likh sakte hain. Truckers ka mining-area experience aur vehicle capacity profile par diya hota hai, aur GPS tracking pickup se delivery tak chalti rehti hai, taaki aap coal ya equipment ki position live dekh sakein."
      },
      {
        "question": "Coal ya ore bhejne par GST details aur GPS tracking milti hai?",
        "answer": "Har LoadSaathi booking par aap jo cargo description, weight aur shipper details daalte hain wahi GST e-way bill ke inputs hain, isliye booking banate waqt ye details sahi bharein. Coal, lignite aur ore jaise bulk loads par GPS tracking pickup se delivery tak chalti hai aur app se live position, expected arrival aur delivery confirmation dikhti hai. Tarpaulin covering aur weighbridge slip dispatch se pehle trucker se confirm kar lein — heavy machinery aur high-value consignments ke liye insurance option bhi poochha ja sakta hai."
      }
    ],
    "locationSlug": "ranchi"
  },
  "bhubaneswar": {
    "cityName": "Bhubaneswar",
    "title": "Part Load Transport in Bhubaneswar - PTL & FTL Truck Booking | LoadSaathi",
    "metaDescription": "Part load transport in Bhubaneswar serves Mancheswar Industrial Estate, Patia, Khordha and Jatni, with corridors running to Rourkela, Cuttack, Sambalpur and Kol",
    "keywords": [
      "part load transport bhubaneswar",
      "PTL booking bhubaneswar",
      "truck booking bhubaneswar",
      "freight service bhubaneswar"
    ],
    "summary": "PTL and FTL freight booking for Mancheswar Industrial Estate, Patia, Khordha and Jatni — pharma, FMCG, food grains and port cargo moving to Rourkela, Cuttack, Sambalpur and Kolkata.",
    "faq": [
      {
        "question": "Bhubaneswar se Rourkela part load bhejna hai — kaise book karun?",
        "answer": "Bhubaneswar se Rourkela ke liye PTL booking app mein teen step mein poori hoti hai — pickup area (Mancheswar, Patia ya Jatni) choose karein, weight aur goods type daalein, aur shared-truck options compare karke confirm karein. Ye lane takriban 310 km hai, aur part load me aap sirf apne occupied weight aur volume ke liye pay karte hain. Daily departures milne ki wajah se chhote consignments kaafi jaldi deliver hote hain. Agar poora 16MT load hai ya fixed delivery date chahiye, to FTL option choose karein."
      },
      {
        "question": "Bhubaneswar mein pickup kahan se hota hai?",
        "answer": "Mancheswar Industrial Estate, Patia, Khordha aur Jatni se regular pickups ho sakte hain. Patia aur Jaydev Vihar ke warehouses, Khordha Road ke industrial units aur Jatni ke godowns se bhi loaders available hain. Aap pickup address ke saath loading time bhi mention karein — trucker confirm karke vehicle details aur live location share karta hai, aur aap delivery tak tracking dekh sakte hain."
      },
      {
        "question": "Pharma, FMCG aur food-grade cargo Bhubaneswar se safely kaise jaata hai?",
        "answer": "Pharma aur FMCG cartons ke liye covered ya container trucks suggest kiye jaate hain taaki dust aur moisture se maal bacha rahe. Food grains aur pulses ke liye sealed bags aur tarpaulin covering use hoti hai. Booking mein packaging type, carton count aur handling notes likhein, aur trucker se confirm karein ki vehicle clean aur dry hai. High-value pharma shipments ke liye insurance option poochha sakte hain, aur GPS tracking se aap poora movement app se follow kar sakte hain."
      },
      {
        "question": "Sealed carton ya pharma load par GST invoice aur GPS tracking milti hai?",
        "answer": "Har booking par aap cargo description, weight aur shipper details daalte hain — yehi details GST e-way bill banane ke liye chahiye, isliye book karte waqt inhe sahi rakhein. Bhubaneswar se jaane wale sealed carton, pharma aur FMCG loads par GPS tracking pickup se delivery tak chalti hai, jisse aap live position aur delivery confirmation dekh sakte hain. Container number aur seal detail dispatch ke baad note kar lein, aur special handling instructions booking ke andar add karein."
      }
    ],
    "locationSlug": "bhubaneswar"
  },
  "rourkela": {
    "cityName": "Rourkela",
    "title": "Part Load Transport in Rourkela - PTL & FTL Truck Booking | LoadSaathi",
    "metaDescription": "Part load transport in Rourkela runs out of Chhend, Sector 19, Fertiliser Township, Jagda and Raghunathpali toward Bhubaneswar, Kolkata, Jamshedpur and Cuttack.",
    "keywords": [
      "part load transport rourkela",
      "PTL booking rourkela",
      "truck booking rourkela",
      "freight service rourkela"
    ],
    "summary": "Steel, cement, forest product and engineering freight from Chhend, Sector 19, Fertiliser Township, Jagda and Raghunathpali to Bhubaneswar, Kolkata, Jamshedpur and Cuttack.",
    "faq": [
      {
        "question": "Rourkela se Bhubaneswar part load kab book karein?",
        "answer": "Rourkela se Bhubaneswar ke liye PTL booking aap cargo ready hone se ek din pehle kar lein, taaki shared truck ka space confirm ho. Ye lane takriban 310 km hai, aur part load me aap apne weight aur volume ke hisaab se pay karte hain — poora truck khali karne ki zaroorat nahi. Cement bags, plywood, fasteners aur engineering parts ke liye daily departures milti hain. Agar steel coil ya heavy machinery ja rahi hai ya fixed delivery date zaroori hai, to FTL option better rahega."
      },
      {
        "question": "Rourkela mein pickup kis area se hoga?",
        "answer": "Chhend, Sector 19, Fertiliser Township, Jagda aur Raghunathpali se regular pickups ho sakte hain. Rourkela Steel Plant ke gate areas, Ghaghra aur Tatyapara ke godowns se bhi loaders available hain. Pickup address aur loading time batate hi trucker vehicle details, driver number aur live location share karta hai, aur aap delivery tak movement app se follow kar sakte hain."
      },
      {
        "question": "Steel coils aur cement ke liye kaunsa truck type chahiye?",
        "answer": "Hot-rolled steel coils ke liye high-bed ya flatbed trailer chahiye taaki coil craned loading ke waqt stable rahe; coils ko lashing straps aur dunnage se secure kiya jaata hai. Cement bags ke liye covered container ya high-bed open truck suitable hai, aur tarpaulin covering mausam ke hisaab se add hoti hai. Machinery aur heavy parts ke liye crane-assisted loading confirm karein. Booking ke truck type field mein cargo weight aur dimensions zaroor daalein taaki sahi vehicle allot ho."
      },
      {
        "question": "Steel ya cement ki booking par GST details aur GPS tracking milti hai?",
        "answer": "Booking mein aap jo cargo description, weight aur invoice details daalte hain wahi GST e-way bill ke inputs hain, isliye steel coil ya cement ka net weight aur packaging count sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse aap Rourkela se Bhubaneswar ya Kolkata tak movement live dekh sakte hain. Lashing, covering aur weighbridge slip dispatch se pehle trucker se confirm kar lein, aur high-value engineering parts ke liye insurance option poochha lein."
      }
    ],
    "locationSlug": "rourkela"
  },
  "jamshedpur": {
    "cityName": "Jamshedpur",
    "title": "Part Load Transport in Jamshedpur - PTL & FTL Truck Booking | LoadSaathi",
    "metaDescription": "Part load transport in Jamshedpur covers Bistupur, Sakchi, Jugsalai, Kadma, Sonali and Gamharia, with freight moving to Kolkata, Ranchi, Rourkela and Bhubaneswa",
    "keywords": [
      "part load transport jamshedpur",
      "PTL booking jamshedpur",
      "truck booking jamshedpur",
      "freight service jamshedpur"
    ],
    "summary": "Automotive components, steel and engineering freight from Bistupur, Sakchi, Jugsalai, Kadma, Sonali and Gamharia to Kolkata, Ranchi, Rourkela and Bhubaneswar.",
    "faq": [
      {
        "question": "Jamshedpur se Kolkata full truck kaise milega?",
        "answer": "Jamshedpur se Kolkata ke liye FTL booking app mein pickup area, weight aur preferred date daal kar hoti hai. Ye lane takriban 290 km ka hai aur truck type ke hisaab se transit time 6–8 hours rehta hai. Shared PTL option chahiye to weight chhota rakh kar bhi booking kar sakte hain — usme dusron ke consignments ke saath space share hota hai aur rate per kg kam padta hai. Har option par rate range, truck type aur trucker rating confirm karne se pehle dikh jaati hai."
      },
      {
        "question": "Jamshedpur mein pickup kahan se hota hai?",
        "answer": "Bistupur, Sakchi, Jugsalai, Kadma, Sonali aur Gamharia se pickups regular hote hain. Sakchi aur Bistupur ke industrial sheds, Jugsalai ke godowns aur Gamharia ke plant gates se bhi loading ho sakti hai. Pickup address ke saath loading time aur forklift/crane availability bata dein — trucker confirm karte waqt vehicle number, driver contact aur live location share karta hai."
      },
      {
        "question": "Auto components aur engineering goods ke liye kaunsa truck type sahi hai?",
        "answer": "Automobile components aur fasteners ke liye closed container (20ft ya 32ft) best hai taaki dust, moisture aur chori se maal bacha rahe. Wire aur cable reels ke liye high-bed open truck with lashing suitable rehta hai, aur heavy engineering parts ke liye crane-assisted loading chahiye. Finished steel products ke liye flatbed ya high-bed trailer use hota hai. Booking mein cargo dimensions aur weight zaroor daalein taaki matching engine sahi vehicle suggest kare."
      },
      {
        "question": "Steel coil ya engineering load par GST details aur GPS tracking milti hai?",
        "answer": "Booking ke andar aap jo cargo description, weight aur invoice inputs daalte hain wahi GST e-way bill banane ke liye chahiye, isliye coil ka number, net weight aur packaging detail sahi rakhein. LoadSaathi par GPS tracking pickup se delivery tak active rehti hai, jisse Jamshedpur se Kolkata ya Ranchi ka movement aap live dekh sakte hain. Lashing aur covering dispatch se pehle confirm karein, aur high-value engineering parts ke liye insurance option poochha lein."
      }
    ],
    "locationSlug": "jamshedpur"
  },
  "balasore": {
    "cityName": "Balasore",
    "title": "Part Load Transport in Balasore - PTL & FTL Truck Booking | LoadSaathi",
    "metaDescription": "Part load transport in Balasore runs from Sahadevkhunta, Fakir Mohan and Chandinichowk toward Bhubaneswar, Kolkata, Cuttack and Rourkela. PTL booking in Balasor",
    "keywords": [
      "part load transport balasore",
      "PTL booking balasore",
      "truck booking balasore",
      "freight service balasore"
    ],
    "summary": "Rice, paddy, textile and palm oil freight from Sahadevkhunta, Fakir Mohan and Chandinichowk to Bhubaneswar, Kolkata, Cuttack and Rourkela.",
    "faq": [
      {
        "question": "Balasore se Bhubaneswar chhota load kaise bhejein?",
        "answer": "Balasore se Bhubaneswar ke liye chhota load PTL booking se bhejein — aap sirf apne weight aur volume ke hisaab se pay karte hain, poora truck khareedne ki zaroorat nahi. Ye lane takriban 210 km hai aur shared trucks regularly nikalte hain. Pickup area (Sahadevkhunta ya Chandinichowk), weight aur goods type daalte hi options dikh jaate hain. Agar poora 16MT rice ya bulk textile ja raha hai aur date fixed hai, to FTL choose karein."
      },
      {
        "question": "Balasore mein pickup kis area se hoga?",
        "answer": "Sahadevkhunta, Fakir Mohan aur Chandinichowk se regular pickups ho sakte hain. Balasore town ke mill godowns, rice market ke warehouses aur buses stand area ke godowns se bhi loaders available hain. Pickup address aur loading time batate hi trucker vehicle details aur live location share karta hai, aur aap app se delivery tak movement follow kar sakte hain."
      },
      {
        "question": "Rice bags aur textile bales ke liye kaunsa truck type chahiye?",
        "answer": "Rice aur paddy bags ke liye covered container ya tarpaulin-covered open truck suitable hai taaki baarish aur moisture se maal bacha rahe; bags stacked aur lashed hona chahiye. Textile bales ke liye dry covered container best hai, aur palm oil drums ke liye high-bed truck with side protection use hota hai. Jute aur cotton loads me ventilation bhi zaroori ho sakti hai. Booking mein bag count, weight aur packaging type daalein taaki sahi vehicle allot ho."
      },
      {
        "question": "Rice ya textile ki booking par GST details aur GPS tracking milti hai?",
        "answer": "Booking par aap jo weight, cargo description aur invoice details daalte hain wahi GST e-way bill ke liye chahiye, isliye rice ka bag count aur net weight sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse Balasore se Bhubaneswar ya Kolkata ka movement live dikhta hai aur delivery confirmation milti hai. Tarpaulin covering aur weighbridge slip dispatch se pehle confirm karein, aur bulk paddy ke liye insurance option poochha lein."
      }
    ],
    "locationSlug": "balasore"
  },
  "berhampur": {
    "cityName": "Berhampur",
    "title": "Part Load Transport in Berhampur - PTL & FTL Truck Booking | LoadSaathi",
    "metaDescription": "Part load transport in Berhampur picks up from Bada Bazar, Aska Road, Palur Road and Engineering School Chowk, with lanes running to Bhubaneswar, Cuttack, Visak",
    "keywords": [
      "part load transport berhampur",
      "PTL booking berhampur",
      "truck booking berhampur",
      "freight service berhampur"
    ],
    "summary": "Rice, cashew, silk and seafood freight from Bada Bazar, Aska Road, Palur Road and Engineering School Chowk to Bhubaneswar, Cuttack, Vizag and Rourkela.",
    "faq": [
      {
        "question": "Berhampur se Bhubaneswar part load booking kaise karein?",
        "answer": "Berhampur se Bhubaneswar ke liye PTL booking mein pickup area (Bada Bazar, Aska Road ya Palur Road), weight aur goods type daalein — shared truck options turant dikh jaate hain. Ye lane takriban 180 km hai, aur part load me sirf apne occupied weight ke liye pay karte hain. Rice cartons, cashew aur chhote textile lots ke liye daily departures milti hain. Poora 16MT load ho ya fixed date ho, to FTL option choose karein aur truck type cargo ke hisaab se confirm karein."
      },
      {
        "question": "Berhampur mein pickup kahan se hoga?",
        "answer": "Bada Bazar, Aska Road, Palur Road aur Engineering School Chowk se pickups ho sakte hain. Town ke mill godowns, cashew processing units aur Aska Road ke warehouses se bhi loaders available hain. Pickup address aur loading time batate hi trucker vehicle number, driver contact aur live location share karta hai, aur aap delivery tak tracking app se dekh sakte hain."
      },
      {
        "question": "Rice aur cashew consignment ke liye kaunsa truck type sahi hai?",
        "answer": "Rice aur paddy bags ke liye covered container ya tarpaulin-covered open truck chahiye taaki moisture se maal bacha rahe, aur bags ko stacked aur lashed rakhna chahiye. Cashew aur processed food cartons ke liye dry, clean container best hai — dust aur odour se bachaav zaroori hai. Jute products ke liye breathable covered truck suitable rehta hai. Booking mein carton count, weight aur packaging type daalein taaki sahi vehicle allot ho."
      },
      {
        "question": "Cashew ya rice ki booking par GST details aur GPS tracking milti hai?",
        "answer": "Booking mein aap jo cargo description, weight aur invoice inputs daalte hain wahi GST e-way bill banane ke liye chahiye, isliye carton count aur net weight sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse Berhampur se Bhubaneswar ya Vizag ka movement aap live dekh sakte hain aur delivery confirmation mil jaati hai. Tarpaulin covering aur weighbridge slip dispatch se pehle trucker se confirm karein, aur food-grade loads ke liye clean-vehicle requirement booking mein mention kar dein."
      }
    ],
    "locationSlug": "berhampur"
  },
  "kolkata": {
    "cityName": "Kolkata",
    "title": "Part Load Transport in Kolkata - PTL & FTL Truck Booking | LoadSaathi",
    "metaDescription": "Part load transport in Kolkata serves Burrabazar, Salt Lake, New Town, Taratala, Baguiati, Howrah and the Dankuni truck terminal, with freight moving to Rourkel",
    "keywords": [
      "part load transport kolkata",
      "PTL booking kolkata",
      "truck booking kolkata",
      "freight service kolkata"
    ],
    "summary": "Part load and full truck booking across Burrabazar, Salt Lake, New Town, Taratala, Baguiati, Howrah and the Dankuni truck terminal, serving jute, steel, electronics and FMCG.",
    "faq": [
      {
        "question": "Kolkata se Rourkela truck booking kaise karein?",
        "answer": "Kolkata se Rourkela ke liye booking mein pickup area (Howrah, Taratala, Salt Lake ya Dankuni), destination aur weight daalein — options compare karke confirm kar dein. Ye lane takriban 530 km ka hai aur truck type ke hisaab se transit time 12–14 hours rehta hai. Chhote consignments ke liye PTL shared truck better hai, poora container ya 16MT load ho to FTL choose karein. Har option par rate range, truck type aur trucker rating book karne se pehle dikh jaati hai."
      },
      {
        "question": "Kolkata mein pickup kis area se ho sakta hai?",
        "answer": "Burrabazar, Salt Lake, New Town, Taratala, Baguiati, Howrah aur Dankuni truck terminal se pickups regular hote hain. Shyambazar aur Tangra ke godowns, Salt Lake Sector V ke warehouses aur Howrah ke industrial sheds se bhi loaders available hain. Pickup address aur loading time ke saath dock leveler ya forklift availability bata dein — trucker confirm karte waqt vehicle details aur live location share karta hai."
      },
      {
        "question": "Part load aur container ke liye kaunsa truck type chahiye?",
        "answer": "Part load ke liye shared container ya covered truck best hai — aap sirf occupied space ke liye pay karte hain aur maal dust aur moisture se bacha rehta hai. Electronics, leather goods aur retail cartons ke liye 20ft ya 32ft closed container choose karein. Steel trading consignments ke liye high-bed ya flatbed trailer chahiye, aur jute products ke liye breathable covered truck suitable hai. Booking mein dimensions, weight aur fragility note daalein taaki sahi vehicle allot ho."
      },
      {
        "question": "Container ya e-way load par GST details aur GPS tracking milti hai?",
        "answer": "Booking par aap jo cargo description, weight aur invoice details daalte hain wahi GST e-way bill ke inputs hain, isliye container number, seal detail aur net weight sahi rakhein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse aap Kolkata se Rourkela, Ranchi ya Bhubaneswar tak movement live dekh sakte hain. Loading ke baad dock photos le lein aur weighbridge slip confirm karein — high-value electronics aur steel ke liye insurance option poochha lein."
      }
    ],
    "locationSlug": "kolkata"
  },
  "durgapur": {
    "cityName": "Durgapur",
    "title": "Part Load Transport in Durgapur - PTL & FTL Truck Booking | LoadSaathi",
    "metaDescription": "Part load transport in Durgapur runs from Benachity, City Centre, Steel Township and Andal toward Kolkata, Asansol, Burdwan and Dhanbad. PTL booking in Durgapur",
    "keywords": [
      "part load transport durgapur",
      "PTL booking durgapur",
      "truck booking durgapur",
      "freight service durgapur"
    ],
    "summary": "Steel, power plant spares and engineering freight from Benachity, City Centre, Steel Township and Andal to Kolkata, Asansol, Burdwan and Dhanbad.",
    "faq": [
      {
        "question": "Durgapur se Kolkata tempo booking kaise karein?",
        "answer": "Durgapur se Kolkata ke liye booking mein pickup area (Benachity, City Centre ya Steel Township), weight aur goods type daalein — chhote loads ke liye tempo aur shared truck options, bade loads ke liye 16MT aur container options dikh jaate hain. Ye lane takriban 160 km ka hai, aur transit time truck type ke hisaab se 4–6 hours rehta hai. PTL booking me sirf apne weight ke liye pay karte hain; poora load ho to FTL choose karein. Rate range, truck type aur trucker rating confirm karne se pehle app par mil jaate hain."
      },
      {
        "question": "Durgapur mein pickup kis area se hoga?",
        "answer": "Benachity, City Centre, Steel Township aur Andal se regular pickups ho sakte hain. GT Road ke industrial units, Andal ke godowns aur Durgapur Steel Township ke gate areas se bhi loading hoti hai. Pickup address aur loading time ke saath crane ya forklift availability bata dein — trucker confirm karte waqt vehicle number, driver contact aur live location share karta hai."
      },
      {
        "question": "Durgapur se kaunse destinations tak part load ja sakta hai?",
        "answer": "Durgapur se shared PTL load Kolkata, Asansol, Burdwan aur Dhanbad tak regularly nikalte hain — ye sab 50 se 160 km ke range mein hain, isliye chhote consignments ke liye bhi daily options milte hain. Ranchi, Jamshedpur aur Bhubaneswar ke lanes bhi connect hote hain, aur aap app par origin Durgapur daal kar available corridors dekh sakte hain. Jis destination ka direct corridor na ho, wo bhi request kar sakte hain — matching engine us route par trucker dhoondhta hai."
      },
      {
        "question": "Steel ya plant spares ki booking par GST details aur GPS tracking milti hai?",
        "answer": "Booking mein aap jo cargo description, weight aur invoice inputs daalte hain wahi GST e-way bill banane ke liye chahiye, isliye billets, rods ya spares ka net weight aur item count sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse aap Durgapur se Kolkata, Asansol ya Dhanbad tak movement live dekh sakte hain. Lashing aur covering dispatch se pehle confirm karein, aur plant spares ya high-value components ke liye insurance option poochha lein."
      }
    ],
    "locationSlug": null
  },
  "burdwan": {
    "cityName": "Burdwan",
    "title": "Part Load Transport in Burdwan - PTL & FTL Truck Booking | LoadSaathi",
    "metaDescription": "Part load transport in Burdwan picks up from G.T. Road, Curzon Gate, Bhatar and Belkuni, with freight moving to Kolkata, Dhanbad, Ranchi and Rourkela. PTL booki",
    "keywords": [
      "part load transport burdwan",
      "PTL booking burdwan",
      "truck booking burdwan",
      "freight service burdwan"
    ],
    "summary": "Rice, wheat, processed steel and coal freight from G.T. Road, Curzon Gate, Bhatar and Belkuni to Kolkata, Dhanbad, Ranchi and Rourkela.",
    "faq": [
      {
        "question": "Burdwan se Kolkata full truck kaise book karein?",
        "answer": "Burdwan se Kolkata ke liye FTL booking mein pickup area (G.T. Road, Curzon Gate, Bhatar ya Belkuni), weight aur preferred date daalein — verified trucker ke options compare karke confirm kar dein. Ye lane takriban 110 km ka hai aur truck type ke hisaab se transit time 2.5–4 hours rehta hai. Chhota load hai to PTL shared truck choose karein, jisme sirf apne weight ke liye pay karte hain. Rate range, truck type aur trucker rating dono options par book karne se pehle app par mil jaate hain."
      },
      {
        "question": "Burdwan mein pickup kahan se hota hai?",
        "answer": "G.T. Road, Curzon Gate, Bhatar aur Belkuni se regular pickups ho sakte hain. Burdwan town ke mill godowns, rice market ke warehouses aur GT Road ke industrial sheds se bhi loaders available hain. Pickup address aur loading time batate hi trucker vehicle details aur live location share karta hai, aur aap app se delivery tak movement follow kar sakte hain."
      },
      {
        "question": "Rice, paddy aur steel ke liye kaunsa truck type chahiye?",
        "answer": "Rice aur paddy bags ke liye covered container ya tarpaulin-covered open truck chahiye taaki baarish aur moisture se maal bacha rahe; bags ko stacked aur lashed rakhna chahiye. Processed steel aur engineering components ke liye high-bed ya flatbed trailer suitable hai, jahan coils aur rods ko lashing se secure kiya jaata hai. Coal ke liye tipper ya high-capacity open truck use hota hai. Booking mein bag count, weight aur packaging type daalein taaki sahi vehicle allot ho."
      },
      {
        "question": "Rice ya steel ki booking par GST details aur GPS tracking milti hai?",
        "answer": "Har booking par aap cargo description, weight aur invoice details daalte hain — yehi GST e-way bill banane ke inputs hain, isliye rice ka bag count aur steel ka net weight sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse Burdwan se Kolkata, Dhanbad ya Ranchi ka movement live dikhta hai. Tarpaulin covering aur weighbridge slip dispatch se pehle confirm karein, aur bulk grain ya steel ke liye insurance option poochha lein."
      }
    ],
    "locationSlug": "burdwan"
  }
};

function getSeoMeta(path) {
  const n = normalizePath(path);

  // /routes/[slug]
  const routeMatch = n.match(/^\/routes\/(.+)$/);
  if (routeMatch && ROUTE_DATA[routeMatch[1]]) {
    return { ...ROUTE_DATA[routeMatch[1]], type: 'route', slug: routeMatch[1] };
  }

  // /blog/[slug]
  const blogMatch = n.match(/^\/blog\/(.+)$/);
  if (blogMatch && BLOG_DATA[blogMatch[1]]) {
    const entry = BLOG_DATA[blogMatch[1]];
    return {
      seoTitle: entry.title,
      metaDescription: entry.metaDescription,
      keywords: entry.keywords,
      summary: entry.summary,
      author: entry.author,
      date: entry.date,
      lastUpdated: entry.lastUpdated || null,
      readTime: entry.readTime,
      faq: entry.faq || null,
      category: entry.category || null,
      authorBio: entry.authorBio || null,
      type: 'blog',
      slug: blogMatch[1],
    };
  }

  // /guide/[slug]
  const guideMatch = n.match(/^\/guide\/(.+)$/);
  if (guideMatch && GUIDE_DATA[guideMatch[1]]) {
    const entry = GUIDE_DATA[guideMatch[1]];
    return {
      seoTitle: entry.title,
      metaDescription: entry.metaDescription,
      keywords: entry.keywords,
      summary: entry.summary,
      author: entry.author,
      readTime: entry.readTime,
      date: entry.date || null,
      lastUpdated: entry.lastUpdated || null,
      authorBio: entry.authorBio || null,
      faq: entry.faq || null,
      rateTable: entry.rateTable || null,
      steps: entry.steps || null,
      type: 'guide',
      slug: guideMatch[1],
    };
  }

  // /location/[city] — only known cities; anything else is a 404 (the React
  // LocationPage only has data for these cities and renders "City Not Found").
  const locationMatch = n.match(/^\/location\/(.+)$/);
  if (locationMatch) {
    const slug = locationMatch[1].split('/')[0].toLowerCase();
    if (!KNOWN_LOCATIONS.has(slug)) return null;
    const parts = locationMatch[1].split('/');
    const city = parts[parts.length - 1] || parts[0];
    const state = parts.length > 1 ? parts.slice(0, -1).join('-') : '';
    const cityTitle = city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const stateTitle = state.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
      seoTitle: state ? `${cityTitle}, ${stateTitle} Freight | LoadSaathi` : `${cityTitle} Freight | LoadSaathi`,
      metaDescription: `Find trucks and freight services in ${cityTitle}${stateTitle ? ', ' + stateTitle : ''} on LoadSaathi. Compare rates, book PTL/FTL shipments, and track deliveries in real-time.`,
      keywords: [`freight ${cityTitle}`, `trucking ${cityTitle}`, `${cityTitle} logistics`, `PTL ${cityTitle}`, `FTL ${cityTitle}`],
      summary: `Freight services and trucking in ${cityTitle}.`,
      author: 'LoadSaathi Team',
      type: 'location',
      slug: locationMatch[1],
    };
  }

  // /transport-service/[city]
  const tsMatch = n.match(/^\/transport-service\/(.+)$/);
  if (tsMatch && TRANSPORT_SERVICE_DATA[tsMatch[1]]) {
    const entry = TRANSPORT_SERVICE_DATA[tsMatch[1]];
    return {
      seoTitle: entry.title,
      metaDescription: entry.metaDescription,
      keywords: entry.keywords,
      summary: entry.summary,
      faq: entry.faq || null,
      type: 'transport-service',
      slug: tsMatch[1],
      cityName: entry.cityName,
    };
  }

  // Static pages: /about, /contact, /privacy, /terms, /faq, /how-it-works, /features, /pricing, /safety-trust, /gallery, /blog (index), /routes (index — route pages use /routes/[slug] above)
  if (STATIC_PAGE_DATA[n]) {
    const entry = STATIC_PAGE_DATA[n];
    return {
      seoTitle: entry.title,
      metaDescription: entry.metaDescription,
      keywords: entry.keywords,
      summary: entry.summary,
      noindex: entry.noindex || false,
      type: 'static',
      slug: n,
    };
  }

  return null;
}

function buildJsonLd(path, seoMeta) {
  const baseUrl = 'https://loadsaathi.in';
  const canonicalUrl = `${baseUrl}${path}`;
  const graph = [];

  // 1. BreadcrumbList (all page types)
  const breadcrumbs = [{ "@type": "ListItem", "position": 1, "name": "Home", "item": `${baseUrl}/` }];
  if (seoMeta.type === 'route') {
    breadcrumbs.push({ "@type": "ListItem", "position": 2, "name": "Freight Routes", "item": `${baseUrl}/routes` });
    breadcrumbs.push({ "@type": "ListItem", "position": 3, "name": seoMeta.seoTitle, "item": canonicalUrl });
  } else if (seoMeta.type === 'blog') {
    breadcrumbs.push({ "@type": "ListItem", "position": 2, "name": "Blog", "item": `${baseUrl}/blog` });
    breadcrumbs.push({ "@type": "ListItem", "position": 3, "name": seoMeta.seoTitle, "item": canonicalUrl });
  } else if (seoMeta.type === 'guide') {
    breadcrumbs.push({ "@type": "ListItem", "position": 2, "name": "Guides", "item": `${baseUrl}/blog` });
    breadcrumbs.push({ "@type": "ListItem", "position": 3, "name": seoMeta.seoTitle, "item": canonicalUrl });
  } else if (seoMeta.type === 'location') {
    breadcrumbs.push({ "@type": "ListItem", "position": 2, "name": "Locations", "item": `${baseUrl}` });
    breadcrumbs.push({ "@type": "ListItem", "position": 3, "name": seoMeta.seoTitle, "item": canonicalUrl });
  } else if (seoMeta.type === 'transport-service') {
    breadcrumbs.push({ "@type": "ListItem", "position": 2, "name": "Freight Routes", "item": `${baseUrl}/routes` });
    breadcrumbs.push({ "@type": "ListItem", "position": 3, "name": `Transport Service ${seoMeta.cityName}`, "item": canonicalUrl });
  } else {
    // static pages
    const pageName = seoMeta.seoTitle.split(' - ')[0] || seoMeta.seoTitle;
    breadcrumbs.push({ "@type": "ListItem", "position": 2, "name": pageName, "item": canonicalUrl });
  }
  graph.push({ "@type": "BreadcrumbList", "itemListElement": breadcrumbs });

  // 2. Page-type-specific schema
  if (seoMeta.type === 'route' && seoMeta.distanceKm) {
    // Route page: Service + Offer + QAPage
    const price = Math.round(seoMeta.distanceKm * 100);
    const p1 = Math.round(seoMeta.distanceKm * 85);
    const p2 = Math.round(seoMeta.distanceKm * 120);
    const pkgLow = Math.round(seoMeta.distanceKm * 0.08);
    const pkgHigh = Math.round(seoMeta.distanceKm * 0.12);
    const transNum = Number(seoMeta.transitTime) || 0;
    const p1h = Math.round(transNum * 1.3);
    const p2h = Math.round(transNum * 1.5);
    graph.push({
      "@type": "Service",
      "name": seoMeta.seoTitle,
      "description": seoMeta.metaDescription,
      "url": canonicalUrl,
      "provider": { "@type": "Organization", "name": "LoadSaathi", "url": baseUrl, "logo": `${baseUrl}/logo.png` },
      "areaServed": [
        { "@type": "City", "name": seoMeta.from, "containedInPlace": { "@type": "State", "name": seoMeta.fromState } },
        { "@type": "City", "name": seoMeta.to, "containedInPlace": { "@type": "State", "name": seoMeta.toState } }
      ],
      "serviceType": "PTL/LTL Freight Shipping",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": price,
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": price,
          "priceCurrency": "INR",
          "description": `Estimated freight cost for ${seoMeta.distanceKm}km route`
        },
        "availability": "https://schema.org/InStock"
      }
    });
    graph.push({
      "@type": "QAPage",
      "name": `Frequently Asked Questions — ${seoMeta.from} to ${seoMeta.to} Freight`,
      "mainEntity": [
        { "@type": "Question", "name": `What is the freight cost from ${seoMeta.from} to ${seoMeta.to}?`, "acceptedAnswer": { "@type": "Answer", "text": `FTL truck rates from ${seoMeta.from} to ${seoMeta.to} (${seoMeta.distanceKm} km) range from ₹${p1.toLocaleString()} to ₹${p2.toLocaleString()} depending on truck type. PTL rates are ₹${pkgLow}–${pkgHigh} per kg. Use LoadSaathi's freight rate calculator for a precise quote.` } },
        { "@type": "Question", "name": `How long does delivery take from ${seoMeta.from} to ${seoMeta.to}?`, "acceptedAnswer": { "@type": "Answer", "text": `Delivery takes approximately ${seoMeta.transitTime} hours for direct FTL. PTL shipments may take ${p1h}–${p2h} hours due to consolidation stops. GPS tracking provides real-time ETAs.` } },
        { "@type": "Question", "name": `What truck types operate on the ${seoMeta.from}–${seoMeta.to} route?`, "acceptedAnswer": { "@type": "Answer", "text": `Available trucks: Open (9MT, 16MT), Container (20ft, 32ft), Flatbed trailer (20MT, 25MT), Tankers. LoadSaathi's AI matcher recommends the optimal truck for your shipment.` } },
        { "@type": "Question", "name": `Is PTL shipping available on the ${seoMeta.from}–${seoMeta.to} route?`, "acceptedAnswer": { "@type": "Answer", "text": `Yes. LoadSaathi specializes in PTL/LTL freight on this corridor. PTL lets you share truck space, saving up to 40% vs full truck. Ideal for shipments under 3 tonnes.` } }
      ]
    });
  } else if (seoMeta.type === 'blog' || seoMeta.type === 'guide') {
    // Blog / Guide page: Article schema
    const schemaTitle = (seoMeta.schemaTitle || seoMeta.seoTitle || '').replace(/\s*\|\s*LoadSaathi\s*$/, '');
    const schemaDesc = seoMeta.summary ? seoMeta.summary.substring(0, 160) : seoMeta.metaDescription;
    const article = {
      "@type": "Article",
      "headline": schemaTitle,
      "description": schemaDesc,
      "url": canonicalUrl,
      "author": { "@type": "Person", "name": seoMeta.author || "LoadSaathi Team", ...(seoMeta.authorBio ? { "description": seoMeta.authorBio } : {}) },
      "publisher": { "@type": "Organization", "name": "LoadSaathi", "url": baseUrl, "logo": { "@type": "ImageObject", "url": `${baseUrl}/logo-512.png` } },
      "datePublished": seoMeta.date || new Date().toISOString().slice(0, 10),
      "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
    };
    if (seoMeta.lastUpdated) {
      article.dateModified = seoMeta.lastUpdated;
    } else if (seoMeta.date) {
      article.dateModified = seoMeta.date;
    }
    if (seoMeta.category) {
      article.articleSection = seoMeta.category;
    }
    const minutes = parseInt(seoMeta.readTime, 10);
    if (Number.isFinite(minutes) && minutes > 0) {
      article.wordCount = minutes * 200;
    }
    graph.push(article);

    // HowTo schema for guide pages (mirrors the React GuidePage JSON-LD)
    if (seoMeta.type === 'guide' && Array.isArray(seoMeta.steps) && seoMeta.steps.length > 0) {
      graph.push({
        "@type": "HowTo",
        "name": schemaTitle,
        "description": schemaDesc,
        "datePublished": seoMeta.date || "2026-06-01",
        "dateModified": seoMeta.lastUpdated || seoMeta.date || "2026-08-08",
        "image": "https://loadsaathi.in/og-image.png",
        "author": { "@type": "Person", "name": seoMeta.author || "LoadSaathi Team", ...(seoMeta.authorBio ? { "description": seoMeta.authorBio } : {}) },
        "publisher": { "@type": "Organization", "name": "LoadSaathi", "url": baseUrl, "logo": { "@type": "ImageObject", "url": `${baseUrl}/logo-512.png` } },
        "totalTime": seoMeta.readTime,
        "step": seoMeta.steps.map((s, i) => ({
          "@type": "HowToStep",
          "position": i + 1,
          "name": s.name,
          "text": s.text
        }))
      });
    }

    // FAQPage if entry has faq[]
    if (seoMeta.faq && Array.isArray(seoMeta.faq) && seoMeta.faq.length > 0) {
      graph.push({
        "@type": "FAQPage",
        "mainEntity": seoMeta.faq.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": { "@type": "Answer", "text": f.answer }
        }))
      });
    }

    // Guide rate table as structured data (JSON-LD is the bot-facing surface;
    // schema.org has no Table type, so a generic Table node is used)
    if (seoMeta.type === 'guide' && seoMeta.rateTable) {
      const rt = seoMeta.rateTable;
      graph.push({
        "@type": "Table",
        "name": rt.caption,
        "url": canonicalUrl,
        "description": rt.footnote || seoMeta.metaDescription,
        "keywords": rt.headers.join(', '),
        "headers": rt.headers,
        "rows": rt.rows,
        "isPartOf": { "@type": "WebPage", "@id": canonicalUrl },
        "about": { "@type": "WebPage", "@id": canonicalUrl }
      });
    }
  } else if (seoMeta.type === 'static') {
    // Static pages: Organization + WebPage
    graph.push({
      "@type": "WebPage",
      "name": seoMeta.seoTitle,
      "description": seoMeta.metaDescription,
      "url": canonicalUrl,
      "inLanguage": "en-IN"
    });
    // Organization on /about
    if (seoMeta.slug === '/about') {
      graph.push({
        "@type": "Organization",
        "name": "LoadSaathi",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`,
        "description": "India's AI-powered shared freight marketplace connecting shippers and truckers for PTL and LTL loads.",
        "sameAs": [
          "https://www.linkedin.com/company/loadsaathi",
          "https://twitter.com/loadsaathi"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-83289-98031",
          "contactType": "customer service",
          "email": "support@loadsaathi.in"
        }
      });
    }
    // LocalBusiness on /contact
    if (seoMeta.slug === '/contact') {
      graph.push({
        "@type": "LocalBusiness",
        "name": "LoadSaathi",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`,
        "telephone": "+91-83289-98031",
        "email": "support@loadsaathi.in",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Foundation for Technology and Business Incubation (FTBI), First Floor, T1-109",
          "addressLocality": "Rourkela",
          "addressRegion": "Odisha",
          "postalCode": "769008",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 22.2604,
          "longitude": 84.8536
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "09:00",
          "closes": "18:00"
        }
      });
    }
  } else if (seoMeta.type === 'location') {
    // Location page: WebPage + Service
    graph.push({
      "@type": "WebPage",
      "name": seoMeta.seoTitle,
      "description": seoMeta.metaDescription,
      "url": canonicalUrl,
      "inLanguage": "en-IN"
    });
  } else if (seoMeta.type === 'transport-service') {
    // Transport service city page: WebPage + FAQPage
    graph.push({
      "@type": "WebPage",
      "name": seoMeta.seoTitle,
      "description": seoMeta.metaDescription,
      "url": canonicalUrl,
      "inLanguage": "en-IN"
    });
    if (seoMeta.faq && Array.isArray(seoMeta.faq) && seoMeta.faq.length > 0) {
      graph.push({
        "@type": "FAQPage",
        "mainEntity": seoMeta.faq.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": { "@type": "Answer", "text": f.answer }
        }))
      });
    }
  }

  const schema = { "@context": "https://schema.org", "@graph": graph };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

export default async function handler(req) {
  const url = new URL(req.url, 'https://loadsaathi.in');
  const rawPath = url.pathname;
  const path = normalizePath(rawPath);
  const accept = (req.headers.get('accept') || '').toLowerCase();

  // ── Canonical redirects (before content negotiation) ──────────────────
  // www → apex: Vercel serves both hostnames with 200 by default.
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0];
  if (host === 'www.loadsaathi.in') {
    return redirectResponse(`https://loadsaathi.in${rawPath}${url.search}`);
  }
  // Trailing slash → no slash (canonical has no trailing slash, except root).
  if (rawPath.length > 1 && rawPath.endsWith('/')) {
    return redirectResponse(`https://loadsaathi.in${normalizePath(rawPath)}${url.search}`);
  }
  // Duplicate pairs → canonical target.
  if (REDIRECTS[path]) {
    return redirectResponse(`https://loadsaathi.in${REDIRECTS[path]}${url.search}`);
  }
  // /transport/:city is a pure alias of /location/:city (same component, and
  // the React canonical already points at /location/*).
  if (path === '/transport' || path.startsWith('/transport/')) {
    const rest = path === '/transport' ? '' : path.slice('/transport'.length);
    return redirectResponse(`https://loadsaathi.in/location${rest}${url.search}`);
  }

  const wantsMarkdown = accept.includes('text/markdown') || accept.includes('text/x-markdown');

  // Content negotiation: Accept: text/markdown
  if (wantsMarkdown) {
    // Known route: try to serve dedicated markdown, else generic index.md
    if (isKnownRoute(path)) {
      const mdPath = markdownForPath(path);
      if (mdPath) {
        try {
          const mdRes = await fetch(new URL(mdPath, url.origin));
          if (mdRes.ok) {
            const body = await mdRes.text();
            return new Response(body, {
              status: 200,
              headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Vary': 'Accept, Accept-Encoding',
                'Cache-Control': 'public, max-age=3600',
              },
            });
          }
        } catch {
          // fall through
        }
      }
      // Known route but no dedicated markdown -> serve index.md as fallback with 200
      // This ensures agents still get useful markdown for any valid page
      try {
        const mdRes = await fetch(new URL('/index.md', url.origin));
        if (mdRes.ok) {
          const body = await mdRes.text();
          return new Response(body, {
            status: 200,
            headers: {
              'Content-Type': 'text/markdown; charset=utf-8',
              'Vary': 'Accept, Accept-Encoding',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      } catch {
        // fall through to generic
      }
    }
    // Unknown path or failed fetch -> 404 markdown with helpful body
    const notFoundMd = `# 404 - Page Not Found

The page \`${rawPath}\` does not exist on LoadSaathi.

## LoadSaathi

LoadSaathi is India's AI-powered shared freight marketplace connecting shippers and truckers for PTL (Partial Truckload) and LTL (Less Than Truckload) loads across East India. The platform uses AI matching, real-time GPS tracking, digital credit scores, and escrow-backed payments to eliminate empty return trips and reduce freight costs by up to 40%.

## Available Pages

- [Home](https://loadsaathi.in/) - Platform overview and getting started
- [About](https://loadsaathi.in/about) - Company story and team
- [Contact](https://loadsaathi.in/contact) - Get in touch with LoadSaathi
- [Features](https://loadsaathi.in/features) - Platform capabilities
- [How It Works](https://loadsaathi.in/how-it-works) - Step-by-step guide
- [Pricing](https://loadsaathi.in/pricing) - Plans and transaction fees
- [FAQ](https://loadsaathi.in/faq) - Frequently asked questions
- [Blog](https://loadsaathi.in/blog) - Articles and guides
- [All Freight Routes](https://loadsaathi.in/routes) - 30+ freight corridors
- [Privacy Policy](https://loadsaathi.in/privacy) - Data handling and privacy
- [Terms of Service](https://loadsaathi.in/terms) - Platform terms

## Machine-Readable Resources

- [llms.txt](https://loadsaathi.in/llms.txt) - Site summary for AI agents
- [sitemap.xml](https://loadsaathi.in/sitemap.xml) - XML sitemap with all pages
- [robots.txt](https://loadsaathi.in/robots.txt) - Crawler directives

## Contact

- Website: https://loadsaathi.in
- Email: support@loadsaathi.in
`;
    return new Response(notFoundMd, {
      status: 404,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept, Accept-Encoding',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  // HTML handling
  if (isKnownRoute(path)) {
    try {
      let htmlPath = '/index.html';
      if (DEDICATED_HTML.has(path)) {
        const candidate = `/${path.slice(1)}.html`;
        try {
          const probe = await fetch(new URL(candidate, url.origin));
          if (probe.ok) {
            htmlPath = candidate;
          }
        } catch {
          // keep index.html
        }
      }
      const htmlRes = await fetch(new URL(htmlPath, url.origin));
      if (!htmlRes.ok) throw new Error('html fetch failed');
      let html = await htmlRes.text();
      const seoMeta = getSeoMeta(path);
      // Dynamic public URL with an unknown slug (bad blog/route/city/guide):
      // serve a genuine 404 instead of a 200 "not found" screen.
      if (!seoMeta && SLUG_VALIDATED_PREFIXES.some((p) => path.startsWith(p))) {
        const notFoundRes = await fetch(new URL('/404.html', url.origin));
        if (notFoundRes.ok) {
          return new Response(notFoundRes.body, {
            status: 404,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Vary': 'Accept, Accept-Encoding',
              'Cache-Control': 'public, max-age=300',
            },
          });
        }
      }
      if (seoMeta) {
        const canonical = `https://loadsaathi.in${path}`;
        // The shell may be the raw index.html OR a prerendered dump whose tags
        // carry data-ls-seo attributes — regex swaps silently miss those. So
        // strip every SEO tag first, then inject one authoritative block.
        html = html
          .replace(/<title[^>]*>.*?<\/title>/, "")
          .replace(/<link rel="canonical"[^>]*>/g, "")
          .replace(/<link rel="alternate"[^>]*hreflang[^>]*>/g, "")
          .replace(/<meta\s+name="description"[^>]*>/g, "")
          .replace(/<meta\s+name="keywords"[^>]*>/g, "")
          .replace(/<meta\s+name="robots"[^>]*>/g, "")
          .replace(/<meta\s+property="og:[^"]*"[^>]*>/g, "")
          .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/g, "")
          .replace(/<meta\s+property="article:[^"]*"[^>]*>/g, "")
          .replace(/<meta\s+name="author"[^>]*>/g, "")
          .replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, "");
        const keywords = Array.isArray(seoMeta.keywords)
          ? seoMeta.keywords.join(", ")
          : seoMeta.keywords;
        const image = "https://loadsaathi.in/og-image.png";
        const head =
          `<title>${seoMeta.seoTitle}</title>\n` +
          `  <meta name="description" content="${seoMeta.metaDescription}" />\n` +
          (keywords ? `  <meta name="keywords" content="${keywords}" />\n` : "") +
          `  <meta name="robots" content="${seoMeta.noindex ? "noindex, follow" : "index, follow"}" />\n` +
          `  <link rel="canonical" href="${canonical}" />\n` +
          `  <link rel="alternate" hreflang="en-in" href="${canonical}" />\n` +
          `  <link rel="alternate" hreflang="x-default" href="${canonical}" />\n` +
          `  <meta property="og:type" content="website" />\n` +
          `  <meta property="og:url" content="${canonical}" />\n` +
          `  <meta property="og:title" content="${seoMeta.seoTitle}" />\n` +
          `  <meta property="og:description" content="${seoMeta.metaDescription}" />\n` +
          `  <meta property="og:image" content="${image}" />\n` +
          `  <meta property="og:image:width" content="1200" />\n` +
          `  <meta property="og:image:height" content="630" />\n` +
          `  <meta property="og:site_name" content="LoadSaathi" />\n` +
          `  <meta property="og:locale" content="en_IN" />\n` +
          `  <meta name="twitter:card" content="summary_large_image" />\n` +
          `  <meta name="twitter:title" content="${seoMeta.seoTitle}" />\n` +
          `  <meta name="twitter:description" content="${seoMeta.metaDescription}" />\n` +
          `  <meta name="twitter:image" content="${image}" />\n` +
          (seoMeta.author ? `  <meta name="author" content="${seoMeta.author}" />\n` : "");
        html = html.replace("</head>", `  ${head}  ${buildJsonLd(path, seoMeta)}\n  </head>`);
      } else {
        // Known route with no SEO entry (app/auth/share/admin paths): keep it out of the index.
        html = html
          .replace(/<meta\s+name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow" />')
          .replace(/<link rel="canonical"[^>]*>/, "")
          .replace(/<meta\s+property="og:url"[^>]*>/, "");
        if (!/<meta\s+name="robots"/.test(html)) {
          html = html.replace("</head>", '  <meta name="robots" content="noindex, follow" />\n  </head>');
        }
      }
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Vary': 'Accept, Accept-Encoding',
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      });
    } catch {
      return new Response('Service temporarily unavailable', {
        status: 503,
        headers: { 'Vary': 'Accept, Accept-Encoding' },
      });
    }
  }

  // Unknown path -> 404.html with proper status
  try {
    const notFoundRes = await fetch(new URL('/404.html', url.origin));
    if (notFoundRes.ok) {
      return new Response(notFoundRes.body, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Vary': 'Accept, Accept-Encoding',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
  } catch {
    // fall through
  }
  return new Response('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>404 - Not Found</title><meta name="robots" content="noindex"></head><body><h1>404 - Page Not Found</h1><p>The page does not exist.</p><ul><li><a href="/">Home</a></li><li><a href="/sitemap.xml">sitemap.xml</a></li><li><a href="/llms.txt">llms.txt</a></li></ul></body></html>', {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Vary': 'Accept, Accept-Encoding',
    },
  });
}
