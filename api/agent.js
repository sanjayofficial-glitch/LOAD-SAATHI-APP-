// Site-level facts live in api/site.js so the edge handler and the React app
// (supabase/src/config/site.ts) quote the same numbers, fees and contact data.
import {
  SITE_URL,
  BRAND,
  PHONE_DISPLAY,
  PHONE_E164,
  EMAIL,
  ADDRESS,
  SOCIALS,
  OG_IMAGE,
  COVERAGE,
  FEES,
  clampMetaDescription,
} from './site.js';

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
  '/sitemap',
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
  '/sitemap',
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
    metaDescription: "Book PTL/LTL freight from Bhubaneswar to Kolkata. Odisha–West Bengal shipping with AI-matched trucks, live GPS tracking and competitive pricing.",
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
    metaDescription: "Book PTL/LTL freight from Bhubaneswar to Visakhapatnam. Coastal corridor shipping with AI matching, GPS tracking and transparent Odisha–AP rates.",
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
    metaDescription: "Book cost-effective PTL freight from Jamshedpur to Rourkela, with AI-matched trucks, real-time tracking and fair pricing on the route.",
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
    metaDescription: "Book PTL/LTL freight from Ranchi to Dhanbad. Intra-Jharkhand shipping with AI matching, live GPS tracking and competitive rates.",
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
    metaDescription: "Book PTL/LTL freight from Rourkela to Bhubaneswar. Save up to 40% within Odisha with AI truck matching, GPS tracking and credit scores.",
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
    metaDescription: "Book PTL freight from Rourkela to Burdwan. Odisha–West Bengal trucking with AI matching, live GPS tracking and fair rates.",
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
    metaDescription: "Book PTL/LTL freight from Rourkela to Ranchi. Save up to 40% on a shared truck network with GPS tracking, AI matching and transparent pricing.",
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
    metaDescription: "LoadSaathi connects shippers and truckers for PTL and LTL shared freight across East India. Save up to 40% on the Rourkela–Ranchi–Burdwan corridor.",
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
  "/sitemap": {
    title: "Sitemap - All Pages & Freight Routes | LoadSaathi",
    metaDescription: "Complete HTML sitemap of LoadSaathi: freight routes, city pages, calculators, guides and blog articles for PTL and LTL shipping across East India.",
    keywords: ["loadsaathi sitemap", "site index", "freight pages list", "loadsaathi url list"],
    summary: "Every public LoadSaathi page in one place: routes, cities, transport services, calculators, guides and blog articles."
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
    metaDescription: "Find trucks near you on LoadSaathi. Compare market rates and trucker credit scores, then book without calling brokers. Live in Odisha, Jharkhand and Bengal.",
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
    "title": "Truck Transport Cost per KM in India: What Affects Your Freight Rate? | LoadSaathi",
    "keywords": [
      "truck transport cost per km in india",
      "truck transport charges per km india",
      "freight rates"
    ],
    "summary": "Truck transport cost per km in India (2026): mini ₹10–25, medium ₹18–40, container ₹35–85 per km. See what drives your rate — distance, vehicle, fuel, tolls, season and return loads — plus the cost formula.",
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
    "title": "What Is a Truck Load Board? How Load Boards Work in India | LoadSaathi",
    "keywords": [
      "load board for trucks india",
      "what is load board",
      "trucker tips"
    ],
    "summary": "What is a load board? It is where shippers post loads and truckers post trucks. This 2026 guide covers formats, costs, matching and how to choose one.",
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
    title: "PTL vs FTL in Logistics: Full Forms, Differences, and Which to Choose | LoadSaathi",
    keywords: ["ptl vs ftl", "part truck load", "full truck load", "shipping comparison india"],
    summary: "PTL means Part Truck Load and FTL means Full Truck Load. PTL shares truck space for shipments under 3 tonnes at 30-40% less; FTL gives exclusive vehicle use for loads over 7 tonnes. Differences, costs and how to choose.",
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
    "keywords": [
      "part load transport ranchi",
      "PTL booking ranchi",
      "truck booking ranchi",
      "freight service ranchi"
    ],
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
    "keywords": [
      "part load transport bhubaneswar",
      "PTL booking bhubaneswar",
      "truck booking bhubaneswar",
      "freight service bhubaneswar"
    ],
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
    "keywords": [
      "part load transport rourkela",
      "PTL booking rourkela",
      "truck booking rourkela",
      "freight service rourkela"
    ],
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
    "keywords": [
      "part load transport jamshedpur",
      "PTL booking jamshedpur",
      "truck booking jamshedpur",
      "freight service jamshedpur"
    ],
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
    "keywords": [
      "part load transport balasore",
      "PTL booking balasore",
      "truck booking balasore",
      "freight service balasore"
    ],
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
    "keywords": [
      "part load transport berhampur",
      "PTL booking berhampur",
      "truck booking berhampur",
      "freight service berhampur"
    ],
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
    "keywords": [
      "part load transport kolkata",
      "PTL booking kolkata",
      "truck booking kolkata",
      "freight service kolkata"
    ],
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
    "keywords": [
      "part load transport durgapur",
      "PTL booking durgapur",
      "truck booking durgapur",
      "freight service durgapur"
    ],
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
    "keywords": [
      "part load transport burdwan",
      "PTL booking burdwan",
      "truck booking burdwan",
      "freight service burdwan"
    ],
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
    // LOCATION_DATA mirrors the React LocationPage copy, so the injected body
    // text and the client-rendered page describe the city identically.
    const data = LOCATION_DATA[slug] || null;
    const parts = locationMatch[1].split('/');
    const city = parts[parts.length - 1] || parts[0];
    const state = parts.length > 1 ? parts.slice(0, -1).join('-') : '';
    const cityTitle = city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const stateTitle = state.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const dataName = data ? data.name : cityTitle;
    const dataState = data ? data.state : stateTitle;
    const summary = data && data.description
      ? data.description
      : `Freight services and trucking in ${cityTitle}.`;
    return {
      seoTitle: state ? `${cityTitle}, ${stateTitle} Freight | LoadSaathi` : `${cityTitle} Freight | LoadSaathi`,
      // clampMetaDescription keeps the React and server-rendered descriptions
      // byte-identical; LocationPage uses the same helper on the same string.
      metaDescription: clampMetaDescription(summary),
      keywords: [`freight ${dataName}`, `trucking ${dataName}`, `${dataName} logistics`, `PTL ${dataName}`, `FTL ${dataName}`],
      summary,
      author: 'LoadSaathi Team',
      type: 'location',
      slug: locationMatch[1],
      location: data,
      locationName: dataName,
      locationState: dataState,
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
const LOCATION_DATA = {
  "rourkela": {
    "name": "Rourkela",
    "state": "Odisha",
    "description": "Rourkela is a major industrial hub in western Odisha, anchored by the Rourkela Steel Plant (SAIL). It serves as a key transit point for steel, cement, and forest products moving across East India. The city handles 8–12 million tonnes of freight annually through its industrial corridor.",
    "industries": [
      "Steel & Metals",
      "Cement",
      "Forest Products",
      "Engineering Goods"
    ],
    "commodities": [
      "Hot-rolled steel coils",
      "Cement (ultra-tech, Ambuja)",
      "Plywood & timber",
      "Heavy engineering parts",
      "Aluminium ingots"
    ],
    "hubDistances": [
      {
        "city": "Bhubaneswar",
        "km": 310
      },
      {
        "city": "Kolkata",
        "km": 530
      },
      {
        "city": "Jamshedpur",
        "km": 280
      },
      {
        "city": "Cuttack",
        "km": 350
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (Steel)",
        "range": "₹38–55/kg"
      },
      {
        "type": "PTL",
        "range": "₹6–9/kg"
      },
      {
        "type": "LTL",
        "range": "₹10–14/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What is the average truck freight rate from Rourkela to Bhubaneswar?",
        "a": "FTL truck rates from Rourkela to Bhubaneswar range from ₹38,000 to ₹55,000 depending on truck type (Open, Container, Trailer) and cargo weight. PTL shipments cost ₹6–9 per kg. Use LoadSaathi's freight rate calculator for a precise quote."
      },
      {
        "q": "Which industries drive freight demand in Rourkela?",
        "a": "The Rourkela Steel Plant (SAIL) is the single largest freight generator. Cement plants, aluminium smelters, and forest product exporters also contribute significantly to outbound freight. Inbound freight includes FMCG, food grains, and construction materials."
      },
      {
        "q": "What is the fastest route from Rourkela to Kolkata for trucking?",
        "a": "The fastest trucking route from Rourkela to Kolkata is via NH-49 and NH-16, covering approximately 530 km in 12–14 hours. LoadSaathi's OSRM-based route planner provides real-time distance and transit time calculations."
      }
    ]
  },
  "ranchi": {
    "name": "Ranchi",
    "state": "Jharkhand",
    "description": "Ranchi, the capital of Jharkhand, is a growing logistics hub at the crossroads of multiple state highways. It handles coal, heavy machinery, and consumer goods distribution for the Chota Nagpur Plateau region. The city's freight volume grows 12–15% annually.",
    "industries": [
      "Coal & Mining",
      "Heavy Machinery",
      "Consumer Goods",
      "Agriculture"
    ],
    "commodities": [
      "Coal & lignite",
      "Heavy mining equipment",
      "Agricultural produce (rice, wheat)",
      "Automobile parts",
      "Cement & building materials"
    ],
    "hubDistances": [
      {
        "city": "Kolkata",
        "km": 390
      },
      {
        "city": "Jamshedpur",
        "km": 155
      },
      {
        "city": "Rourkela",
        "km": 280
      },
      {
        "city": "Patna",
        "km": 330
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (Coal)",
        "range": "₹35–50/kg"
      },
      {
        "type": "PTL",
        "range": "₹7–10/kg"
      },
      {
        "type": "LTL",
        "range": "₹11–15/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What freight rates apply for coal transport from Ranchi?",
        "a": "Coal transport from Ranchi to nearby industrial centres ranges from ₹35–50 per kg for FTL loads. The rate varies by distance, truck type, and seasonal demand. LoadSaathi offers real-time price predictions based on your specific route and cargo."
      },
      {
        "q": "How do I book a truck from Ranchi to Kolkata?",
        "a": "Post your shipment on LoadSaathi with origin Ranchi, destination Kolkata, weight, and goods type. Our AI matching engine connects you with verified truckers heading that route. You can compare rates, check trucker ratings, and book in minutes."
      },
      {
        "q": "Which truck types are available from Ranchi?",
        "a": "Open trucks (9MT, 16MT), containers (20ft, 32ft), flatbed trailers, and tankers are commonly available from Ranchi. LoadSaathi's fleet covers all major truck types for the Chota Nagpur Plateau region."
      }
    ]
  },
  "kolkata": {
    "name": "Kolkata",
    "state": "West Bengal",
    "description": "Kolkata is the commercial capital of East India and a major port city. It serves as the primary distribution hub for goods moving between East India and the rest of the country. The Kolkata dock handles 70+ million tonnes of cargo annually, making it the anchor of the region's freight network.",
    "industries": [
      "Jute & Textiles",
      "Steel Trading",
      "Electronics",
      "FMCG Distribution"
    ],
    "commodities": [
      "Jute products",
      "Steel & iron ore",
      "Leather goods",
      "Electronics",
      "Tea & food products"
    ],
    "hubDistances": [
      {
        "city": "Rourkela",
        "km": 530
      },
      {
        "city": "Ranchi",
        "km": 390
      },
      {
        "city": "Jamshedpur",
        "km": 290
      },
      {
        "city": "Bhubaneswar",
        "km": 470
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (General)",
        "range": "₹42–60/kg"
      },
      {
        "type": "PTL",
        "range": "₹5–8/kg"
      },
      {
        "type": "LTL",
        "range": "₹9–12/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What are the truck freight rates from Kolkata to Bhubaneswar?",
        "a": "FTL rates from Kolkata to Bhubaneswar range from ₹42,000 to ₹60,000 for a full truck load. PTL shipments cost ₹5–8 per kg. Rates vary by truck type, cargo nature, and pickup location within Kolkata."
      },
      {
        "q": "How does LoadSaathi handle Kolkata port logistics?",
        "a": "LoadSaathi connects port-bound and port-origin freight with available trucks. If you're moving goods from Kolkata Port (Haldia/DP World) to inland destinations, post your shipment and get matched with truckers who specialise in port pickup and documentation."
      },
      {
        "q": "What is the best route from Kolkata to Rourkela for heavy cargo?",
        "a": "The recommended route for heavy cargo is Kolkata → Kharagpur → Rourkela via NH-16 and NH-49 (530 km). This route has good road infrastructure and weighbridges. LoadSaathi's route planner confirms current conditions."
      }
    ]
  },
  "bhubaneswar": {
    "name": "Bhubaneswar",
    "state": "Odisha",
    "description": "Bhubaneswar, the capital of Odisha, is a rapidly growing IT and industrial hub. It connects coastal Odisha with inland markets and serves as a gateway to Paradip and Gopalpur ports. The city handles increasing e-commerce and consumer goods freight volumes alongside traditional industrial cargo.",
    "industries": [
      "IT & Technology",
      "Ports & Logistics",
      "Food Processing",
      "Textiles"
    ],
    "commodities": [
      "Port cargo (Paradip, Gopalpur)",
      "IT hardware",
      "Food grains & pulses",
      "Textiles & garments",
      "Pharmaceuticals"
    ],
    "hubDistances": [
      {
        "city": "Rourkela",
        "km": 310
      },
      {
        "city": "Cuttack",
        "km": 25
      },
      {
        "city": "Kolkata",
        "km": 470
      },
      {
        "city": "Sambalpur",
        "km": 300
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (Port)",
        "range": "₹40–58/kg"
      },
      {
        "type": "PTL",
        "range": "₹5–8/kg"
      },
      {
        "type": "LTL",
        "range": "₹9–13/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What are the freight rates from Bhubaneswar to Rourkela?",
        "a": "FTL truck rates from Bhubaneswar to Rourkela range from ₹40,000 to ₹58,000. PTL rates are ₹5–8 per kg. LoadSaathi's freight rate calculator provides instant estimates based on your cargo type and weight."
      },
      {
        "q": "How does LoadSaathi support port logistics from Bhubaneswar?",
        "a": "LoadSaathi connects Paradip Port and Gopalpur Port cargo with available trucks. If you're importing or exporting through these ports, post your container or bulk cargo requirements and get matched with experienced port truckers."
      },
      {
        "q": "What truck types are suitable for Bhubaneswar to Rourkela?",
        "a": "Container trucks (20ft, 32ft), open trucks (9MT, 16MT), and flatbed trailers are suitable. For steel and heavy cargo, high-bed trailers are recommended. LoadSaathi's matching engine suggests the best truck type for your cargo."
      }
    ]
  },
  "jamshedpur": {
    "name": "Jamshedpur",
    "state": "Jharkhand",
    "description": "Jamshedpur is India's first planned industrial city, home to Tata Steel. It is a critical node in the East India freight network for steel, automotive, and manufactured goods. The city's Tatanagar junction and industrial sidings handle dedicated freight movements for the Tata group.",
    "industries": [
      "Steel Manufacturing",
      "Automotive Parts",
      "Heavy Engineering",
      "Cement"
    ],
    "commodities": [
      "Finished steel products",
      "Automobile components",
      "Heavy engineering parts",
      "Clinker & cement",
      "Wire & cable"
    ],
    "hubDistances": [
      {
        "city": "Kolkata",
        "km": 290
      },
      {
        "city": "Ranchi",
        "km": 155
      },
      {
        "city": "Rourkela",
        "km": 280
      },
      {
        "city": "Bhubaneswar",
        "km": 430
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (Steel)",
        "range": "₹36–52/kg"
      },
      {
        "type": "PTL",
        "range": "₹6–9/kg"
      },
      {
        "type": "LTL",
        "range": "₹10–14/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What freight rates apply for steel transport from Jamshedpur?",
        "a": "Steel transport from Jamshedpur ranges from ₹36–52 per kg for FTL loads depending on destination. Kolkata is the cheapest corridor (₹36–42/kg) while Bhubaneswar costs ₹40–52/kg. LoadSaathi provides real-time rates for your specific route."
      },
      {
        "q": "How do I book a truck for Tata Steel cargo from Jamshedpur?",
        "a": "Post your shipment on LoadSaathi with origin Jamshedpur, destination, weight, and cargo type (steel coils, bars, sheets). Our AI matching connects you with truckers experienced in steel handling. All truckers are verified with insurance and KYC."
      },
      {
        "q": "What is the fastest route from Jamshedpur to Kolkata for trucking?",
        "a": "The fastest route is via NH-33 and NH-16 (290 km, 6–7 hours). This is one of the busiest freight corridors in East India. LoadSaathi's route planner confirms current road conditions and suggests optimal departure times."
      }
    ]
  },
  "cuttack": {
    "name": "Cuttack",
    "state": "Odisha",
    "description": "Cuttack, the former capital of Odisha, is a major commercial and trading hub. It connects coastal Odisha with inland markets and handles textiles, food grains, and engineering goods. The city's proximity to Paradip Port (100 km) makes it a key logistics node for port-related freight.",
    "industries": [
      "Textiles & Handicrafts",
      "Food Processing",
      "Engineering Goods",
      "Trading"
    ],
    "commodities": [
      "Silver filigree & handicrafts",
      "Rice & food grains",
      "Textiles & yarn",
      "Engineering components",
      "Spices & condiments"
    ],
    "hubDistances": [
      {
        "city": "Bhubaneswar",
        "km": 25
      },
      {
        "city": "Rourkela",
        "km": 350
      },
      {
        "city": "Kolkata",
        "km": 460
      },
      {
        "city": "Sambalpur",
        "km": 280
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (General)",
        "range": "₹32–48/kg"
      },
      {
        "type": "PTL",
        "range": "₹5–8/kg"
      },
      {
        "type": "LTL",
        "range": "₹9–12/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What are the freight rates from Cuttack to Rourkela?",
        "a": "FTL rates from Cuttack to Rourkela range from ₹32,000 to ₹48,000 depending on truck type and cargo. PTL shipments cost ₹5–8 per kg. LoadSaathi's freight calculator gives you an instant estimate for this corridor."
      },
      {
        "q": "How does Cuttack's proximity to Paradip Port affect freight rates?",
        "a": "Cuttack is 100 km from Paradip Port, making it a cost-effective origin for port-bound cargo. Rates from Cuttack to Paradip are ₹8–12 per kg (PTL). LoadSaathi connects Cuttack traders with trucks heading to and from Paradip."
      },
      {
        "q": "What truck types are available from Cuttack?",
        "a": "Open trucks (9MT, 16MT), containers, flatbed trucks, and mini-trucks (for smaller loads) are available. For textile and handicraft cargo, covered trucks are recommended. LoadSaathi's matching engine suggests the best option for your cargo."
      }
    ]
  },
  "sambalpur": {
    "name": "Sambalpur",
    "state": "Odisha",
    "description": "Sambalpur is a key industrial and agricultural hub in western Odisha. Known for its textile and metal works, it connects the Hirakud Dam region with coastal markets. The city is a major transit point for aluminium, paper, and agricultural produce moving to coastal ports.",
    "industries": [
      "Textiles & Handloom",
      "Aluminium & Metals",
      "Agriculture",
      "Paper & Pulp"
    ],
    "commodities": [
      "Aluminium ingots & rolled products",
      "Handloom textiles (Sambalpuri sarees)",
      "Paper & pulp",
      "Paddy & wheat",
      "Iron ore"
    ],
    "hubDistances": [
      {
        "city": "Bhubaneswar",
        "km": 300
      },
      {
        "city": "Rourkela",
        "km": 220
      },
      {
        "city": "Cuttack",
        "km": 280
      },
      {
        "city": "Jharsuguda",
        "km": 80
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (Aluminium)",
        "range": "₹34–50/kg"
      },
      {
        "type": "PTL",
        "range": "₹6–9/kg"
      },
      {
        "type": "LTL",
        "range": "₹10–13/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What freight rates apply for aluminium transport from Sambalpur?",
        "a": "Aluminium transport from Sambalpur ranges from ₹34–50 per kg for FTL loads. Bhubaneswar corridor costs ₹34–42/kg while Kolkata costs ₹40–50/kg. LoadSaathi's AI pricing considers aluminium's specific handling requirements."
      },
      {
        "q": "How do I book a truck from Sambalpur to Bhubaneswar?",
        "a": "Post your shipment on LoadSaathi with origin Sambalpur, destination Bhubaneswar, weight, and cargo type. Our AI matches you with verified truckers. Sambalpur to Bhubaneswar is a high-demand corridor with frequent truck availability."
      },
      {
        "q": "What is the fastest route from Sambalpur to Jharsuguda?",
        "a": "The fastest route from Sambalpur to Jharsuguda is via NH-53 (80 km, 1.5–2 hours). This is a short-haul corridor with high truck frequency. LoadSaathi offers instant booking for this route."
      }
    ]
  },
  "angul": {
    "name": "Angul",
    "state": "Odisha",
    "description": "Angul is an industrial powerhouse in Odisha, home to major power plants and aluminium smelters. It handles heavy industrial cargo including coal, alumina, and power equipment. The Talcher coalfield nearby makes Angul one of the highest-tonnage freight origins in the state.",
    "industries": [
      "Power Generation",
      "Aluminium Smelting",
      "Coal Mining",
      "Heavy Industry"
    ],
    "commodities": [
      "Coal & lignite",
      "Alumina & aluminium",
      "Power equipment",
      "Fertilisers",
      "Heavy machinery"
    ],
    "hubDistances": [
      {
        "city": "Bhubaneswar",
        "km": 170
      },
      {
        "city": "Sambalpur",
        "km": 120
      },
      {
        "city": "Rourkela",
        "km": 240
      },
      {
        "city": "Cuttack",
        "km": 155
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (Coal)",
        "range": "₹30–45/kg"
      },
      {
        "type": "PTL",
        "range": "₹6–9/kg"
      },
      {
        "type": "LTL",
        "range": "₹10–13/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What freight rates apply for coal transport from Angul?",
        "a": "Coal transport from Angul ranges from ₹30–45 per kg for FTL loads. Bhubaneswar corridor costs ₹30–38/kg while Rourkela costs ₹35–45/kg. LoadSaathi's pricing accounts for coal's weight-to-value ratio and seasonal demand spikes."
      },
      {
        "q": "How does LoadSaathi handle coal and power cargo from Angul?",
        "a": "LoadSaathi connects Angul's power plants and aluminium smelters with specialised coal carriers. We match bulk coal shipments with high-capacity trucks (16MT, 25MT) and ensure drivers have experience with mining area roads."
      },
      {
        "q": "What truck types are best for Angul's industrial cargo?",
        "a": "High-bed trailers (for heavy machinery), tipper trucks (for coal), container trucks (for alumina), and open trucks (for general cargo) are available. LoadSaathi's matching engine recommends the right truck type based on your cargo specifications."
      }
    ]
  },
  "jharsuguda": {
    "name": "Jharsuguda",
    "state": "Odisha",
    "description": "Jharsuguda is a growing industrial town in western Odisha with aluminium plants, power stations, and a domestic airport. It is a key node on the Rourkela–Sambalpur industrial corridor and handles significant aluminium and power sector freight.",
    "industries": [
      "Aluminium",
      "Power Plants",
      "Cement",
      "Mining Equipment"
    ],
    "commodities": [
      "Aluminium rolled products",
      "Cement & clinker",
      "Power plant spares",
      "Coal",
      "Transformer oil"
    ],
    "hubDistances": [
      {
        "city": "Sambalpur",
        "km": 80
      },
      {
        "city": "Rourkela",
        "km": 170
      },
      {
        "city": "Bhubaneswar",
        "km": 380
      },
      {
        "city": "Cuttack",
        "km": 360
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (Aluminium)",
        "range": "₹32–48/kg"
      },
      {
        "type": "PTL",
        "range": "₹6–8/kg"
      },
      {
        "type": "LTL",
        "range": "₹9–12/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What freight rates apply for aluminium transport from Jharsuguda?",
        "a": "Aluminium transport from Jharsuguda ranges from ₹32–48 per kg for FTL loads. Sambalpur corridor (80 km) is the cheapest at ₹32–36/kg. Bhubaneswar corridor costs ₹38–48/kg. LoadSaathi provides instant quotes for your specific route."
      },
      {
        "q": "How do I book a truck from Jharsuguda to Sambalpur?",
        "a": "Post your shipment on LoadSaathi with origin Jharsuguda, destination Sambalpur, weight, and cargo type. This 80 km corridor has very high truck frequency with multiple daily departures. LoadSaathi matches you with the best available trucker."
      },
      {
        "q": "What is the fastest route from Jharsuguda to Bhubaneswar?",
        "a": "The fastest route is via NH-53 and NH-16 (380 km, 8–9 hours). This route passes through Sambalpur and Cuttack. LoadSaathi's route planner provides real-time distance and transit calculations."
      }
    ]
  },
  "burdwan": {
    "name": "Burdwan",
    "state": "West Bengal",
    "description": "Burdwan is an industrial and coal distribution hub in West Bengal, strategically located on the Delhi–Kolkata corridor. It handles significant freight volumes for steel processing, agricultural goods, and engineering components moving between Chota Nagpur and the Gangetic plains. The city's proximity to Raniganj coalfields makes it a key node for coal logistics in eastern India.",
    "industries": [
      "Steel Processing",
      "Coal Distribution",
      "Engineering Goods",
      "Agriculture"
    ],
    "commodities": [
      "Processed steel",
      "Coal",
      "Rice & wheat",
      "Engineering components",
      "Clay products"
    ],
    "hubDistances": [
      {
        "city": "Kolkata",
        "km": 110
      },
      {
        "city": "Dhanbad",
        "km": 180
      },
      {
        "city": "Ranchi",
        "km": 280
      },
      {
        "city": "Rourkela",
        "km": 320
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (General)",
        "range": "₹32–48/kg"
      },
      {
        "type": "PTL",
        "range": "₹5–8/kg"
      },
      {
        "type": "LTL",
        "range": "₹9–12/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What are the freight rates from Burdwan to Kolkata?",
        "a": "FTL truck rates from Burdwan to Kolkata range from ₹32,000 to ₹48,000 depending on truck type and cargo weight. PTL shipments cost ₹5–8 per kg and LTL shipments cost ₹9–12 per kg. This 110 km corridor is one of the busiest in West Bengal. Use LoadSaathi's freight rate calculator for a precise quote based on your cargo type."
      },
      {
        "q": "Which industries drive freight demand in Burdwan?",
        "a": "Steel processing and coal distribution are the primary freight generators, with the Raniganj coalfield nearby fuelling significant coal movements. Agriculture (rice and wheat) and engineering goods also contribute substantially to both inbound and outbound freight. Burdwan's clay products industry generates consistent LTL demand."
      },
      {
        "q": "What is the fastest trucking route from Burdwan to Kolkata?",
        "a": "The fastest route from Burdwan to Kolkata is via NH-2 (Grand Trunk Road), covering 110 km in approximately 2.5–3 hours. This is one of India's oldest and most well-maintained highways. LoadSaathi's OSRM-based route planner provides real-time distance and transit time calculations for this corridor."
      }
    ]
  },
  "dhanbad": {
    "name": "Dhanbad",
    "state": "Jharkhand",
    "description": "Dhanbad is India's coal capital, home to the Bharat Coking Coal Limited (BCCL) headquarters and the Jharia coalfield. It is the single largest source of coking coal in the country, generating massive freight volumes for coal, power equipment, and mining machinery. The city handles 50+ million tonnes of coal freight annually through its mining corridors.",
    "industries": [
      "Coal Mining",
      "Power Generation",
      "Heavy Industry",
      "Steel Ancillaries"
    ],
    "commodities": [
      "Coal & lignite",
      "Power plant equipment",
      "Mining machinery",
      "Coke & by-products",
      "Construction materials"
    ],
    "hubDistances": [
      {
        "city": "Ranchi",
        "km": 280
      },
      {
        "city": "Jamshedpur",
        "km": 170
      },
      {
        "city": "Kolkata",
        "km": 350
      },
      {
        "city": "Rourkela",
        "km": 450
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (Coal)",
        "range": "₹30–45/kg"
      },
      {
        "type": "PTL",
        "range": "₹6–9/kg"
      },
      {
        "type": "LTL",
        "range": "₹10–13/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What are the coal freight rates from Dhanbad?",
        "a": "Coal freight rates from Dhanbad range from ₹30–45 per kg for FTL loads depending on destination. Kolkata corridor (350 km) costs ₹35–45/kg while Jamshedpur (170 km) costs ₹30–38/kg. LoadSaathi's AI pricing accounts for coal's weight-to-value ratio, seasonal demand spikes, and tipping charges at loading points."
      },
      {
        "q": "Which truck types are best suited for coal transport from Dhanbad?",
        "a": "Tipper trucks (16MT, 25MT), open high-bed trailers, and coal-carrier special vehicles are the most commonly used. High-capacity tippers are preferred for loose coal movement from collieries to railway sidings and power plants. LoadSaathi connects you with truckers who have experience navigating Jharia's mining roads and weight restrictions."
      },
      {
        "q": "What is the fastest route from Dhanbad to Kolkata for coal trucks?",
        "a": "The fastest route from Dhanbad to Kolkata is via NH-2 (Grand Trunk Road) through Asansol and Durgapur, covering 350 km in 8–10 hours. This route has multiple weighbridges and rest stops. LoadSaathi's route planner provides real-time road conditions and suggests optimal departure times to avoid peak traffic at Durgapur."
      }
    ]
  },
  "balasore": {
    "name": "Balasore",
    "state": "Odisha",
    "description": "Balasore is a coastal trading hub on NH-16, strategically positioned between Kolkata and Bhubaneswar. It serves as a key transit point for rice milling, seafood processing, and defence-related freight for the Integrated Test Range (ITR) at Chandipur. The city's NH-16 corridor handles significant volumes of agricultural and processed food cargo.",
    "industries": [
      "Rice Milling",
      "Seafood Processing",
      "Textiles",
      "Defence (HAL/DRDO)"
    ],
    "commodities": [
      "Rice & paddy",
      "Seafood & fish",
      "Textiles",
      "Defence equipment",
      "Palm oil"
    ],
    "hubDistances": [
      {
        "city": "Bhubaneswar",
        "km": 210
      },
      {
        "city": "Kolkata",
        "km": 300
      },
      {
        "city": "Cuttack",
        "km": 170
      },
      {
        "city": "Rourkela",
        "km": 420
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (General)",
        "range": "₹34–48/kg"
      },
      {
        "type": "PTL",
        "range": "₹5–8/kg"
      },
      {
        "type": "LTL",
        "range": "₹9–12/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What are the freight rates from Balasore to Bhubaneswar?",
        "a": "FTL truck rates from Balasore to Bhubaneswar range from ₹34,000 to ₹48,000 depending on truck type and cargo. PTL shipments cost ₹5–8 per kg and LTL shipments cost ₹9–12 per kg. This 210 km corridor along NH-16 is well-served with frequent departures. LoadSaathi's freight calculator gives you an instant estimate for this route."
      },
      {
        "q": "How does LoadSaathi handle seafood transport from Balasore?",
        "a": "LoadSaathi connects Balasore's seafood processors with refrigerated and insulated trucks suitable for perishable cargo. Post your seafood shipment with temperature requirements and we match you with truckers who have experience with cold chain logistics. Timely delivery is critical for perishable goods on this corridor."
      },
      {
        "q": "What is the NH-16 corridor freight outlook from Balasore?",
        "a": "The NH-16 corridor (Kolkata–Chennai) is one of India's busiest freight highways, and Balasore sits at a strategic midpoint. Rates along this corridor are competitive due to high truck availability. LoadSaathi's real-time pricing reflects current demand along the full NH-16 stretch, helping you plan cost-effective shipments."
      }
    ]
  },
  "berhampur": {
    "name": "Berhampur",
    "state": "Odisha",
    "description": "Berhampur (also called Brahmapur) is the gateway to southern Odisha, known for its silk textiles and rice milling industry. It connects the Ganjam district with coastal and inland markets, handling significant volumes of silk, processed rice, and fish cargo. The city's proximity to the Andhra Pradesh border makes it a key cross-state freight node.",
    "industries": [
      "Textiles & Silk",
      "Rice Milling",
      "Fisheries",
      "Cashew Processing"
    ],
    "commodities": [
      "Silk textiles",
      "Rice",
      "Fish & prawns",
      "Cashew",
      "Jute products"
    ],
    "hubDistances": [
      {
        "city": "Bhubaneswar",
        "km": 180
      },
      {
        "city": "Vizag",
        "km": 280
      },
      {
        "city": "Cuttack",
        "km": 210
      },
      {
        "city": "Rourkela",
        "km": 500
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (General)",
        "range": "₹34–50/kg"
      },
      {
        "type": "PTL",
        "range": "₹6–9/kg"
      },
      {
        "type": "LTL",
        "range": "₹10–13/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What are the freight rates from Berhampur to Bhubaneswar?",
        "a": "FTL truck rates from Berhampur to Bhubaneswar range from ₹34,000 to ₹50,000 depending on truck type and cargo. PTL shipments cost ₹6–9 per kg and LTL shipments cost ₹10–13 per kg. This 180 km corridor along NH-16 has frequent truck departures. Use LoadSaathi's freight rate calculator for a precise quote tailored to your cargo."
      },
      {
        "q": "How does LoadSaathi handle silk and textile transport from Berhampur?",
        "a": "LoadSaathi connects Berhampur's silk weavers and textile traders with covered trucks and container vehicles suitable for high-value fabric cargo. Post your textile shipment with packaging details and we match you with verified truckers experienced in handling delicate goods. Insurance coverage is available for premium textile shipments."
      },
      {
        "q": "What is the fastest route from Berhampur to Vizag?",
        "a": "The fastest route from Berhampur to Vizag is via NH-16, covering 280 km in 6–7 hours. This coastal highway runs along the Bay of Bengal and offers smooth road conditions for most of the stretch. LoadSaathi's route planner confirms current road conditions and suggests optimal departure times."
      }
    ]
  },
  "visakhapatnam": {
    "name": "Vizag",
    "state": "Andhra Pradesh",
    "description": "Vizag (Visakhapatnam) is a major port city on India's eastern seaboard, home to the Vizag Steel Plant (Rashtriya Ispat Nigam Limited) and one of the country's busiest cargo ports. It handles 80+ million tonnes of port cargo annually, making it a critical node for steel, petroleum, and IT hardware freight. The city's industrial corridor extends from the steel plant to the IT SEZs.",
    "industries": [
      "Steel (VSP)",
      "Ports & Shipping",
      "IT",
      "Petroleum Refining"
    ],
    "commodities": [
      "Finished steel",
      "Crude oil products",
      "IT hardware",
      "Seafood exports",
      "Petroleum coke"
    ],
    "hubDistances": [
      {
        "city": "Bhubaneswar",
        "km": 450
      },
      {
        "city": "Hyderabad",
        "km": 625
      },
      {
        "city": "Vijayawada",
        "km": 350
      },
      {
        "city": "Rourkela",
        "km": 700
      }
    ],
    "rateRanges": [
      {
        "type": "FTL (Steel/Port)",
        "range": "₹40–60/kg"
      },
      {
        "type": "PTL",
        "range": "₹5–9/kg"
      },
      {
        "type": "LTL",
        "range": "₹9–14/kg"
      }
    ],
    "localFaq": [
      {
        "q": "What are the port freight rates from Vizag?",
        "a": "Port freight rates from Vizag depend on cargo type and destination. FTL rates for steel and general cargo range from ₹40–60 per kg, while PTL shipments cost ₹5–9 per kg. Container and bulk cargo rates vary based on volume. LoadSaathi's AI pricing reflects real-time port congestion and truck availability at Vizag Port."
      },
      {
        "q": "How does LoadSaathi support Vizag Steel Plant logistics?",
        "a": "LoadSaathi connects VSP's outbound steel shipments with qualified carriers experienced in handling finished steel products including hot-rolled coils, cold-rolled sheets, and rebars. Post your VSP pickup or delivery requirements and we match you with truckers who have ongoing contracts with the steel plant. All carriers are verified with proper documentation."
      },
      {
        "q": "What is the coastal freight corridor from Vizag to Bhubaneswar?",
        "a": "The coastal corridor from Vizag to Bhubaneswar runs via NH-16, covering 450 km in 10–12 hours. This is a major freight artery connecting Andhra Pradesh with Odisha. Rates are competitive due to high truck availability on this corridor. LoadSaathi's route planner provides real-time distance, transit time, and current road conditions for this stretch."
      }
    ]
  }
};

const TRANSPORT_SERVICE_CONTENT = {
  "ranchi": {
    "cityName": "Ranchi",
    "lead": "Part load and full truck booking for Ranchi's Hatia, Kokar, Morabadi, Doranda and Namkum belts, moving coal, machinery spares, agriculture produce and retail stock across Jharkhand, West Bengal and Bihar.",
    "answer": "Part load transport in Ranchi connects pickups across Hatia, Kokar, Morabadi, Doranda and Namkum to Kolkata, Jamshedpur, Patna and Rourkela. PTL booking in Ranchi lets a shipper book space in a shared truck for a consignment that does not fill a full vehicle, so you pay only for the weight and volume you occupy instead of hiring an entire truck. Coal and lignite, mining equipment spares, rice and wheat, cement and automobile parts move most often out of the city, while FMCG stock, retail goods and machinery move in. FTL truck booking from Ranchi suits a dedicated 16MT open truck or 32ft container when the load is heavy or the timing is fixed. LoadSaathi shows live availability, a rate range, truck type, transit time and trucker rating before you confirm, so freight service in Ranchi works the same way whether you are sending two bags of rice or a full trailer of equipment."
  },
  "bhubaneswar": {
    "cityName": "Bhubaneswar",
    "lead": "PTL and FTL freight booking for Mancheswar Industrial Estate, Patia, Khordha and Jatni — pharma, FMCG, food grains and port cargo moving to Rourkela, Cuttack, Sambalpur and Kolkata.",
    "answer": "Part load transport in Bhubaneswar serves Mancheswar Industrial Estate, Patia, Khordha and Jatni, with corridors running to Rourkela, Cuttack, Sambalpur and Kolkata. PTL booking in Bhubaneswar is built for MSMEs moving pharmaceuticals, FMCG cartons, food grains and garments in quantities that do not justify a full truck. A shared truck splits the vehicle cost across shippers heading the same direction, which keeps freight service in Bhubaneswar cheaper per kilogram than booking an empty vehicle. FTL truck booking is the better fit when you are moving a full 16MT load of port cargo, sealed pharma pallets or bulk food grains on a fixed schedule. Every LoadSaathi listing shows the truck type, rate range, transit time and trucker profile before you book, and you can request an instant freight quote for a Bhubaneswar to Rourkela or Kolkata lane without waiting for a broker to call back."
  },
  "rourkela": {
    "cityName": "Rourkela",
    "lead": "Steel, cement, forest product and engineering freight from Chhend, Sector 19, Fertiliser Township, Jagda and Raghunathpali to Bhubaneswar, Kolkata, Jamshedpur and Cuttack.",
    "answer": "Part load transport in Rourkela runs out of Chhend, Sector 19, Fertiliser Township, Jagda and Raghunathpali toward Bhubaneswar, Kolkata, Jamshedpur and Cuttack. PTL booking in Rourkela fits engineering parts, cement bags, plywood and aluminium ingots that do not need an entire truck. Booking shared space keeps freight service in Rourkela affordable per kilogram for small consignments of fasteners, consumables and steel accessories. FTL truck booking is the standard choice for hot-rolled coils, heavy machinery and full cement loads where a dedicated vehicle and a fixed departure matter. LoadSaathi lists the rate range by truck type, distance and transit time alongside verified trucker profiles, so you can compare options before confirming. You can also request an instant freight quote for a Rourkela to Bhubaneswar or Kolkata lane and see the current market range immediately instead of waiting on a local broker call back."
  },
  "jamshedpur": {
    "cityName": "Jamshedpur",
    "lead": "Automotive components, steel and engineering freight from Bistupur, Sakchi, Jugsalai, Kadma, Sonali and Gamharia to Kolkata, Ranchi, Rourkela and Bhubaneswar.",
    "answer": "Part load transport in Jamshedpur covers Bistupur, Sakchi, Jugsalai, Kadma, Sonali and Gamharia, with freight moving to Kolkata, Ranchi, Rourkela and Bhubaneswar. PTL booking in Jamshedpur is designed for automotive components, fasteners, wire and cable, and small engineering batches that leave the plant in quantities smaller than a full truckload. Shared-truck freight service in Jamshedpur spreads the vehicle cost across shippers, which keeps per-kilogram rates predictable for MSMEs supplying the city's steel and engineering ecosystem. FTL truck booking suits finished steel products, heavy engineering parts and clinker where a dedicated vehicle and a fixed departure matter. LoadSaathi shows the rate range, truck type, transit time and trucker rating before you confirm, and you can pull an instant freight quote for a Jamshedpur to Kolkata or Ranchi lane in seconds."
  },
  "balasore": {
    "cityName": "Balasore",
    "lead": "Rice, paddy, textile and palm oil freight from Sahadevkhunta, Fakir Mohan and Chandinichowk to Bhubaneswar, Kolkata, Cuttack and Rourkela.",
    "answer": "Part load transport in Balasore runs from Sahadevkhunta, Fakir Mohan and Chandinichowk toward Bhubaneswar, Kolkata, Cuttack and Rourkela. PTL booking in Balasore suits rice and paddy bags, textile bales, palm oil drums and cashew cartons that do not fill a truck. Booking a shared load keeps freight service in Balasore economical for millers and traders shipping smaller consignments along the coastal corridor. FTL truck booking is the better option when a full 16MT of rice, a bulk textile order or a complete pallet run has to move on a fixed date. LoadSaathi lists rate ranges, truck availability and trucker ratings before you commit, so you can compare a Balasore to Bhubaneswar or Kolkata lane and request an instant freight quote without waiting on a local broker."
  },
  "berhampur": {
    "cityName": "Berhampur",
    "lead": "Rice, cashew, silk and seafood freight from Bada Bazar, Aska Road, Palur Road and Engineering School Chowk to Bhubaneswar, Cuttack, Vizag and Rourkela.",
    "answer": "Part load transport in Berhampur picks up from Bada Bazar, Aska Road, Palur Road and Engineering School Chowk, with lanes running to Bhubaneswar, Cuttack, Visakhapatnam and Rourkela. PTL booking in Berhampur is made for rice cartons, cashew consignments, silk textiles and small engineering batches that travel better as shared space than as a half-empty truck. Freight service in Berhampur lets millers, weavers and traders pay for the weight they actually load instead of carrying the cost of an entire vehicle. FTL truck booking is the right fit when a full 16MT of rice, a complete textile order or a bulk cashew dispatch must reach its destination on a set schedule. LoadSaathi lists rate ranges, truck types, transit times and verified trucker ratings up front, and you can request an instant freight quote for a Berhampur to Bhubaneswar or Vizag lane in under a minute."
  },
  "kolkata": {
    "cityName": "Kolkata",
    "lead": "Part load and full truck booking across Burrabazar, Salt Lake, New Town, Taratala, Baguiati, Howrah and the Dankuni truck terminal, serving jute, steel, electronics and FMCG.",
    "answer": "Part load transport in Kolkata serves Burrabazar, Salt Lake, New Town, Taratala, Baguiati, Howrah and the Dankuni truck terminal, with freight moving to Rourkela, Ranchi, Jamshedpur and Bhubaneswar. PTL booking in Kolkata is the practical choice for traders shipping jute products, leather goods, electronics, tea and FMCG cartons in quantities that do not justify a full vehicle. Shared-truck freight service in Kolkata keeps cost per kilogram low across East India's busiest distribution hub. FTL truck booking fits full steel consignments, containerised retail stock and bulk tea movements where a dedicated truck and fixed timing matter. LoadSaathi shows rate ranges, truck types, transit times and trucker ratings before you confirm, and you can pull an instant freight quote for any Kolkata lane to compare current market ranges immediately."
  },
  "durgapur": {
    "cityName": "Durgapur",
    "lead": "Steel, power plant spares and engineering freight from Benachity, City Centre, Steel Township and Andal to Kolkata, Asansol, Burdwan and Dhanbad.",
    "answer": "Part load transport in Durgapur runs from Benachity, City Centre, Steel Township and Andal toward Kolkata, Asansol, Burdwan and Dhanbad. PTL booking in Durgapur is built for steel billets and rods, power plant spares, engineering components and cement moving in quantities smaller than a full truckload. Shared-truck freight service in Durgapur keeps cost per kilogram manageable for suppliers on the Grand Trunk Road industrial belt who ship small batches regularly. FTL truck booking suits full loads of steel products, coal and bulk building material when the whole vehicle is needed and timing is fixed. LoadSaathi shows rate ranges, truck types, transit times and verified trucker ratings before you confirm, and you can request an instant freight quote for a Durgapur to Kolkata or Dhanbad lane and see the current market range without calling a broker."
  },
  "burdwan": {
    "cityName": "Burdwan",
    "lead": "Rice, wheat, processed steel and coal freight from G.T. Road, Curzon Gate, Bhatar and Belkuni to Kolkata, Dhanbad, Ranchi and Rourkela.",
    "answer": "Part load transport in Burdwan picks up from G.T. Road, Curzon Gate, Bhatar and Belkuni, with freight moving to Kolkata, Dhanbad, Ranchi and Rourkela. PTL booking in Burdwan fits processed steel, coal, rice and wheat bags, engineering components and clay products that do not fill a truck. Shared-truck freight service in Burdwan lets traders and millers pay only for the space they use on a busy East India corridor. FTL truck booking is the standard option for a full 16MT of grain, a complete coal movement or a bulk steel dispatch on a fixed date. LoadSaathi lists rate ranges, truck types, transit times and trucker ratings before you confirm, along with GST-ready booking details on every trip, and you can request an instant freight quote for a Burdwan to Kolkata or Dhanbad lane to see today's market range."
  }
};

// ---------------------------------------------------------------------------
// Shared page-content helpers
// ---------------------------------------------------------------------------

/** Escape a value for interpolation into HTML text or an attribute. */
function escapeHtml(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "2026-08-23" -> "23 August 2026"; returns null for anything unparseable. */
function formatIsoDate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Canonical /location/<slug> keys. vizag is an alias, visakhapatnam is canonical. */
const CITY_SLUGS = new Set([
  'rourkela', 'bhubaneswar', 'cuttack', 'sambalpur', 'angul', 'balasore', 'berhampur',
  'paradip', 'asansol', 'durgapur', 'ranchi', 'dhanbad', 'jamshedpur', 'kolkata',
  'burdwan', 'haldia', 'visakhapatnam',
]);

/** Published highway designations per route slug, for corridor pages. */
const ROUTE_HIGHWAY = {
  'rourkela-to-ranchi': 'NH-215',
  'rourkela-to-bhubaneswar': 'NH-203',
  'bhubaneswar-to-kolkata': 'NH-16 and NH-17',
  'jamshedpur-to-kolkata': 'NH-33',
  'dhanbad-to-kolkata': 'NH-2',
};

/** Per-km bands by road distance, used for the indicative rate line on corridors. */
function rateBandsFor(km) {
  if (km < 150) return { perKmLow: 12, perKmHigh: 18 };
  if (km < 300) return { perKmLow: 14, perKmHigh: 22 };
  if (km < 600) return { perKmLow: 16, perKmHigh: 26 };
  return { perKmLow: 18, perKmHigh: 30 };
}

/** Questions every corridor page answers, in route-agnostic terms. */
function routeFaq(seoMeta) {
  const from = seoMeta.from;
  const to = seoMeta.to;
  return [
    {
      q: `How much does it cost to move goods from ${from} to ${to}?`,
      a: `The answer depends on load type. A part load is priced per kilogram and normally lands 30–40% below a dedicated vehicle for anything under three tonnes; a full truck is quoted per vehicle. Both figures move with diesel, tolls and how many trucks are running empty in the opposite direction on the day.`,
    },
    {
      q: `How long does a ${from} to ${to} shipment take?`,
      a: `Published transit time for this lane is around ${seoMeta.duration || 'a day'} of driving. Add time for loading and consolidation if it is a part load, because the vehicle collects and drops several consignments on the way.`,
    },
    {
      q: `Can I get a return load from ${to} back to ${from}?`,
      a: `Yes, and it is usually the cheapest way to cut the cost of the outbound leg. Both cities are industrial, so cargo moves in both directions. Posting the trip before loading is what puts a return load on screen while the outbound decision is still open.`,
    },
    {
      q: `What does it cost to use LoadSaathi on this lane?`,
      a: `Joining is free for both sides. A completed shipment carries a ${FEES.shipper} transaction fee for shippers and ${FEES.trucker} for truckers, with no subscription and no listing fee.`,
    },
  ];
}

/** Normalise a FAQ list to { q, a }; BLOG_DATA/GUIDE_DATA use question/answer. */
function normaliseFaq(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      q: String(item.q || item.question || '').trim(),
      a: String(item.a || item.answer || '').trim(),
    }))
    .filter((item) => item.q && item.a);
}

/** Fallback FAQ for blog posts that do not ship one, built from the summary. */
function genericBlogFaq(entry) {
  const topic = (entry.keywords && entry.keywords[0]) || String(entry.title || '').replace(/\s*\|\s*LoadSaathi\s*$/, '');
  const sentences = String(entry.summary || '')
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const first = sentences[0] || `This guide sets out ${topic.toLowerCase()} for Indian shippers and truckers.`;
  const second = sentences[1] || sentences[0];
  return [
    {
      q: `What does this guide cover about ${topic.toLowerCase()}?`,
      a: `${first} ${second}`.trim(),
    },
    {
      q: 'How do I check a freight rate on LoadSaathi?',
      a: 'Enter your origin, destination, cargo weight and preferred date. The fare calculator returns per-kilometre and per-kilogram estimates including a toll and diesel allowance, and the freight rate calculator adds a recommended truck type so you can compare part load against a full truck on the same numbers.',
    },
    {
      q: 'Do shippers and truckers both pay to use the platform?',
      a: `Joining is free. LoadSaathi charges a transaction fee on completed shipments — ${FEES.shipper} for shippers and ${FEES.trucker} for truckers — with no subscription and no listing fee. Every party is scored on the same 300 to 900 freight credit scale, so a completed trip improves your standing for the next one.`,
    },
  ];
}

/** "rourkela-to-ranchi" -> "Rourkela To Ranchi", for guide cross-links. */
function titleCase(slug) {
  return String(slug)
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Contextual internal links shown under every injected content block. */
function relatedLinksFor(path, seoMeta) {
  if (seoMeta.type === 'route') {
    const links = [{ label: 'All freight routes', href: '/routes' }];
    const from = String(seoMeta.from || '').toLowerCase();
    for (const slug of Object.keys(ROUTE_DATA)) {
      if (slug === seoMeta.slug) continue;
      if (ROUTE_DATA[slug].from && ROUTE_DATA[slug].from.toLowerCase() === from) {
        links.push({ label: `${ROUTE_DATA[slug].from} to ${ROUTE_DATA[slug].to}`, href: `/routes/${slug}` });
      }
      if (links.length >= 4) break;
    }
    links.push({ label: 'Truck fare calculator', href: '/tools/fare-calculator' });
    return links;
  }
  if (seoMeta.type === 'location') {
    const links = [{ label: 'All freight routes', href: '/routes' }];
    const cityName = seoMeta.location ? seoMeta.location.name : '';
    for (const slug of Object.keys(LOCATION_DATA)) {
      if (slug === seoMeta.slug) continue;
      links.push({ label: `Freight in ${LOCATION_DATA[slug].name}`, href: `/location/${slug}` });
      if (links.length >= 4) break;
    }
    if (cityName) links.push({ label: `PTL transport in ${cityName}`, href: `/transport-service/${seoMeta.slug}` });
    return links;
  }
  if (seoMeta.type === 'transport-service') {
    return [
      { label: `Transport service in ${seoMeta.cityName}`, href: `/location/${seoMeta.slug}` },
      { label: 'All freight routes', href: '/routes' },
      { label: 'Freight rate calculator', href: '/tools/freight-rate-calculator' },
    ];
  }
  if (seoMeta.type === 'blog') {
    const links = [{ label: 'Logistics blog index', href: '/blog' }];
    for (const slug of Object.keys(BLOG_DATA)) {
      if (slug === seoMeta.slug) continue;
      links.push({ label: BLOG_DATA[slug].title, href: `/blog/${slug}` });
      if (links.length >= 3) break;
    }
    links.push({ label: 'All freight routes', href: '/routes' });
    links.push({ label: 'Freight rate calculator', href: '/tools/freight-rate-calculator' });
    links.push({ label: 'Contact the LoadSaathi team', href: '/contact' });
    return links;
  }
  if (seoMeta.type === 'guide') {
    const links = [{ label: 'All guides', href: '/blog' }];
    for (const slug of Object.keys(GUIDE_DATA)) {
      if (slug !== seoMeta.slug) links.push({ label: titleCase(slug), href: `/guide/${slug}` });
    }
    links.push({ label: 'PTL vs FTL calculator', href: '/tools/ptl-vs-ftl-calculator' });
    links.push({ label: 'All freight routes', href: '/routes' });
    return links;
  }
  return [
    { label: 'All freight routes', href: '/routes' },
    { label: 'Logistics blog', href: '/blog' },
    { label: 'Contact us', href: '/contact' },
  ];
}

const PLATFORM_CAPABILITIES = [
  'AI matching that scores every open load against available trips on capacity, proximity, route overlap and price',
  'Live GPS tracking from pickup to delivery, with expected arrival times and delivery confirmation',
  'A digital freight credit score from 300 to 900 built from completion rate, on-time delivery, communication, reviews and account tenure',
  'Escrow-backed payments released on milestones, with GST invoice inputs taken straight from the booking',
  'Bidirectional reviews, so shippers rate truckers and truckers rate shippers after every trip',
];

/** Hindi equivalents of PLATFORM_CAPABILITIES, so /hi/* pages read as one page. */
const HINDI_CAPABILITIES = [
  'AI मैचिंग: क्षमता, नज़दीकी, रूट ओवरलैप, कीमत और क्रेडिट स्कोर के आधार पर हर खुली लोड को उपलब्ध ट्रिप से जोड़ा जाता है',
  'पिकअप से डिलीवरी तक लाइव GPS ट्रैकिंग, अनुमानित पहुँच समय और डिलीवरी की पुष्टि',
  '300 से 900 तक का डिजिटल फ्रेट क्रेडिट स्कोर — ट्रिप पूरी करने की दर, समय पर डिलीवरी, संवाद, रिव्यू और खाते की अवधि से बनता है',
  'एस्क्रो आधारित भुगतान, जो बुकिंग से मिलने वाले GST इनपुट के साथ माइलेस्टोन पर जारी होता है',
  'दोतरफ़ा रिव्यू — हर ट्रिप के बाद शिपर ट्रकर को और ट्रकर शिपर को रेटिंग देता है',
];

/**
 * Extra Hindi copy for the /hi/* pages. Without it the static branch reuses the
 * English capability list, and a Hindi page ends up reading as two languages
 * stitched together.
 */
const HINDI_PAGE_NOTES = {
  '/hi/ptl-transport': 'पार्ट ट्रक लोड (PTL) यानी किसी और के ट्रक में जगह भाड़ा करना — एक ही ट्रक में एक से चार माल एक साथ चलते हैं। ईंधन, टोल और ड्राइवर की लागत सभी कार्गो में बँट जाती है, इसलिए पूरा ट्रक भाड़ा करने से लगभग 30–40% कम खर्च आता है। यह 0.5 से 3 टन तक के माल के लिए सही है। बदला यह है कि ट्रक पहले कई माल लेकर चलता है, इसलिए डिलीवरी में एक से दो दिन अतिरिक्त लग सकते हैं। जल्दी माल पहुँचाना हो तो फुल ट्रक बेहतर रहता है। LoadSaathi पर आप अपने माल की वज़न और आकार डालते हैं, और मैचिंग उसी के आधार पर उपयुक्त ट्रकर दिखाती है।',
  '/hi/return-load': 'डिलीवरी के बाद खाली वापसी का ट्रक भी ईंधन, ड्राइवर और टोल का पूरा खर्च चुकाता है, इसलिए खाली चलने वाला हर किलोमीटर सबसे महँगा व्यर्थ समय है। LoadSaathi पर वापसी के रास्ते की लोड ट्रिप शुरू होने से पहले ही दिखने लगती है — चाहे वह माल बाहर से आ रहा हो या उसी शहर की दूसरी मंडी के लिए जा रहा हो। सही समय पर पोस्टिंग और सही वाहन क्षमता दर्ज करने से मैचिंग तेज़ होती है। रिटर्न लोड भर लेने पर उसी ट्रिप का खर्च निकल जाता है, और क्रेडिट स्कोर भी बेहतर होता है, जिससे अगली बार मैच होने की प्राथमिकता मिलती है।',
  '/hi/bhada-kaise-book-kare': 'बिना दलाल के ट्रक बुक करने की प्रक्रिया चार कदमों में है: माल की असली वज़न, आकार और पैकिंग का तरीका दर्ज करें; लोड होने का पता, समय और डिलीवरी की तारीख भरें; कई सत्यापित ट्रकरों की दर, रेटिंग और क्रेडिट स्कोर एक साथ देखें; और जो वाहन सबसे सही लगे उसे बुक करें। बुकिंग के बाद GPS ट्रैकिंग चालू रहती है और पेमेंट एस्क्रो में तब तक रुकी रहती है जब तक डिलीवरी कन्फर्म न हो। दोनों पक्ष एक-दूसरे को रिव्यू देते हैं, इसलिए अगली बुकिंग का अनुभव बेहतर होता है। पहली बार का अनुभव हो तो पार्ट लोड से शुरू करना सबसे कम जोखिम वाला तरीका है।',
  '/hi/route/rourkela-to-ranchi': 'राउरकेला से रांची 180 किमी की दूरी पर है और यह NH-215 पर चलने वाली मुख्य लोड-करrying लेन है। पार्ट लोड लगभग ₹14–₹22 प्रति किलो, और पूरा ट्रक ₹15,300–₹21,600 के बीच चलता है। दोनों शहर औद्योगिक केंद्र हैं — राउरकेला इस्पात और सीमेंट, रांची कोयला और मशीनरी — इसलिए दोनों दिशाओं में माल रहता है, और वापसी का लोड मिलना आसान होता है। राउरकेला से कोयला, सीमेंट और इस्पात का सामान लोड होता है, जबकि रांची से मशीनरी पार्ट्स, खाद्य और FMCG माल उत्तर की ओर जाता है। शाम को निकलने वाली ट्रिप सुबह डिलीवरी तक पहुँच जाती है, इसलिए इस लेन पर समय का फ़ैसला रेट से ज़्यादा अहम है।',
};

/**
 * Legacy tool URLs still linked from older pages and blog copy. They resolve to
 * the same calculators, so they reuse the /tools/* detail rather than rendering
 * a thin duplicate page.
 */
const TOOL_ALIASES = {
  '/fare-calculator': '/tools/fare-calculator',
  '/freight-rate-calculator': '/tools/freight-rate-calculator',
  '/ptl-vs-ftl-calculator': '/tools/ptl-vs-ftl-calculator',
  '/truck-load-calculator': '/tools/truck-load-calculator',
  '/return-load-calculator': '/tools/return-load-calculator',
  '/transport-cost-calculator': '/tools/fare-calculator',
};

/**
 * Per-tool detail, keyed by the /tools/* path: the inputs the form asks for, how
 * the estimate is built, and where it stops being reliable — the three things a
 * freight calculator page owes a reader before they take the number to a carrier.
 */
const TOOL_DETAILS = {
  '/tools/fare-calculator': {
    inputs: 'origin and destination, cargo weight, and the date you need the truck',
    method:
      'Distance and driving time come from road routing rather than straight-line maths, then the estimate is built up per kilometre: diesel for the distance, a toll allowance for the vehicle class, and a per-kilogram charge on top for the cargo itself.',
    limits:
      'The result is an estimate for planning, not a carrier quote. Loading and unloading time, waiting at the destination, and any permit or escort charge are not included unless the quote says so, which is why two quotes for the same lane can differ by more than the fuel component suggests.',
  },
  '/tools/freight-rate-calculator': {
    inputs: 'origin, destination, weight, and whether the consignment is part load, LTL or a full truck',
    method:
      'The calculator returns a low and high figure rather than a single number, because on any Indian corridor the same movement prices differently depending on vehicle availability at the loading hour and how many trucks are already committed to that lane on the date.',
    limits:
      'A published band moves with diesel, toll revisions and monsoon disruption. Treat the output as the range a reasonable quote should sit inside, then compare real carriers against it.',
  },
  '/tools/ptl-vs-ftl-calculator': {
    inputs: 'cargo weight, volume, and how fixed the delivery date is',
    method:
      'Both curves are plotted against your weight: what a dedicated vehicle costs, and what your share of a consolidated one costs at the same weight. The point where they cross is the decision point.',
    limits:
      'The crossover assumes normal consolidation at the origin. A peak-season lane, a remote pickup, or a consignment that cannot share a vehicle with others will move that point in either direction.',
  },
  '/tools/truck-load-calculator': {
    inputs: 'cargo weight and cargo volume, in the units your shipment is actually measured in',
    method:
      'Weight and volume are scored separately against each Indian truck type, from a light commercial vehicle up to a tractor-trailer, so the report shows which of the two constraints binds first.',
    limits:
      'Volume is only as accurate as the figure you enter. Indian overloading is usually an axle and tyre problem rather than a cube problem, so a truck at 90% of its rated payload is already close to its legal limit even if the body looks half empty.',
  },
  '/tools/return-load-calculator': {
    inputs: 'the outbound lane and the empty return distance you want to price',
    method:
      'It costs the return leg as it would actually be run — fuel, driver time and tolls with nothing in the body — and then compares that against what a backhaul load would add to the same leg.',
    limits:
      'The empty-running figure is a cost, not a loss. Whether filling a return leg is worth accepting a lower outbound rate depends on how far the truck would otherwise have to travel empty to reach the next load.',
  },
  '/tools/route-optimizer': {
    inputs: 'an origin and up to six stops',
    method:
      'It returns the road distance and driving time for the stop order it recommends, so backtracking can be compared against the sequence you would otherwise have driven.',
    limits:
      'It sequences stops; it does not book them, and it does not model delivery windows, vehicle capacity or driver hours. Use it to fix the order, then confirm timings against real appointments.',
  },
  '/tools/empty-km-savings': {
    inputs: 'a lane and the distance your trucks currently run empty',
    method:
      'It prices deadhead kilometres as what they are — fuel, driver wages and tolls paid for in full and earned on nothing — then compares that against the return load that would occupy the same kilometres.',
    limits:
      'The saving is only realised if a load is actually available and accepted on the return. Availability depends on cargo cycles at the destination, which is why return postings go out before the outbound trip rather than after it.',
  },
  '/tools/trip-profit': {
    inputs: 'freight revenue, and the cost lines you want to charge against it',
    method:
      'Diesel, tolls, driver pay, food and lodging, a tyre and maintenance reserve, and the commission paid to find the load are all subtracted, so the number left is the one that reaches the account rather than the one on the invoice.',
    limits:
      'Maintenance reserves are a judgement call. Under-reserving turns a profitable month into a cash-flow problem when a tyre or clutch is due, so treat the reserve line as something to size deliberately.',
  },
  '/tools/shared-savings': {
    inputs: 'cargo weight and the lane, priced both ways',
    method:
      'The same consignment is costed alone in a dedicated vehicle and sharing space with other consignments, then the fuel and carbon difference between the two is shown alongside the money.',
    limits:
      'Consolidation adds handling and a longer transit, and part of the price difference is the shipper buying the carrier a longer, denser run. If the delivery date cannot move, the time cost is usually larger than the saving.',
  },
  '/tools/document-checklist': {
    inputs: 'a route, a vehicle type and a commodity',
    method:
      'It generates the papers that route and vehicle combination actually needs — registration, permit, fitness, insurance, e-way bill and driver papers — so a missing document is found at the office rather than at a check post.',
    limits:
      'Requirements vary by state and by the commodity carried. Treat the list as a starting point and confirm the state-specific entries before a vehicle leaves the yard.',
  },
  '/tools/carbon-savings': {
    inputs: 'distance, load factor, and how much of the run is empty',
    method:
      'Freight emissions follow the same arithmetic as freight cost. Consolidating consignments raises the load factor, and filling a return leg removes distance entirely, so both are converted into kilograms of CO2.',
    limits:
      'Emission factors are averages for a vehicle class and fuel, not measurements of your specific truck. The comparison is sound; the absolute number should be read as an order of magnitude.',
  },
  '/tools/toll-fuel': {
    inputs: 'the lane and the truck type',
    method:
      'Fuel and tolls are broken out separately per kilometre for that vehicle class, because they are the two line items that move between quotes without anything about the cargo changing.',
    limits:
      'Toll rates are revised periodically and fuel prices move daily, so re-run the estimate close to the travel date rather than carrying a figure forward from an earlier quote.',
  },
  '/tools/gst-calculator': {
    inputs: 'the invoice amount and the origin and destination states',
    method:
      'Freight attracts GST at a different rate from most goods, and the correct split depends on whether the supplier and the recipient are in the same state. The calculator returns the IGST or the CGST plus SGST breakdown for the transport bill.',
    limits:
      'This splits a transport invoice only. It does not compute the e-way bill, decide whether a supply is inter-state for your specific case, or cover exempt or nil-rated categories.',
  },
  '/tools/payload-utilization': {
    inputs: 'cargo weight and volume against a chosen truck type',
    method:
      'Weight and volume utilisation are reported separately against the rated capacity, because a truck can be full by one measure and half empty by the other.',
    limits:
      'Rated capacity in a certificate assumes the vehicle is properly loaded and the route is legal. Utilisation above the rated figure is overloading, whatever the body looks like.',
  },
};

const TOOL_LINKS = [
  { label: 'Truck fare calculator', href: '/tools/fare-calculator', note: 'per-km and per-kg freight estimates for any Indian corridor' },
  { label: 'Freight rate calculator', href: '/tools/freight-rate-calculator', note: 'PTL, LTL and FTL rate ranges with a recommended truck type' },
  { label: 'PTL vs FTL calculator', href: '/tools/ptl-vs-ftl-calculator', note: 'which load type is cheaper at your weight and timeline' },
  { label: 'Truck load calculator', href: '/tools/truck-load-calculator', note: 'which Indian truck fits your cargo weight and volume' },
  { label: 'Toll and fuel cost calculator', href: '/tools/toll-fuel', note: 'trip tolls and diesel cost before you book' },
  { label: 'GST on freight calculator', href: '/tools/gst-calculator', note: 'IGST or CGST plus SGST split for a transport invoice' },
];

/** Category-specific guidance for blog posts that ship without their own FAQ. */
const CATEGORY_GUIDANCE = {
  "Trucker Tips": "For a truck owner, the practical version of this comes down to three things: post the trip before you start loading so the return leg is visible early, keep the vehicle's declared capacity and equipment accurate so the matcher can place the right cargo against it, and accept shared space when a full return is not available, because a part load still covers most of the fuel for that leg. Build your credit score as you go — it is the cheapest way to get matched first on a busy lane.",
  'Shipper Guide': 'For a shipper, the useful habit is to publish the load with the real weight, volume, packaging and loading window rather than a rounded figure. Accurate cargo data is what lets the matcher shortlist trucks that actually suit the consignment, and it is what turns a quote comparison into a real booking. Decide PTL or FTL before you post: it changes the rate, the transit time and the vehicle type you will be matched against.',
  'Freight Rates': 'Rates on Indian corridors move with diesel, toll revisions, monsoon disruption and how many trucks are running empty in the opposite direction. Treat any published band as a reference rather than a quote: compare at least three options on the same day, confirm the inclusions in writing, and check whether the rate covers loading, unloading and waiting time or only the line-haul.',
  "Compliance": "Indian goods transport documentation is not optional, and gaps are the most common cause of a consignment being held at a check post. Keep the registration certificate, permit, fitness certificate, insurance and the driver's papers with the vehicle, and make sure the e-way bill matches the invoice. Booking data entered on LoadSaathi — cargo description, weight and shipper details — is exactly what the e-way bill needs, so fill it in once at the start rather than reconstructing it later.",
  'Freight Guide': 'Choosing between part load, less-than-truckload and a full truck is mostly a question of weight, volume and how fixed the delivery date is. Under about three tonnes, sharing a truck normally wins on cost; above roughly seven tonnes, or when the date cannot move, a dedicated vehicle wins on both cost and time. Everything else — packaging, lashing, insurance for high-value cargo — is decided by what you are carrying.',
  "Freight Strategy": "Freight cost is usually the second largest line in an MSME's operating budget, and the first thing to improve is visibility rather than negotiation. Know your shipped weight per lane, your average rate per kilometre, and how much of your truck capacity you actually fill. Once those three numbers are stable month to month, rate conversations become straightforward because you are comparing against your own history rather than a broker’s number.",
  'Route Guide': 'On a corridor, the levers that matter are departure time, load type and how much of the return leg you fill. Leaving a dense city in the evening and running overnight usually beats a mid-morning departure, because it puts the vehicle at the destination for an early morning delivery and avoids the worst of the day’s congestion. On the way back, check for a posted load before you start loading again.',
  'Industry Insights': 'Indian road freight is still dominated by small operators running one or two vehicles, which is why a digital load board changes the economics more than the technology suggests. The constraint on this network has never been finding cargo at the destination; it has been not knowing what is available until the truck is already empty. Pairing a live load board with a public credit score addresses both sides of that problem.',
  'Industry Guide': 'Freight data is only useful when it is specific enough to act on. National averages hide the variation that actually moves a rate: distance, cargo type, vehicle availability at the origin, and how many trucks are running empty in the opposite direction. Read lane-level numbers, and compare them against your own shipments before treating any published rate as a target.',
  'Case Study': 'Read these numbers against your own operation rather than taking them as a benchmark. The useful questions are always the same: what was the shipment mix, which lanes carried the volume, and what changed — vehicle utilisation, route planning, or the rate at which loads were booked. A result that depends on one of those three can be reproduced; one that depends on volume you do not have cannot.',
  'Product Updates': 'Product changes land on both sides of the marketplace, so it is worth checking what is new before a booking window. Shippers get updated quoting, tracking and payment flows; truckers get better matching and settlement. If something on this page changes how you work, it usually shows up first in the app and in the help centre, with the old behaviour kept available for a transition period.',
  default: 'Whichever lane you are working, the same three numbers decide the cost: the distance, how much of the vehicle you fill, and how many trucks are running empty in the opposite direction. Those three move the rate far more than negotiation does. Publish the real weight and volume on a booking, compare part load against a full truck on the same figures, and post the trip before loading so the return leg is on screen while the decision is still open.',
};

/**
 * Closing copy for guides that ship steps but no FAQ. Cost travels the same per
 * km whatever the cargo, so the real question on a goods route is which vehicle
 * class ends up doing the carrying.
 */
const GENERIC_GUIDE_NOTE = 'Before a vehicle is committed, the cost of the movement is worth breaking into the parts that move and the parts that do not. Distance, fuel and tolls are the same for any cargo on a given lane; what changes with the cargo is the vehicle it needs and how carefully it has to be secured, and that is where a cheap rate turns into an expensive trip. LoadSaathi matches on capacity, route overlap and price alignment, so declaring the real weight and volume on the booking is what puts a correctly sized vehicle against the load. Comparing part load against a full truck on the same numbers, before deciding, is usually worth more than negotiating a few percent on a rate that was built on the wrong vehicle.';


const STATIC_FAQ = {
  '/': [
    { q: "What is LoadSaathi and who uses it?", a: "LoadSaathi is a road freight marketplace for East India. Shippers post loads and truckers post trips, and a matching engine pairs the two. Joining is free for both sides; a completed shipment carries a transaction fee of 1.5-3% for shippers and 1.5-2.5% for truckers." },
    { q: "How much does it cost to ship with LoadSaathi?", a: "There is no listing fee, no subscription and no charge for a booking that is never completed. Shippers pay 1.5-3% of the shipment value on a completed shipment and truckers pay 1.5-2.5%. The fee covers matching, live tracking, the freight credit score, escrow-backed payment and support." },
    { q: "Which cities and corridors are covered?", a: "Coverage today is concentrated on the industrial belt of Odisha, Jharkhand, West Bengal and coastal Andhra Pradesh: Rourkela, Bhubaneswar, Cuttack, Sambalpur, Angul, Balasore, Berhampur, Paradip, Ranchi, Dhanbad, Jamshedpur, Kolkata, Burdwan and Visakhapatnam, with published corridor pages between them." },
    { q: "Can I track my truck once the booking is confirmed?", a: "Yes. GPS tracking runs from pickup to delivery on every confirmed booking, with an expected arrival time and a delivery confirmation step. The counterparty sees the live location for the duration of the trip; it is not published." },
  ],
  '/features': [
    { q: "What does the freight credit score actually measure?", a: "A score from 300 to 900, weighted across completion rate, on-time delivery, communication quality, review ratings and account tenure. A high score is earned by finishing trips well rather than by volume, and it is public, so both sides can see what they are dealing with before they commit." },
    { q: "How does matching decide which truck fits my load?", a: "Every open load is scored against available trips on capacity fit, proximity, route overlap, price alignment, date and counterparty rating, then ranked. The score is shown with the shortlist, so you can see why a vehicle was surfaced rather than taking the ranking on trust." },
    { q: "Are payments held until delivery?", a: "Yes. Payment sits in escrow and is released against agreed milestones rather than to either party on delivery day. The booking also captures the cargo, weight and shipper details that the GST e-way bill needs, so the paperwork comes from the same record as the movement." },
    { q: "Can both sides rate each other?", a: "Reviews run in both directions after every trip. That is deliberate: a marketplace where one side always reviews the other gives the reviewed side no reason to protect the counterparty." },
  ],
  '/how-it-works': [
    { q: "How do I post a load as a shipper?", a: "You enter weight, volume, origin, destination, cargo description and the loading window. Matching then scores the load against available trips and returns a ranked shortlist with the reason for each match, and you accept the vehicle that suits the consignment." },
    { q: "How do I post a trip as a trucker?", a: "You enter vehicle type, available capacity, origin, destination and departure date. Loads that fit your lane and capacity surface against the trip, ranked on route overlap, timing, capacity fit and the shipper’s credit standing, so the return leg is visible before you load." },
    { q: "What happens after a booking is confirmed?", a: "Live tracking starts at pickup, payment is held in escrow and released on milestones, and both sides review each other at the end. The same flow applies to a part load and a full truck; only the vehicle and rate differ." },
  ],
  '/pricing': [
    { q: "Is there a subscription or listing fee?", a: "No. Joining is free, there is no listing fee and there is no charge for a booking that is never completed. The only charge is a transaction fee on a completed shipment: 1.5-3% for shippers and 1.5-2.5% for truckers." },
    { q: "What does the transaction fee cover?", a: "Matching, live GPS tracking, the digital freight credit score, escrow-backed payments and support. There is no separate charge for the calculators, the credit score, or contacting a counterparty." },
    { q: "Do you offer volume rates?", a: "Regular shippers and fleet operators can ask the team for a rate card. Published percentages are the default; a negotiated rate applies to the volume, not to individual bookings." },
    { q: "How do I get a GST invoice?", a: "The booking captures cargo description, weight and shipper details, which are the same inputs the e-way bill needs. The transport invoice is raised against the completed shipment, and the GST calculator on the site will show you the IGST or CGST plus SGST split for a given origin and destination." },
  ],
  '/routes': [
    { q: "How many freight corridors are published?", a: "Each corridor page carries distance, driving time, a published rate band, the truck types that run the lane and the questions shippers ask about it. Distances and durations come from road routing rather than straight-line calculation, so they reflect the actual driving distance." },
    { q: "What is the difference between PTL and FTL?", a: "Part load shares space in a truck someone else is already paying for, which suits consignments up to about three tonnes and normally costs 30-40% less per tonne, at the cost of a longer transit. A full truck gives exclusive use and the shortest transit, which normally wins above roughly seven tonnes or whenever the delivery date is fixed." },
    { q: "Can I find a truck for a lane not listed here?", a: "Post the load with the origin and destination and the matcher works against live availability rather than a fixed route table. A corridor page is published where the lane carries enough traffic to describe it properly." },
  ],
  '/blog': [
    { q: "What does the LoadSaathi blog cover?", a: "Freight strategy, corridor rates, compliance and platform changes. Trucker tips sit alongside shipper guides and industry analysis because a marketplace only works when both sides can see the same numbers. Every article carries an author, a date and a last-updated date." },
    { q: "Are the published rates quotes?", a: "They are reference bands, not quotes. A rate moves with diesel, toll revisions, monsoon disruption and how many trucks are running empty in the opposite direction, so treat a published figure as the range a reasonable quote should sit inside and compare at least three options on the same day." },
    { q: "How often are the articles reviewed?", a: "Rate and compliance articles carry a last-updated date and are revised when the underlying numbers or rules change. Platform articles are updated when the product changes how a booking works." },
  ],
  '/faq': [
    { q: "When is payment released to the trucker?", a: "Payment sits in escrow from booking and is released against agreed milestones rather than on a single delivery-day settlement, so a trucker is not carrying the whole float of a trip. The release points are set on the booking." },
    { q: "What happens if a trucker cancels?", a: "The booking is reopened for matching and the cancellation is recorded against the trucker’s credit standing, which weighs completion rate and on-time delivery. A repeated pattern shows up in the score that shippers see before they accept a bid." },
    { q: "Which documents must a vehicle carry?", a: "Registration certificate, permit, fitness certificate, insurance and the driver’s papers travel with the vehicle, and the e-way bill must match the invoice. The document checklist tool generates the list for a specific route, vehicle type and commodity." },
    { q: "How is a trucker verified?", a: "KYC is completed before a trucker can bid, covering licence and vehicle documents. Alongside that, every trip feeds the freight credit score, so verification is a starting position rather than the whole reputation." },
  ],
  '/safety-trust': [
    { q: "What stops a truck from being unverified?", a: "KYC must be completed before a trucker can bid, covering licence and vehicle documents. Reviews and the credit score then keep the standing honest after that, because both are updated by the trips that actually happen." },
    { q: "How is a payment held?", a: "Escrow-backed payments release only against agreed milestones, so neither side can walk away from a completed leg without the other being exposed. A dispute holds the balance rather than letting either side withdraw it." },
    { q: "Who can see the live location of my truck?", a: "The counterparty on the booking, for the duration of the trip. It is not published and not exposed as a public feed." },
  ],
  '/compare': [
    { q: "How is LoadSaathi different from Vahak, BlackBuck, Trukky or Porter?", a: "Mostly in network shape and settlement. Enterprise load boards optimise for large shippers with dedicated fleets. LoadSaathi is built for MSMEs, first-time shippers and owner-driver truckers on East India corridors, with free joining, a per-transaction fee and a public credit score that works for an operator running a single vehicle." },
    { q: "Does LoadSaathi charge a commission per truck?", a: "No. The published fee is a percentage on a completed shipment — 1.5-3% for shippers and 1.5-2.5% for truckers — and there is no listing fee or subscription on either side." },
    { q: "Can I still work with a broker?", a: "Yes. A lot of the value on an unmanaged lane is visibility: what is moving out of the destination, and what is running empty in the opposite direction. Use the marketplace for the lane you cannot cover and a broker for the rest." },
  ],
  '/for-msmes': [
    { q: "What changes freight cost for a small business?", a: "Three things move the number more than rate negotiation does: shipping small consignments as part loads instead of booking whole vehicles, comparing more than one rate on the same morning rather than accepting the first quote, and filling the return leg so the lane costs less per kilometre in both directions." },
    { q: "Do the calculators need an account?", a: "No. The freight rate, toll and fuel, and GST calculators are all free to use without signing in." },
    { q: "Is escrow-backed payment workable for a small shipper?", a: "Yes, and it is usually the reason small shippers are cautious about paying a stranger online. The balance is held and released on milestones rather than paid up front to an unverified counterparty." },
  ],
  '/tools': [
    { q: "Can I use the calculators without an account?", a: "Yes. Every calculator on this page is free and needs no sign-in. Each one returns an estimate from the inputs you provide rather than a live carrier quote, and the same input values can be used to post a load or a trip for real quotes." },
    { q: "Which calculator should I start with?", a: "The fare calculator for a lane you already know, then the truck load calculator to check whether the volume fits the vehicle you had in mind. The PTL versus FTL calculator settles the load-type question once you have a weight, and the toll and fuel calculator explains the gap between two quotes for the same cargo." },
    { q: "Can I use these estimates in a budget?", a: "Yes, as a planning range. The calculators separate the components — distance, fuel, tolls, and the cargo charge — so you can see which part of a quote is moving and defend the number with arithmetic rather than assertion." },
  ],
  '/data': [
    { q: "Where do these figures come from?", a: "The numbers are corridor-level and derived from road routing for distance and duration, published rate bands for the pricing side, and the operating conditions of each city. They are not national averages, because national averages hide the variation that actually moves a rate." },
    { q: "How often is this data updated?", a: "Distance and duration are computed on the server rather than stored, so they stay in step with the routing data. Rate bands are reviewed against current lane conditions and carry a last-updated date on the page." },
    { q: "Why do rates differ so much between lanes?", a: "Distance, cargo type, vehicle availability at the origin and the share of trucks running empty in the opposite direction explain most of the variation between two quotes for the same lane. Availability is the one that moves fastest." },
  ],
  '/gallery': [
    { q: "Is this the web app or the Android build?", a: "Both, and they share the same data. The screens shown are the role-based dashboard, the matching screen with confidence scores and trucker profiles, shipment chat with read receipts, the freight credit score with its factor breakdown, and the bidirectional review flow." },
    { q: "Does the app work offline?", a: "The interface detects connectivity loss and tells you when you are offline rather than failing silently. Booking and tracking actions need a connection; anything already loaded stays readable." },
    { q: "Can I try the platform before creating an account?", a: "Yes. The calculators on the free tools pages run without signing in, so you can price a lane and check the cost of a booking before deciding whether to register. Registering is free on both sides, and no fee applies until a shipment actually completes." },
  ],
  '/terms': [
    { q: "Is LoadSaathi a lender or a financial intermediary?", a: "No. LoadSaathi is a road freight marketplace. It connects shippers and truckers, and escrow-backed payment holds a balance against agreed milestones; it is not a lender, a broker of credit, or a financial services provider." },
    { q: "Who is allowed to use the platform?", a: "Any shipper with a consignment to move and any trucker with a vehicle and a licence to present. Truckers complete KYC before they can bid, and both sides carry a public credit score from the trips they complete." },
    { q: "What happens in a dispute?", a: "The balance is held rather than released, and the dispute is worked through with both parties. Repeated disputes and cancellations feed the credit score that the other side sees before accepting a bid." },
  ],
  '/freight-marketplace': [
    { q: "Is LoadSaathi a broker?", a: "No, and that is the whole structure of the fee. There is no agent taking a cut in the middle: the published fee is 1.5-3% for shippers and 1.5-2.5% for truckers on a completed shipment, paid to the platform rather than extracted as a margin on the rate." },
    { q: "How do I find a carrier for a one-off shipment?", a: "Post the load and browse the other side’s open postings. You can filter by lane, capacity and date and sort on credit standing before you commit, so a first-time shipper is not forced to take the first quote offered." },
    { q: "How does a trucker find work without waiting at a gate?", a: "Post the trip first. Loads that fit the lane and available capacity surface against it, ranked on route overlap, timing, capacity fit and the shipper’s credit standing — which is what makes the return leg visible before the truck commits to the outbound leg." },
  ],
  '/solutions/shippers': [
    { q: "What does a shipper get that a broker does not give?", a: "The rate you agree is the rate you pay; the only addition is the 1.5-3% transaction fee. You also get to compare several verified truckers on rate, vehicle type, credit score and rating rather than accepting a single quote, and you see the live vehicle location until delivery." },
    { q: "How does the booking help with GST paperwork?", a: "Cargo description, weight and shipper details are captured at booking, which are the same inputs the e-way bill needs. The transport invoice is raised against the completed shipment rather than reconstructed afterwards." },
    { q: "Can a first-time shipper see who they are dealing with?", a: "Yes. The freight credit score from 300 to 900 and the review history are public before you accept, so the standing of the counterparty is visible at the point of decision." },
  ],
  '/solutions/truckers': [
    { q: "What stops an owner-driver from running empty?", a: "Posting the trip before loading. The matcher then looks for loads that fit the lane, capacity and date, which puts the return leg on screen while the outbound decision is still open rather than after the truck is already empty." },
    { q: "When do I get paid?", a: "On milestones rather than on delivery day, so cash flow is not tied to a single delivery window. The balance is held in escrow from booking and released as agreed steps are met." },
    { q: "Do I need my own sales team?", a: "No. Counterparties filter on credit score and rating, both of which are maintained by completed trips, so a good record does the work that a relationship would otherwise do. Joining is free and the transaction fee is 1.5-2.5% on a completed shipment." },
  ],
  '/ltl-transport': [
    { q: "How is LTL different from part load?", a: "Less-than-truckload is the structured version of part load. Consignments are consolidated into one vehicle and each is charged for the space it occupies rather than for the whole truck, with the consolidation point and drop sequence set before loading so the extra handling is planned rather than improvised." },
    { q: "When does a regular LTL schedule beat a spot rate?", a: "When you ship the same lanes often enough. Scheduling a weekly run turns a higher per-kilogram rate into a lower total cost, because the vehicle is committed and the drop count is known before the day starts." },
    { q: "What is the LTL weight threshold?", a: "Under about three tonnes, sharing a vehicle normally costs less than hiring a dedicated one. Above roughly seven tonnes, or when the delivery date cannot move, a full truck wins on both cost and time." },
  ],
  '/truck-load-booking': [
    { q: "When should I book a full truck instead of part load?", a: "Above roughly seven tonnes, or whenever the delivery date is fixed. A full truck gives exclusive use of the vehicle, a direct point-to-point run and the shortest transit of the three options, which is usually worth the difference in rate." },
    { q: "How is an FTL quote built?", a: "Quotes come back per vehicle with the truck type named, so the comparison is between like things. The booking takes the pickup and drop addresses, the cargo weight and dimensions, and the loading window." },
    { q: "Does tracking stay live on a full truck load?", a: "Yes. Tracking runs until delivery is confirmed, and payment is released on milestones rather than at a single delivery-day settlement." },
  ],
  '/ai-logistics': [
    { q: "What is automated on LoadSaathi?", a: "Matching pairs open loads to available trips on capacity, proximity, route overlap, price and counterparty rating rather than on a keyword search. Pricing uses distance, cargo type, vehicle availability and a diesel reference to suggest a band instead of a fixed number. Routing uses OSRM road data for distance and duration, so estimates sit on real roads rather than straight lines." },
    { q: "Does the matching replace the shipper’s judgement?", a: "No. It ranks and explains. The score is shown with each result, so the shortlist can be argued with — a lane you know runs differently or a cargo that cannot share a vehicle are both things the matcher cannot see." },
    { q: "Where does the price suggestion come from?", a: "Distance, cargo type, vehicle availability at the origin and a live diesel reference, which is why it returns a band rather than a number. A carrier quote can legitimately sit inside or outside that band, and both cases are worth checking against the calculator inputs." },
  ],
  '/ptl-transport': [
    { q: "What weight limit applies to a part load?", a: "Part load suits consignments up to about three tonnes, and normally costs 30 to 40% below hiring the same vehicle outright because the diesel, toll and driver cost is shared with one to four other cargoes. Above roughly seven tonnes, a full truck normally wins on both cost and time." },
    { q: "How much longer does part load take?", a: "Consolidation at origin and multiple drops add hours, and on some lanes a day. That is the trade: a lower rate per tonne against a delivery window that is less certain. Urgent cargo, and cargo that cannot be handled alongside other freight, is better served by a full truck." },
    { q: "Can I see who else is in the vehicle?", a: "No. Consolidators do not share the manifest, and a part load cannot be booked on the assumption that it will be. What the platform does show is the vehicle type, the declared capacity and the counterparty credit score, which is what determines whether your consignment is suitable for a shared run at all." },
    { q: "How is the part load rate calculated?", a: "Typically per kilogram, with the band moving on distance, cargo type and vehicle availability at the origin. The freight rate calculator returns a low and high range per kilogram and per kilometre on the same inputs, so a quote can be tested against what the lane should cost before it is accepted." },
  ],
  '/return-load': [
    { q: "When should a trucker post a trip to find a return load?", a: "Before loading, not after delivery. The value of a return load is in deciding the outbound trip differently — taking a lane that has cargo available at the far end, or accepting a slightly lower outbound rate in exchange for a filled return. Once the truck is empty at the destination, the choice has already been made." },
    { q: "How do I find loads in the direction I am heading?", a: "Post the trip with the return lane and date. Loads that fit the route, capacity and timing surface against it, ranked on route overlap, capacity fit and the shipper’s credit standing. The return-load calculator prices the empty leg as fuel, driver time and tolls so you can compare that against what a backhaul would add." },
    { q: "Is it worth taking a low-rate return load?", a: "Often, but not always. A return load that covers most of the fuel and toll for that leg turns a fixed cost into revenue, which is usually the single largest lever in an owner-driver’s cost per kilometre. It is worth checking the rate against the empty-running cost rather than comparing it to the outbound rate." },
  ],
  '/truck-near-me': [
    { q: "How do I find a truck for a specific city?", a: "Filter rather than search: available space against your cargo weight, departure date against your loading window, and the counterparty’s credit standing. Post the load with the exact origin rather than an area, because a truck available in one part of a city is not necessarily available to your gate." },
    { q: "Why are trucks returning empty listed first?", a: "Because a truck running empty out of your city on a return leg is normally the cheapest option available to you, and often the only same-day one. Both sides of the marketplace surface those loads first when the date is close." },
    { q: "Can I book a truck for tomorrow morning?", a: "Sometimes. Same-day availability depends on what is running empty nearby, which is why date filtering matters more than distance here. If nothing suitable appears, posting the load still reaches truckers planning the next few days rather than only those free right now." },
  ],
  '/hi': [
    { q: "LoadSaathi पर भुगतान कैसे होता है?", a: "भुगतान एस्क्रो में रुका रहता है और तय किए गए माइलेस्टोन पर जारी होता है, इसलिए डिलीवरी के दिन एक ही बड़ी रकम किसी एक को देना नहीं पड़ता। बुकिंग में माल का विवरण, वज़न और शिपर की जानकारी दर्ज होती है, जो GST e-way bill के लिए भी यही इनपुट होते हैं।" },
    { q: "क्या शिपर और ट्रकर दोनों को फ़ीस देनी होती है?", a: "जुड़ना दोनों के लिए फ्री है — कोई सदस्यता या लिस्टिंग फ़ीस नहीं। सिर्फ़ पूरा होने वाली शिपमेंट पर लेनदेन शुल्क लागू होता है: शिपर के लिए 1.5–3% और ट्रकर के लिए 1.5–2.5%।" },
    { q: "ट्रक का लाइव लोकेशन कौन देख सकता है?", a: "बुकिंग पर लगे दूसरे पक्ष को — यानी शिपर या ट्रकर, और वह ट्रिप चलने तक के लिए। लोकेशन सार्वजनिक नहीं होता।" },
    { q: "क्रेडिट स्कोर कैसे बनता है?", a: "300 से 900 के बीच का स्कोर ट्रिप पूरी करने की दर, समय पर डिलीवरी, संवाद, रिव्यू और खाते की अवधि से बनता है। यह सार्वजनिक है, इसलिए बुकिंग से पहले ही दूसरे पक्ष की स्थिति दिख जाती है।" },
  ],
};

const STATIC_CONTENT_NOTES = {
  '/': `LoadSaathi is a two-sided freight marketplace: shippers post loads, truckers post trips, and the matching engine pairs them. Coverage today is ${COVERAGE.freightRoutes} published freight corridors across Odisha, Jharkhand, West Bengal and Andhra Pradesh, ${COVERAGE.cityPages} city pages, and ${COVERAGE.sitemapUrls} indexable pages in total. Joining is free for both sides; a completed shipment carries a ${FEES.shipper} transaction fee for shippers and ${FEES.trucker} for truckers.`,
  '/about': `LoadSaathi was founded at NIT Rourkela out of the Foundation for Technology and Business Incubation, with the working assumption that most of the cost of moving goods in East India is paid twice — once for the truck that arrives loaded, and again for the same truck returning empty. The registered office is ${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.region} ${ADDRESS.postalCode}. Support runs on ${EMAIL} and ${PHONE_DISPLAY}.`,
  '/pricing': `The economics are deliberately flat: joining LoadSaathi is free, there is no listing fee, no subscription, and no charge for a booking that is never completed. Shippers pay a ${FEES.shipper} platform fee on completed shipments and truckers pay ${FEES.trucker}. That fee covers matching, live tracking, the digital freight credit score, escrow-backed payments and support. Volume discounts apply to regular shippers and fleet operators — ask the team for a rate card.`,
  '/how-it-works': `A booking runs the same way on both sides. A shipper posts weight, volume, origin, destination and loading window; a trucker posts the vehicle, available capacity and the lane it is running. The matching engine scores every open pair on capacity fit, proximity, route overlap, price alignment, date and counterparty rating, then surfaces the ranked shortlist. After a booking is confirmed the shipment is tracked live, payment is released on milestones, and both sides review each other.`,
  '/features': `Every participant is scored on the same 300 to 900 freight credit scale, weighted across completion rate, on-time delivery, communication quality, review ratings and account tenure — so a high score is earned by finishing trips well rather than by volume alone. Reviews run in both directions, which is what keeps the incentives honest on a marketplace where one side holds the cargo and the other holds the vehicle.`,
  '/safety-trust': `Trust on this platform is enforced at four points: trucker KYC before a trucker can bid, live GPS on every confirmed booking so both sides always know where the vehicle is, escrow-backed payments that release only on agreed milestones, and a dispute process that holds the balance rather than letting either side walk. High-value consignments can be booked with an insurance option noted in the booking itself.`,
  '/faq': `The questions shippers ask most are about payment release, GST invoices and what happens if a trucker cancels. The questions truckers ask most are about how fast they get paid, whether returning empty is avoidable, and how the credit score moves. Both sets are answered on this page, along with the platform fees and the documents a vehicle must carry on an Indian goods route.`,
  '/compare': `The honest comparison with Vahak, BlackBuck, Trukky and Porter comes down to network shape and settlement. Enterprise load boards optimise for large shippers with dedicated fleets; LoadSaathi optimises for MSMEs, first-time shippers and owner-driver truckers on East India corridors, with a free joining model, per-transaction fees and a public credit score that works for an operator running a single vehicle.`,
  '/for-msmes': `MSMEs are the group LoadSaathi is built for. The three changes that move the number are shipping small consignments as part loads instead of booking whole vehicles, comparing more than one rate on the same morning rather than accepting the first quote, and filling the return leg so the lane costs less per kilometre in both directions. Freight rate calculator, toll and fuel calculator, and the GST calculator are all free to use without an account.`,
  '/ai-logistics': `Three things are automated on LoadSaathi. Matching pairs open loads to available trips on capacity, proximity, route overlap, price and counterparty rating rather than on a keyword search. Pricing uses distance, cargo type, vehicle availability and a live diesel reference to suggest a band instead of a fixed number. Routing uses OSRM road data for distance and duration, which is what keeps the estimates on real roads rather than straight lines.`,
  '/data': `The numbers on this page are corridor-level, not national averages, because that is the level at which a rate actually moves. Distance, cargo type, vehicle availability at the origin and the share of trucks running empty in the opposite direction explain most of the variation between two quotes for the same lane. Current coverage: ${COVERAGE.freightRoutes} freight corridors and ${COVERAGE.cityPages} city pages with their own distance and rate tables.`,
  '/routes': `Every corridor page carries the same fields: distance, driving time, published rate band, truck types that run the lane, and the questions shippers actually ask about it. Distances and durations come from road routing rather than straight-line calculation, so they reflect the real driving distance. Coverage is ${COVERAGE.freightRoutes} corridors today, weighted towards the steel, coal, cement and agricultural lanes of East India.`,
  '/blog': `The blog covers freight strategy, corridor rates, compliance and platform changes. Trucker tips sit alongside shipper guides and industry analysis because a marketplace only works when both sides can see the same numbers. Every article is written or reviewed by the LoadSaathi team, dated, and linked to the route, city and calculator pages where you can act on it.`,
  '/contact': `Support answers on booking status, payments, documents and partnerships. Email reaches ${EMAIL}; the phone line is ${PHONE_DISPLAY}. The registered office is ${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.region} ${ADDRESS.postalCode}. For a route or rate question it is fastest to send origin, destination, cargo weight and the date you need the truck, because that is exactly what the platform needs to quote it.`,
  '/privacy': `LoadSaathi collects the account details a booking requires — name, email, phone, company, and for truckers the KYC documents needed to verify a licence and vehicle — plus the operational data a shipment generates: pickup and drop addresses, cargo description and weight, vehicle location while a trip is live, and the reviews and credit inputs a participant produces. Live GPS is shown to the counterparty on the booking for the duration of the trip and is not exposed publicly.`,
  '/terms': `The marketplace terms cover who may use the platform, what a shipper must provide for a load to be bookable, what a trucker must provide for a vehicle to be listed, how escrow-backed payment is released, how cancellations and disputes are handled, and how the freight credit score may be used. Freight services on LoadSaathi are a road transport marketplace — LoadSaathi is not a lender, broker of credit, or financial services provider.`,
  '/tools': `All ${TOOL_LINKS.length} tools are free and need no account. They cover the decisions that have to be made before a booking: what a lane costs, whether part load or a full truck is cheaper, which truck fits the cargo, what the tolls and diesel will run to, what GST applies to the invoice, and what documents the vehicle has to carry. Each returns an estimate from the inputs you provide, not a live carrier quote.`,
  '/return-load': `A truck that finishes a delivery empty has already paid for its fuel, its driver's time and its tolls. Finding a posted load for that same return leg turns a fixed cost into revenue, and it is the single largest lever in an owner-driver's cost per kilometre. LoadSaathi posts loads ahead of the vehicle reaching the destination, filters them by lane and date, and scores matches on the truck's available capacity and the shipper's credit standing.`,
  '/ptl-transport': `Part load means booking space in a truck someone else is already paying for. The consignment travels with one to four other cargoes, so the diesel, toll and driver cost is shared across all of them — typically 30 to 40% below hiring the same vehicle outright. It suits consignments up to about three tonnes. The trade is transit time: consolidation at origin and multiple drops add hours, which is why urgent cargo is better served by a full truck.`,
  '/ltl-transport': `Less-than-truckload is the structured version of part load: several consignments consolidated into one vehicle, each charged for the space it occupies rather than the whole vehicle. Consolidation points and drop sequences are set before loading, so the extra handling is planned rather than improvised. For regular small shippers, scheduling the same weekly lanes is what turns a higher per-kilogram rate into a lower total cost.`,
  '/truck-load-booking': `A full truck gives exclusive use of the vehicle, a direct point-to-point run, and the shortest transit time of the three options — which is why it is the right answer above roughly seven tonnes or whenever the delivery date is fixed. Booking takes the pickup and drop addresses, the cargo weight and dimensions, and the loading window. Quotes come back per vehicle with the truck type, and tracking stays live until delivery is confirmed.`,
  '/freight-marketplace': `The marketplace has two sides and neither of them is a broker. Shippers post what they need to move; truckers post the capacity they have and the lane they are running. There is no agent taking a cut in the middle, which is why the published fee is ${FEES.shipper} for shippers and ${FEES.trucker} for truckers on a completed shipment. Either side can browse and filter the other side's open postings before committing.`,
  '/truck-near-me': 'Finding a truck locally is a filtering problem rather than a search problem: capacity against your cargo, available space against your date, and the counterparty’s credit standing. LoadSaathi exposes all three as filters, so a shortlist can be built for a specific lane and a specific morning. Trucks running empty out of your city on a return leg are often the cheapest option available, and they are listed first when you filter by date.',
  '/gallery': `The app screens below show what shippers and truckers actually use day to day: the role-based dashboard with live shipment counts and earnings, the matching screen with confidence scores and trucker profiles, the shipment chat with read receipts, the 300 to 900 freight credit score with its factor breakdown, and the bidirectional review flow. The web app and the Android build share the same data.`,
  '/sitemap': `Every indexable page on LoadSaathi, grouped by section: ${COVERAGE.freightRoutes} freight corridor pages, ${COVERAGE.cityPages} city pages, transport services by city, practical guides, ${TOOL_LINKS.length} free freight calculators, the logistics blog, and the legal pages — ${COVERAGE.sitemapUrls} URLs in total. The same list is available as XML at ${SITE_URL}/sitemap.xml, and a plain-text summary for AI agents at ${SITE_URL}/llms.txt. If a page you need is not listed here, it is not published: the sitemap is generated from the same data the app routes from, so it cannot list a page that 404s.`,
  '/solutions/shippers': `For a shipper, the platform removes the broker from the middle of the loop. Post once, compare several verified truckers on rate, vehicle type, credit score and rating, then track the vehicle live until delivery and release payment on milestones. The rate you agree is the rate you pay — the only addition is the ${FEES.shipper} transaction fee, and the inputs for the GST e-way bill come straight out of the booking.`,
  '/solutions/truckers': `For a trucker, the platform fills the leg you are about to run and the leg you were about to run empty. Post the trip with the vehicle type, available capacity and lane, and matching loads surface against it — ranked on route overlap, timing, capacity fit and the shipper's credit standing. Settlement is on milestones rather than on delivery day, so cash flow is not tied to the delivery window.`,
  '/transport-cost-calculator': 'Transport cost per kilometre is the number every rate conversation turns on. The estimate here builds up from distance, load type, tolls and a diesel reference, so you can see which part of a quote is fuel, which part is the road, and which part is the truck. Use it to check a rate you have been quoted, or to sanity-check a budget before you go to market.',
  '/fare-calculator': 'A fare estimate needs the same four inputs a booking does: origin, destination, weight and date. The calculator turns those into a per-kilometre and per-kilogram range for part load and full truck, with a toll and diesel allowance, so two quotes for the same movement can be compared on equal terms.',
  '/truck-load-calculator': 'Truck selection is weight and volume together, not weight alone. A cubic metre of light packaging can fill a 20ft container long before it reaches its payload limit, which is why the calculator reports both the weight percentage and the volume percentage against each Indian truck type, from a light commercial vehicle up to a tractor-trailer.',
  '/ptl-vs-ftl-calculator': 'The crossover point is the whole decision. Below roughly three tonnes, sharing a truck normally costs less; above roughly seven tonnes, or when the date cannot move, a dedicated vehicle costs less and arrives sooner. The calculator plots both curves against your weight so the crossing is visible rather than argued about.',
  '/freight-rate-calculator': 'A usable freight rate needs a range, not a point estimate, because distance, cargo type and truck availability at the origin all move the number. This calculator returns a low and high figure per kilogram and per kilometre, plus a truck-type recommendation, so it can be compared directly against a carrier quote for the same lane and weight.',
  '/return-load-calculator': 'An empty return is a cost that never appears on an invoice but is fully paid for in fuel, driver wages and tolls. Enter a lane and the calculator shows what the return leg costs to run empty and what a backhaul load would add against it — which is the number that makes a posted return load worth accepting at a lower rate than the outbound leg.',
  '/route-optimizer': 'Sequence matters more than the individual legs. Stopping in the wrong order turns a clean run into backtracking, and backtracking costs fuel twice. The optimizer takes an origin and up to six stops, returns the road distance and driving time for the ordering it recommends, and lets you compare that against the sequence you would have used.',
  '/empty-km-savings': 'Deadhead kilometres are the freight industry’s largest single waste, because the truck is fully paid for and entirely unloaded. This calculator quantifies what empty running costs on a given lane and what booking return loads against it is worth — which is the number behind every return-load decision.',
  '/trip-profit': 'Freight revenue is not profit. A trip earns what it earns after diesel, tolls, driver pay, food and lodging, tyre and maintenance reserve, and the commission paid to find the load. This calculator subtracts all of them so the number left is the one that actually goes into your account.',
  '/shared-savings': 'The comparison that convinces a shipper is the same cargo priced two ways: alone in a dedicated vehicle, or sharing space with other consignments. This calculator runs both, then shows the fuel and carbon difference, so the saving can be defended with a number instead of a promise.',
  '/document-checklist': 'Goods transport in India is document-heavy, and the documents are also the trucker’s working capital and licence. This checklist generates the papers required for a route, vehicle type and commodity — registration, permit, fitness, insurance, e-way bill and driver papers — so a missing document is found at the office rather than at a check post.',
  '/carbon-savings': 'Freight emissions follow the same arithmetic as freight cost: distance, load factor and empty running. Consolidating consignments raises the load factor, and filling return legs removes distance entirely. This calculator turns both into kilograms of CO₂ so the sustainability argument sits next to the cost argument.',
  '/toll-fuel': 'Tolls and fuel are the two line items that move between quotes without changing anything about the cargo. Enter the lane and the truck type to get a per-kilometre breakdown of both, then compare it against what the carrier has quoted — a difference here usually explains most of a gap in the totals.',
  '/gst-calculator': 'Freight attracts GST at a different rate from most goods, and the correct split depends on whether the supplier and the recipient are in the same state. Enter the invoice amount and the origin and destination states to get the IGST or CGST plus SGST breakdown for the transport bill.',
  '/payload-utilization': 'A truck running at half its rated payload is burning fuel twice for the same tonne-kilometre. Enter your cargo weight and volume to see the weight and volume utilisation separately against the rated capacity — because the binding constraint on Indian overloading is usually the axle, not the volume.',
  '/hi': `भारत में ट्रक बुकिंग अब सीधे ऐप से होती है — ब्रोकर के बिना। LoadSaathi शिपर और ट्रकर दोनों को एक ही मंच पर जोड़ता है: शिपर अपना माल पोस्ट करता है, ट्रकर अपनी ट्रिप और खाली क्षमता पोस्ट करता है, और AI मैचिंग इन्हें आपस में जोड़ती है। प्लेटफ़ॉर्म पूर्वी भारत के ${COVERAGE.freightRoutes} मुख्य माल ढुलाई कॉरिडोर पर काम करता है, लाइव GPS ट्रैकिंग, 300–900 का डिजिटल फ्रेट क्रेडिट स्कोर और एस्क्रो आधारित भुगतान देता है। शिपर फ़ीस ${FEES.shipper}, ट्रकर फ़ीस ${FEES.trucker} — कोई सदस्यता नहीं।`,
  '/hi/ptl-transport': 'पार्ट ट्रक लोड (PTL) यानी किसी दूसरे के ट्रक में जगह भाड़ा करना। ईंधन, टोल और ड्राइवर की लागत कई कार्गो के बीच बँट जाती है, इसलिए पूरा ट्रक भाड़ा करने से लगभग 30–40% कम खर्च आता है। यह 0.5 से 3 टन तक के माल के लिए सही है। बदला यह है कि ट्रक पहले कई माल लेकर चलता है, इसलिए डिलीवरी में एक से दो दिन अतिरिक्त लग सकते हैं।',
  '/hi/return-load': 'डिलीवरी के बाद खाली लौटने वाला ट्रक पहले ही ईंधन, ड्राइवर और टोल खर्च चुका चुका होता है — और उसमें माल न होने से कमाई शून्य। LoadSaathi पर वापसी के रास्ते की लोड पहले से दिखती है, जिससे ट्रकर वही ट्रिप दोबारा चलाकर अपना खर्च निकाल सकता है। यही एक ट्रकर की प्रति किलोमीटर लागत सबसे ज़्यादा घटाती है।',
  '/hi/bhada-kaise-book-kare': 'बिना दलाल के ट्रक बुक करने की प्रक्रिया चार कदमों में है: माल की वज़न और आकार डालें, लोड होने का पता और समय भरें, कई सत्यापित ट्रकरों की दर और रेटिंग की तुलना करें, और फिर पुष्टि करें। बुकिंग के बाद GPS ट्रैकिंग चालू रहती है और पेमेंट एस्क्रो में तब तक रुकी रहती है जब तक डिलीवरी कन्फर्म न हो।',
  '/hi/route/rourkela-to-ranchi': `राउरकेला से रांची 180 किमी की दूरी पर है और यह NH-215 पर चलने वाली मुख्य लोड-करrying लेन है। पार्ट लोड लगभग ₹14–₹22 प्रति किलो, और पूरा ट्रक ₹15,300–₹21,600 के बीच चलता है। दोनों शहर औद्योगिक केंद्र हैं — राउरकेला इस्पात और सीमेंट, रांची कोयला और मशीनरी — इसलिए दोनों दिशाओं में माल रहता है, और वापसी का लोड मिलना आसान होता है।`,
};

function contentFor(path, seoMeta) {
  const title = String(seoMeta.seoTitle || '').replace(/\s*\|\s*LoadSaathi\s*$/, '').trim();
  const summary = String(seoMeta.summary || seoMeta.metaDescription || '').trim();
  const blocks = [];
  const links = relatedLinksFor(path, seoMeta);
  let heading = title;

  if (seoMeta.type === 'route') {
    const { from, to, fromState, toState, distanceKm, transitTime } = seoMeta;
    const hours = Number(transitTime) || 0;
    const highway = ROUTE_HIGHWAY[seoMeta.slug];
    const crossState = fromState !== toState;
    const fromCity = CITY_SLUGS[String(from).toLowerCase()];
    const toCity = CITY_SLUGS[String(to).toLowerCase()];
    const fromData = fromCity ? LOCATION_DATA[fromCity] : null;
    const toData = toCity ? LOCATION_DATA[toCity] : null;
    const moving = [
      ...(fromData ? fromData.commodities.slice(0, 3) : []),
      ...(toData ? toData.commodities.slice(0, 2) : []),
    ];
    const bands = rateBandsFor(distanceKm);
    const rateTotalLow = distanceKm * bands.perKmLow;
    const rateTotalHigh = distanceKm * bands.perKmHigh;
    const mode = distanceKm < 120 ? 'short-haul' : crossState ? 'cross-state' : 'intra-state';

    heading = `PTL and LTL freight from ${from} to ${to}`;
    blocks.push({ p: seoMeta.description || summary });
    blocks.push({
      p: `${from} (${fromState}) and ${to} (${toState}) are ${distanceKm} km apart, which is about ${hours} hours of driving${highway ? ` on ${highway}` : ''}. That makes it a ${mode} lane: ${mode === 'short-haul' ? 'short-haul lanes run several times a day, so a missed departure usually costs hours rather than a day.' : crossState ? 'cross-state lanes carry a full day of driving, so an evening departure from the origin usually lands an early-morning delivery.' : 'intra-state lanes are dense enough that matching is rarely the constraint — vehicle availability at the loading hour is.'}`,
    });
    if (moving.length) {
      blocks.push({
        p: `The cargo that actually moves on this lane: ${listSentence(moving)}. That mix is why part load is so common here — the commodities are individually small enough to share a vehicle but collectively large enough to fill one every day.`,
      });
    }
    blocks.push({
      p: `A full truck on this lane runs about ₹${rateTotalLow.toLocaleString('en-IN')} to ₹${rateTotalHigh.toLocaleString('en-IN')} for ${distanceKm} km, or roughly ₹${bands.perKmLow}–₹${bands.perKmHigh} per kilometre before tolls. Part loads are quoted per kilogram and normally land 30–40% below a dedicated vehicle for anything under three tonnes.`,
    });
    blocks.push({
      h2: `How LoadSaathi handles the ${from}–${to} lane`,
      ul: PLATFORM_CAPABILITIES,
    });
    blocks.push({
      h2: `Questions about shipping from ${from} to ${to}`,
      ol: routeFaq(seoMeta),
    });
  } else if (seoMeta.type === 'blog') {
    const published = formatIsoDate(seoMeta.date);
    const updated = formatIsoDate(seoMeta.lastUpdated);
    const own = normaliseFaq(seoMeta.faq);
    const faq = own.length ? own : genericBlogFaq(seoMeta);
    const bylineParts = [];
    if (published) bylineParts.push(`Published ${published}`);
    if (seoMeta.readTime) bylineParts.push(seoMeta.readTime);
    if (seoMeta.category) bylineParts.push(seoMeta.category);
    if (seoMeta.author) bylineParts.push(`by ${seoMeta.author}`);
    if (updated && updated !== published) bylineParts.push(`updated ${updated}`);
    const byline = bylineParts.join(' · ');

    heading = title;
    blocks.push({ p: seoMeta.summary || seoMeta.metaDescription });
    if (byline) blocks.push({ p: `${byline}.` });
    if (seoMeta.authorBio) blocks.push({ p: seoMeta.authorBio });
    blocks.push({
      h2: 'Questions this article answers',
      dl: faq,
    });
    if (!own.length) {
      blocks.push({
        h2: 'What this means in practice',
        p: CATEGORY_GUIDANCE[seoMeta.category] || CATEGORY_GUIDANCE.default,
      });
    }
    blocks.push({ h2: 'Free freight tools', ul: TOOL_LINKS.map((t) => ({ ...t, plain: true })) });
  } else if (seoMeta.type === 'guide') {
    const faq = normaliseFaq(seoMeta.faq);
    heading = title;
    blocks.push({ p: seoMeta.summary || seoMeta.metaDescription });
    if (seoMeta.authorBio) blocks.push({ p: `${seoMeta.author}${seoMeta.readTime ? ` · ${seoMeta.readTime}` : ''}. ${seoMeta.authorBio}` });
    if (Array.isArray(seoMeta.steps) && seoMeta.steps.length) {
      blocks.push({ h2: 'Step by step', ol: seoMeta.steps.map((s) => ({ q: s.name, a: s.text })) });
    }
    if (seoMeta.rateTable && Array.isArray(seoMeta.rateTable.rows)) {
      blocks.push({
        h2: seoMeta.rateTable.caption || 'Comparison',
        table: { headers: seoMeta.rateTable.headers, rows: seoMeta.rateTable.rows, footnote: seoMeta.rateTable.footnote },
      });
    }
    if (faq.length) blocks.push({ h2: 'Common questions', dl: faq });
    if (!faq.length) blocks.push({ p: GENERIC_GUIDE_NOTE });
    blocks.push({ h2: 'Free freight tools', ul: TOOL_LINKS.map((t) => ({ ...t, plain: true })) });
  } else if (seoMeta.type === 'location') {
    const data = seoMeta.location;
    heading = data ? `Freight and trucking in ${data.name}, ${data.state}` : title;
    blocks.push({ p: seoMeta.summary });
    if (data) {
      blocks.push({ p: `Industries that generate freight in ${data.name}: ${listSentence(data.industries)}. Outbound and inbound cargo both run on the same lanes, which is what makes return loads available on most routes out of the city.` });
      blocks.push({ p: `Typical commodities booked from ${data.name} include ${listSentence(data.commodities)}.` });
      if (data.hubDistances && data.hubDistances.length) {
        blocks.push({
          p: `Road distances from ${data.name} to the nearby hubs LoadSaathi serves: ${data.hubDistances.map((h) => `${h.city} ${h.km} km`).join(', ')}.`,
        });
      }
      if (data.rateRanges && data.rateRanges.length) {
        blocks.push({
          h2: `Published rate ranges for ${data.name}`,
          ul: data.rateRanges.map((r) => ({ label: r.type, note: r.range, plain: true })),
        });
      }
      blocks.push({ h2: `How booking freight in ${data.name} works`, ul: PLATFORM_CAPABILITIES });
      const localFaq = normaliseFaq(data.localFaq);
      if (localFaq.length) {
        blocks.push({ h2: `${data.name} freight questions`, dl: localFaq });
      }
    }
  } else if (seoMeta.type === 'transport-service') {
    const faq = normaliseFaq(seoMeta.faq);
    heading = `Part load and full truck booking in ${seoMeta.cityName}`;
    if (seoMeta.summary) blocks.push({ p: seoMeta.summary });
    if (seoMeta.answer) blocks.push({ p: seoMeta.answer });
    blocks.push({ h2: `What LoadSaathi shows you for a ${seoMeta.cityName} booking`, ul: PLATFORM_CAPABILITIES });
    if (faq.length) blocks.push({ h2: `${seoMeta.cityName} transport questions`, dl: faq });
    blocks.push({ h2: 'Free freight tools', ul: TOOL_LINKS.map((t) => ({ ...t, plain: true })) });
  } else {
    // Static page.
    heading = title;
    blocks.push({ p: seoMeta.summary || seoMeta.metaDescription });
    // Tool pages live under /tools/*, but their notes are keyed by the bare
    // slug (/carbon-savings) because that is the name the tools index uses.
    const noteKey = path.startsWith('/tools/') ? path.slice('/tools'.length) : path;
    const note = STATIC_CONTENT_NOTES[path] || STATIC_CONTENT_NOTES[noteKey];
    if (note) blocks.push({ p: note });
    const detail = TOOL_DETAILS[path] || TOOL_DETAILS[TOOL_ALIASES[path]];
    if (detail) {
      blocks.push({
        h2: 'What this calculator asks for',
        p: `Enter ${detail.inputs}. The estimate is only as good as those inputs, so use the weight from your packing list rather than a rounded figure.`,
      });
      blocks.push({ h2: 'How the estimate is built', p: detail.method });
      blocks.push({ h2: 'Where this number stops being reliable', p: detail.limits });
      blocks.push({
        h2: 'Next step after the estimate',
        p: `Once you have a figure to test, post the load on LoadSaathi or publish the trip for the return leg. Matching scores every open pair on capacity, proximity, route overlap, price alignment, date and credit standing, so real quotes come back against the same numbers you just used here. Joining is free for both sides, and ${FEES.shipper} applies to shippers on a completed shipment while truckers pay ${FEES.trucker}.`,
      });
    }
    if (path === '/contact' || path === '/sitemap') {
      blocks.push({
        ul: [
          { label: `Email ${EMAIL}`, href: `mailto:${EMAIL}`, plain: true },
          { label: `Call ${PHONE_DISPLAY}`, href: `tel:${PHONE_E164}`, plain: true },
          { label: `WhatsApp ${PHONE_DISPLAY}`, href: `https://wa.me/${PHONE_E164.replace('+', '')}`, plain: true },
          ...SOCIALS.slice(0, 3).map((s) => ({ label: `${s.name} — LoadSaathi`, href: s.url, plain: true })),
        ],
      });
    }
    // Hindi pages stay in Hindi: English capability bullets under a Hindi
    // heading read as two languages stitched together.
    const isHindi = path === '/hi' || path.startsWith('/hi/');
    const hindiNote = isHindi ? HINDI_PAGE_NOTES[path] : null;
    if (hindiNote) blocks.push({ p: hindiNote });
    blocks.push(
      isHindi
        ? { h2: 'LoadSaathi क्या करता है', ul: HINDI_CAPABILITIES }
        : { h2: 'What LoadSaathi does', ul: PLATFORM_CAPABILITIES }
    );
    const staticFaq = normaliseFaq(STATIC_FAQ[path]);
    if (staticFaq.length) {
      blocks.push({ h2: isHindi ? 'अक्सर पूछे जाने वाले सवाल' : 'Questions on this page', dl: staticFaq });
    }
  }

  return { heading, blocks, links };
}

/** "a, b and c" for a short list of strings. */
function listSentence(items) {
  const list = (items || []).map((s) => String(s).trim()).filter(Boolean);
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/**
 * Render the composed blocks to HTML. `headingTag` is h1 for documents that
 * have no other h1 (the SPA shell) and h2 for the prerendered trust pages, which
 * already carry one — that keeps every served page at exactly one h1.
 */
function renderContentBlocks(blocks) {
  const out = [];
  for (const block of blocks) {
    if (!block) continue;
    if (block.p) out.push(`<p>${escapeHtml(block.p)}</p>`);
    if (block.h2) out.push(`<h2>${escapeHtml(block.h2)}</h2>`);
    if (Array.isArray(block.ul)) {
      out.push('<ul>');
      for (const item of block.ul) {
        if (typeof item === 'string') {
          out.push(`<li>${escapeHtml(item)}</li>`);
        } else {
          const text = item.note ? `${escapeHtml(item.label)} — ${escapeHtml(item.note)}` : escapeHtml(item.label);
          out.push(`<li>${item.href ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>${item.note ? ` — ${escapeHtml(item.note)}` : ''}` : text}</li>`);
        }
      }
      out.push('</ul>');
    }
    if (Array.isArray(block.ol)) {
      out.push('<ol>');
      for (const item of block.ol) {
        const q = typeof item === 'string' ? item : item.q;
        const a = typeof item === 'string' ? '' : item.a;
        out.push(`<li>${escapeHtml(q)}${a ? ` — ${escapeHtml(a)}` : ''}</li>`);
      }
      out.push('</ol>');
    }
    if (Array.isArray(block.dl)) {
      for (const item of block.dl) {
        if (!item || !item.q) continue;
        out.push(`<h3>${escapeHtml(item.q)}</h3>`);
        if (item.a) out.push(`<p>${escapeHtml(item.a)}</p>`);
      }
    }
    if (block.table) {
      out.push('<table><thead><tr>');
      for (const cell of block.table.headers || []) out.push(`<th>${escapeHtml(cell)}</th>`);
      out.push('</tr></thead><tbody>');
      for (const row of block.table.rows || []) {
        out.push('<tr>');
        for (const cell of row) out.push(`<td>${escapeHtml(cell)}</td>`);
        out.push('</tr>');
      }
      out.push('</tbody></table>');
      if (block.table.footnote) out.push(`<p>${escapeHtml(block.table.footnote)}</p>`);
    }
  }
  return out.join('\n      ');
}

function buildContentBlock(path, seoMeta, headingTag = 'h1') {
  const { heading, blocks, links } = contentFor(path, seoMeta);
  const body = renderContentBlocks(blocks);
  const linkList = (links || [])
    .map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`)
    .join('\n        ');
  return (
    `<div id="ls-content" data-ls-seo-content="1" lang="en" style="max-width:860px;margin:0 auto;padding:2rem 1.25rem 3rem;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.65;color:#1f2937;background:#ffffff;text-align:left">\n` +
    `      <${headingTag}>${escapeHtml(heading)}</${headingTag}>\n` +
    `      ${body}\n` +
    `      <h2>Related pages</h2>\n      <ul>\n        ${linkList}\n      </ul>\n` +
    `      <p>LoadSaathi is a road freight marketplace, not a lender or broker of credit. Support: <a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="tel:${PHONE_E164}">${PHONE_DISPLAY}</a> · <a href="${SITE_URL}/sitemap">Sitemap</a>.</p>\n` +
    `    </div>`
  );
}

/**
 * Write the block into the served document.
 *
 * index.html carries a `#ssr-fallback` element whose contents the inline boot
 * script hides before first paint; React replaces `#root` wholesale on mount.
 * So writing there is invisible to JavaScript users (no flash, no layout
 * shift) while remaining fully visible to no-JS clients and to crawlers that
 * read raw HTML. Documents without that element (the prerendered trust pages)
 * get the block inserted right after `<body>`.
 */
function injectContentBlock(html, path, seoMeta) {
  const block = buildContentBlock(path, seoMeta, hasOwnH1(html) ? 'h2' : 'h1');
  const slotRe = /(<div id="ssr-fallback-content"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>)/;
  if (slotRe.test(html)) {
    // Long-form content cannot be centred, so drop the flex centring the card
    // used while keeping the min-height that stops the page collapsing.
    const relaxed = html
      .replace(/(<div id="ssr-fallback"[^>]*?)style="([^"]*)"/, (m, open, style) =>
        `${open}style="${style.replace(/display:flex;?/, 'display:block;').replace(/align-items:center;?/, '').replace(/justify-content:center;?/, '')}"`)
      .replace(slotRe, (m, open, _inner, close) => `${open}\n    ${block}\n    ${close}`);
    return relaxed;
  }
  const bodyOpen = html.match(/<body[^>]*>/i);
  if (!bodyOpen) return html;
  const at = html.indexOf(bodyOpen[0]) + bodyOpen[0].length;
  return html.slice(0, at) + `\n  ${block}\n  ` + html.slice(at);
}

/** Does the document already carry a heading outside its <noscript> fallback? */
function hasOwnH1(html) {
  const withoutNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');
  return /<h1[\s>]/i.test(withoutNoscript);
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

/**
 * CSP violation collector (report-only mode, see vercel.json).
 *
 * Browsers POST an application/csp-report body when a directive is violated.
 * We acknowledge with 204 and log a one-line summary so violations show up in
 * Vercel function logs without storing visitor data. Deliberately never echoes
 * the body back — a report endpoint that reflects input is a reflected-XSS
 * vector on a same-origin path.
 *
 * Accepts both the legacy `csp-report` shape and the CSP3 `reporting-endpoint`
 * shape so the same URL works if the policy is ever promoted to enforce mode.
 */
async function handleCspReport(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' },
    });
  }

  let reports = [];
  try {
    const raw = await req.text();
    // Cap the read: a report is a few hundred bytes; anything larger is abuse.
    if (raw.length > 64 * 1024) throw new Error('payload too large');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) reports = parsed;
    else if (parsed && typeof parsed === 'object') reports = [parsed];
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  for (const entry of reports.slice(0, 20)) {
    // Legacy: { "csp-report": { "blocked-uri", "violated-directive" } }
    // CSP3:   { "type": "csp-violation", "blockedURL", "effectiveDirective" }
    const r = entry['csp-report'] || entry;
    const blocked = String(r['blocked-uri'] || r.blockedURL || '').slice(0, 200);
    const directive = String(r['violated-directive'] || r.effectiveDirective || '').slice(0, 120);
    const doc = String(r['document-uri'] || r.documentURL || '').slice(0, 200);
    console.log(`[csp] ${directive} blocked=${blocked} doc=${doc}`);
  }

  // 204 No Content: the report is fully consumed, nothing useful to return.
  return new Response(null, { status: 204 });
}

export default async function handler(req) {
  const url = new URL(req.url, 'https://loadsaathi.in');
  const rawPath = url.pathname;
  const path = normalizePath(rawPath);
  const accept = (req.headers.get('accept') || '').toLowerCase();

  // CSP report collector. Checked before redirects and content negotiation:
  // report-uri POSTs carry Accept: */* and must never be redirected or
  // rendered as a page.
  if (path === '/csp-report') {
    return handleCspReport(req);
  }

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
        const image = OG_IMAGE;
        // Every interpolated value is escaped: these land inside HTML attribute
        // values, and a stray quote or angle bracket in the data would break the
        // tag it sits in.
        const title = escapeHtml(seoMeta.seoTitle);
        const description = escapeHtml(seoMeta.metaDescription);
        const hreflang = path === '/hi' || path.startsWith('/hi/') ? 'hi-in' : 'en-in';
        const locale = hreflang === 'hi-in' ? 'hi_IN' : 'en_IN';
        const head =
          `<title>${title}</title>\n` +
          `  <meta name="description" content="${description}" />\n` +
          (keywords ? `  <meta name="keywords" content="${escapeHtml(keywords)}" />\n` : "") +
          `  <meta name="robots" content="${seoMeta.noindex ? "noindex, follow" : "index, follow"}" />\n` +
          `  <link rel="canonical" href="${canonical}" />\n` +
          `  <link rel="alternate" hreflang="${hreflang}" href="${canonical}" />\n` +
          `  <link rel="alternate" hreflang="x-default" href="${canonical}" />\n` +
          `  <meta property="og:type" content="website" />\n` +
          `  <meta property="og:url" content="${canonical}" />\n` +
          `  <meta property="og:title" content="${title}" />\n` +
          `  <meta property="og:description" content="${description}" />\n` +
          `  <meta property="og:image" content="${image}" />\n` +
          `  <meta property="og:image:width" content="1200" />\n` +
          `  <meta property="og:image:height" content="630" />\n` +
          `  <meta property="og:site_name" content="${escapeHtml(BRAND)}" />\n` +
          `  <meta property="og:locale" content="${locale}" />\n` +
          `  <meta name="twitter:card" content="summary_large_image" />\n` +
          `  <meta name="twitter:title" content="${title}" />\n` +
          `  <meta name="twitter:description" content="${description}" />\n` +
          `  <meta name="twitter:image" content="${image}" />\n` +
          (seoMeta.author ? `  <meta name="author" content="${escapeHtml(seoMeta.author)}" />\n` : "");
        html = html.replace("</head>", `  ${head}  ${buildJsonLd(path, seoMeta)}\n  </head>`);
        // Body copy: the SPA shell only carries a ~34-word card, so inject the
        // page's own long-form content for crawlers and no-JS clients.
        html = injectContentBlock(html, path, seoMeta);
      } else {
        // Known route with no SEO entry (app/auth/share/admin paths): keep it out of the index.
        html = html
          .replace(/<meta\s+name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow" />')
          .replace(/<link rel="canonical"[^>]*>/, "")
          .replace(/<meta\s+property="og:url"[^>]*>/, "");
        if (!/<meta\s+name="robots"/.test(html)) {
          html = html.replace("</head>", '  <meta name="robots" content="noindex, follow" />\n  </head>');
        }
        // Public share links: swap index.html's generic og/twitter tags for
        // per-item tags whose image is rendered by api/og.tsx. The id segment
        // is URI-encoded, so it is safe to inline; no og:url in this branch.
        const shareMatch = path.match(/^\/share\/(trip|shipment)\/([^/]+)$/);
        if (shareMatch) {
          const shareType = shareMatch[1];
          const shareId = encodeURIComponent(shareMatch[2]);
          const shareTitle =
            shareType === "trip"
              ? "Truck Space Available on LoadSaathi"
              : "Freight Load Open on LoadSaathi";
          const shareDesc =
            shareType === "trip"
              ? "An active truck route posted on LoadSaathi. Match your load to this truck in one tap."
              : "An open shipment posted on LoadSaathi. Find a truck for this load in one tap.";
          // Static branded card rather than a per-trip rendered one. Rendering
          // this with @vercel/og is not viable in this project: on the edge
          // runtime Vercel charges the import to the sibling api/agent edge
          // function and fails the build with "referencing unsupported
          // modules", and on the Node runtime @vercel/og@1.0.3 crashes because
          // its harfbuzzjs dependency performs a dynamic require("fs") inside
          // an ES module. 1.0.3 is the latest release, so there is no upgrade.
          // Title and description above stay per-trip, which is what actually
          // drives click-through.
          const shareImage = `https://loadsaathi.in/og-image.png`;
          html = html
            .replace(/<meta\s+property="og:[^"]*"[^>]*>/g, "")
            .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/g, "");
          const shareTags =
            `  <meta property="og:type" content="website" />\n` +
            `  <meta property="og:title" content="${shareTitle}" />\n` +
            `  <meta property="og:description" content="${shareDesc}" />\n` +
            `  <meta property="og:image" content="${shareImage}" />\n` +
            `  <meta property="og:image:width" content="1200" />\n` +
            `  <meta property="og:image:height" content="630" />\n` +
            `  <meta property="og:image:alt" content="${shareTitle}" />\n` +
            `  <meta property="og:site_name" content="LoadSaathi" />\n` +
            `  <meta property="og:locale" content="en_IN" />\n` +
            `  <meta name="twitter:card" content="summary_large_image" />\n` +
            `  <meta name="twitter:title" content="${shareTitle}" />\n` +
            `  <meta name="twitter:description" content="${shareDesc}" />\n` +
            `  <meta name="twitter:image" content="${shareImage}" />\n`;
          html = html.replace("</head>", `${shareTags}  </head>`);
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
