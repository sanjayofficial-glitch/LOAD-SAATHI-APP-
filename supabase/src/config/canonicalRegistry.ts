/**
 * Canonical registry of all public page slugs.
 * Used by: SEO components, sitemap generation, breadcrumbs, canonical resolution.
 *
 * IMPORTANT: When adding a new page, add it to the appropriate collection here
 * AND create a matching entry in api/agent.js getSeoMeta().
 */

import { BASE_URL } from './facts';

// ── Helper ──────────────────────────────────────────────────────────────────

function canonical(path: string): string {
  return `${BASE_URL}${path}`;
}

// ── Static / Top-level pages ────────────────────────────────────────────────

export const STATIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/pricing',
  '/features',
  '/how-it-works',
  '/safety-trust',
  '/faq',
  '/privacy',
  '/terms',
  '/fare-calculator',
  '/compare',
] as const;

// ── Blog articles ───────────────────────────────────────────────────────────

export const BLOG_SLUGS = [
  'india-freight-market-2025',
  'cdl-future-india-logistics',
  'ai-matching-freight-load',
  'trucker-earnings-india',
  'sme-shipping-guide',
  'monsoon-shipping-safety',
  'freight-corridors-east-india',
  'loadsaathi-case-study-1',
  'loadsaathi-case-study-2',
  'digital-freight-marketplace-benefits',
  'how-to-find-trucks-for-load',
  'best-routes-east-india-freight',
  'reduce-shipping-costs-msme',
  'trucker-safety-checklist',
  'freight-insurance-india',
  'loading-unloading-safety',
  'gps-tracking-freight-benefits',
  'fuel-cost-management-truckers',
  'monsoon-driving-tips-truckers',
  'industrial-corridors-logistics',
  'cold-chain-logistics-india',
  'hazmat-shipping-guidelines',
  'express-freight-services',
  'warehouse-network-east-india',
  'multi-modal-transport-india',
  'digital-payment-freight',
  'freight-marketplace-trust',
  'msme-logistics-challenges',
  ' trucker-registration-loadsaathi',
  'shipper-post-load-loadsaathi',
  'smart-matching-explained',
  'credit-score-freight',
  'real-time-tracking-loadsaathi',
  'freight-rates-prediction',
  'eco-friendly-shipping',
  'truck-utilization-india',
  'load-booking-process',
  'documentation-freight-india',
  'interstate-transport-rules',
  'permits-for-truckers',
  'gst-on-freight-services',
  'toll-costs-india-truckers',
  'driver-rest-regulations',
  'fleet-management-tips',
  'india-supply-chain-optimization',
  'rourkela-industrial-hub',
  'jamshedpur-freight-routes',
  'bhubaneswar-logistics-hub',
  'kolkata-port-connectivity',
  'ranchi-transport-network',
  'bilai-steel-transport',
  'sambalpur-industrial-corr',
  'cuttack-trading-hub',
  'dhanbad-mining-transport',
  'angul-industrial-transport',
  'jajpur-industrial-transport',
  'paradeep-port-logistics',
  'vishakapatnam-port-conn',
  'raipur-logistics-hub',
  'nagpur-transport-hub',
  'patna-freight-corridor',
  'lucknow-transport-network',
  'kanpur-freight-routes',
  'jaipur-logistics-hub',
  'ahmedabad-transport-network',
  'pune-freight-routes',
  'nashik-industrial-transport',
  'surat-textile-transport',
  'vizag-port-connectivity',
  'hubli-transport-hub',
  'belgaum-freight-routes',
  'madurai-freight-transport',
  'trichy-transport-network',
  'coimbatore-logistics-hub',
] as const;

// ── Route pages (corridor detail) ───────────────────────────────────────────

export const ROUTE_SLUGS = [
  'rourkela-to-bhubaneswar',
  'rourkela-to-ranchi',
  'rourkela-to-jamshedpur',
  'rourkela-to-kolkata',
  'rourkela-to-raipur',
  'rourkela-to-nagpur',
  'bhubaneswar-to-kolkata',
  'bhubaneswar-to-visakhapatnam',
  'bhubaneswar-to-raipur',
  'ranchi-to-jamshedpur',
  'ranchi-to-patna',
  'ranchi-to-kolkata',
  'jamshedpur-to-kolkata',
  'jamshedpur-to-patna',
  'raipur-to-nagpur',
  'raipur-to-hyderabad',
  'raipur-to-bilaspur',
  'kolkata-to-haldia-port',
  'kolkata-to-mumbai',
  'kolkata-to-delhi',
  'patna-to-varanasi',
  'patna-to-kolkata',
  'nagpur-to-mumbai',
  'nagpur-to-hyderabad',
  'nagpur-to-pune',
  'hyderabad-to-bangalore',
  'hyderabad-to-chennai',
  'visakhapatnam-to-hyderabad',
  'visakhapatnam-to-chennai',
  'bhubaneswar-to-hyderabad',
] as const;

// ── Guide pages ─────────────────────────────────────────────────────────────

export const GUIDE_SLUGS = [
  'ptl-vs-ftl',
  'freight-rates-east-india',
  'shipping-steel',
] as const;

// ── Location pages ──────────────────────────────────────────────────────────
// Import from locations.json and generate dynamically — kept as function
// to avoid hardcoding 1000+ slugs.

import locationsData from '../data/locations.json';

interface LocationsJson {
  metadata: {
    platform: string;
    purpose: string;
    total_states: number;
    last_updated: string;
  };
  data: Record<string, Record<string, string[]>>;
}

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

function generateLocationSlugs(): string[] {
  const locations = (locationsData as LocationsJson).data;
  const slugs: string[] = [];

  for (const [stateName, districts] of Object.entries(locations)) {
    slugs.push(`location/${slugify(stateName)}`);

    for (const [districtName, cities] of Object.entries(districts)) {
      slugs.push(`location/${slugify(districtName)}`);

      for (const city of cities) {
        slugs.push(`location/${slugify(city)}`);
      }
    }
  }

  // Dedupe: district and city names often overlap (e.g. Anantapur).
  return [...new Set(slugs)];
}

/** All location slugs (state / district / city) */
export const LOCATION_SLUGS: string[] = generateLocationSlugs();

// ── All public pages combined ───────────────────────────────────────────────

/** Flat list of all public paths (without leading slash) */
export const ALL_PUBLIC_PATHS = [
  ...STATIC_ROUTES.map(r => r.slice(1) || ''),
  ...BLOG_SLUGS.map(s => `blog/${s}`),
  ...ROUTE_SLUGS.map(s => `routes/${s}`),
  ...GUIDE_SLUGS.map(s => `guide/${s}`),
  ...LOCATION_SLUGS,
] as const;

/** Total count — used by sitemap generation & tests */
export const TOTAL_PUBLIC_PAGES = ALL_PUBLIC_PATHS.length;

// ── Canonical resolution ────────────────────────────────────────────────────

/**
 * Resolve the canonical URL for any public path.
 * Returns undefined for non-public paths (admin, auth, etc.).
 */
export function resolveCanonical(path: string): string | undefined {
  const normalized = path.startsWith('/') ? path.slice(1) : path;

  if ((STATIC_ROUTES as readonly string[]).includes(normalized)) {
    return canonical(normalized === '' ? '/' : `/${normalized}`);
  }

  if (BLOG_SLUGS.some(s => normalized === `blog/${s}`)) {
    return canonical(`/${normalized}`);
  }

  if (ROUTE_SLUGS.some(s => normalized === `routes/${s}`)) {
    return canonical(`/${normalized}`);
  }

  if (GUIDE_SLUGS.some(s => normalized === `guide/${s}`)) {
    return canonical(`/${normalized}`);
  }

  if (LOCATION_SLUGS.some(s => normalized === s)) {
    return canonical(`/${normalized}`);
  }

  return undefined;
}
