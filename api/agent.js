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
  '/fare-calculator',
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
  '/transport-cost-calculator',
  '/truck-load-calculator',
  '/ptl-vs-ftl-calculator',
  '/freight-rate-calculator',
  '/return-load-calculator',
  '/for-msmes',
  '/ai-logistics',
  '/data',
  '/freight-intelligence',
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
  '/sso-callback',
  '/sign-in',
  '/sign-up',
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
  '/transport/',
  '/admin/',
  '/trucker/',
  '/shipper/',
  '/trips/',
  '/chat/',
  '/tools/',
  '/sign-in/',
  '/sign-up/',
  '/sso-callback/',
];

// HTML files that have dedicated prerendered variants (served instead of generic index.html)
// This ensures trust-anchor pages have 500+ chars in raw HTML without JS
const DEDICATED_HTML = new Set(['/about', '/contact', '/privacy']);

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
    seoTitle: "PTL Freight Balasore to Bhubaneswar | Book Trucks Online",
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
    seoTitle: "PTL Freight Berhampur to Bhubaneswar | Book Trucks Online",
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
    seoTitle: "PTL Freight Bhubaneswar to Burdwan | Book Trucks Online",
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
    seoTitle: "PTL Freight Bhubaneswar to Kolkata | Book Trucks Online",
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
    seoTitle: "PTL Freight Bhubaneswar to Visakhapatnam | Book Trucks Online",
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
    seoTitle: "PTL Freight Cuttack to Bhubaneswar | Book Trucks Online",
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
    seoTitle: "PTL Freight Cuttack to Rourkela | Book Trucks Online",
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
    seoTitle: "PTL Freight Dhanbad to Jamshedpur | Book Trucks Online",
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
    seoTitle: "PTL Freight Jamshedpur to Bhubaneswar | Book Trucks Online",
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
    seoTitle: "PTL Freight Jamshedpur to Burdwan | Book Trucks Online",
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
    seoTitle: "PTL Freight Jamshedpur to Kolkata | Book Trucks Online",
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
    seoTitle: "PTL Freight Jamshedpur to Ranchi | Book Trucks Online",
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
    seoTitle: "PTL Freight Jamshedpur to Rourkela | Book Trucks Online",
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
    seoTitle: "PTL Freight Kolkata to Burdwan | Book Trucks Online",
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
    seoTitle: "PTL Freight Ranchi to Bhubaneswar | Book Trucks Online",
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
    seoTitle: "PTL Freight Ranchi to Dhanbad | Book Trucks Online",
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
    seoTitle: "PTL Freight Ranchi to Jamshedpur | Book Trucks Online",
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
    seoTitle: "PTL Freight Ranchi to Kolkata | Book Trucks Online",
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
    seoTitle: "PTL Freight Ranchi to Rourkela | Book Trucks Online",
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
    seoTitle: "PTL Freight Rourkela to Bhubaneswar | Book Trucks Online",
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
    seoTitle: "PTL Freight Rourkela to Burdwan | Book Trucks Online",
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
    seoTitle: "PTL Freight Rourkela to Cuttack | Book Trucks Online",
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
    seoTitle: "PTL Freight Rourkela to Jamshedpur | Book Trucks Online",
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
    seoTitle: "PTL Freight Rourkela to Kolkata | Book Trucks Online",
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
    seoTitle: "PTL Freight Rourkela to Ranchi | Book Trucks Online",
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
    seoTitle: "PTL Freight Rourkela to Sambalpur | Book Trucks Online",
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
    seoTitle: "PTL Freight Sambalpur to Bhubaneswar | Book Trucks Online",
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
    seoTitle: "PTL Freight Sambalpur to Jharsuguda | Book Trucks Online",
  },
};

function getSeoMeta(path) {
  const n = normalizePath(path);
  const routeMatch = n.match(/^\/routes\/(.+)$/);
  if (routeMatch && ROUTE_DATA[routeMatch[1]]) {
    return ROUTE_DATA[routeMatch[1]];
  }
  return null;
}

function buildJsonLd(slug, route) {
  const baseUrl = 'https://loadsaathi.in';
  const routeUrl = `${baseUrl}/routes/${slug}`;
  const price = Math.round(route.distanceKm * 100);
  const p1 = Math.round(route.distanceKm * 85);
  const p2 = Math.round(route.distanceKm * 120);
  const pkgLow = Math.round(route.distanceKm * 0.08);
  const pkgHigh = Math.round(route.distanceKm * 0.12);
  const transNum = Number(route.transitTime) || 0;
  const p1h = Math.round(transNum * 1.3);
  const p2h = Math.round(transNum * 1.5);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${baseUrl}/` },
          { "@type": "ListItem", "position": 2, "name": "Freight Routes", "item": `${baseUrl}/routes` },
          { "@type": "ListItem", "position": 3, "name": `${route.from} to ${route.to}`, "item": routeUrl }
        ]
      },
      {
        "@type": "Service",
        "name": route.seoTitle,
        "description": route.metaDescription,
        "url": routeUrl,
        "provider": {
          "@type": "Organization",
          "name": "LoadSaathi",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`
        },
        "areaServed": [
          { "@type": "City", "name": route.from, "containedInPlace": { "@type": "State", "name": route.fromState } },
          { "@type": "City", "name": route.to, "containedInPlace": { "@type": "State", "name": route.toState } }
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
            "description": `Estimated freight cost for ${route.distanceKm}km route`
          },
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "QAPage",
        "name": `Frequently Asked Questions — ${route.from} to ${route.to} Freight`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": `What is the freight cost from ${route.from} to ${route.to}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `FTL truck rates from ${route.from} to ${route.to} (${route.distanceKm} km) range from ₹${p1.toLocaleString()} to ₹${p2.toLocaleString()} depending on truck type (Open 9MT, Container 20ft, Trailer 25MT). PTL rates are ₹${pkgLow}–${pkgHigh} per kg. Use LoadSaathi's freight rate calculator for a precise quote based on your cargo weight and truck preference.`
            }
          },
          {
            "@type": "Question",
            "name": `How long does delivery take from ${route.from} to ${route.to}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Delivery from ${route.from} to ${route.to} takes approximately ${route.transitTime} hours for direct FTL shipments. PTL shipments may take ${p1h}–${p2h} hours due to consolidation stops. LoadSaathi's GPS tracking provides real-time ETAs and milestone notifications.`
            }
          },
          {
            "@type": "Question",
            "name": `What truck types operate on the ${route.from}–${route.to} route?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Available truck types on the ${route.from}–${route.to} corridor include: Open trucks (9MT, 16MT), Container trucks (20ft, 32ft), Flatbed trailers (20MT, 25MT), and Tankers (for liquid cargo). The best truck type depends on your cargo weight, dimensions, and special requirements. LoadSaathi's AI matcher recommends the optimal truck for your shipment.`
            }
          },
          {
            "@type": "Question",
            "name": `Is PTL shipping available on the ${route.from}–${route.to} route?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes. LoadSaathi specializes in PTL (Part Truck Load) and LTL (Less Than Truck Load) freight on the ${route.from}–${route.to} corridor. PTL lets you share truck space with other shippers, saving up to 40% compared to hiring a full truck. Ideal for shipments under 3 tonnes.`
            }
          }
        ]
      }
    ]
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

export default async function handler(req) {
  const url = new URL(req.url, 'https://loadsaathi.in');
  const rawPath = url.pathname;
  const path = normalizePath(rawPath);
  const accept = (req.headers.get('accept') || '').toLowerCase();

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
      if (seoMeta) {
        const canonical = `https://loadsaathi.in${path}`;
        html = html
          .replace(/<title>.*?<\/title>/, `<title>${seoMeta.seoTitle}</title>`)
          .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${seoMeta.metaDescription}" />`)
          .replace(/<meta name="keywords" content=".*?" \/>/, `<meta name="keywords" content="${seoMeta.keywords}" />`)
          .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonical}" />`)
          .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${seoMeta.seoTitle}" />`)
          .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${seoMeta.metaDescription}" />`)
          .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonical}" />`)
          .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${seoMeta.seoTitle}" />`)
          .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${seoMeta.metaDescription}" />`);
        const jsonLd = buildJsonLd(path.slice('/routes/'.length), seoMeta);
        html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLd);
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
