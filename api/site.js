/**
 * Single source of truth for site-level facts.
 *
 * Plain ESM with no imports and no Node built-ins so it is safe to load from
 * the Edge runtime (api/agent.js) as well as from build-time Node scripts.
 * The React app mirrors these fields in supabase/src/config/site.ts — keep the
 * two in sync (scripts/smoke.mjs asserts the coverage numbers match the
 * generated sitemap).
 */

export const SITE_URL = 'https://loadsaathi.in';
export const BRAND = 'LoadSaathi';
export const TAGLINE = "India's AI-Powered Freight Marketplace";

export const PHONE_DISPLAY = '+91-83289-98031';
export const PHONE_E164 = '+918328998031';
export const EMAIL = 'support@loadsaathi.in';

export const ADDRESS = {
  street: 'First Floor, FTBI, T1-109, National Institute of Technology, Sector 1',
  city: 'Rourkela',
  region: 'Odisha',
  postalCode: '769008',
  country: 'IN',
};

/** The six profiles already asserted in index.html's Organization.sameAs. */
export const SOCIALS = [
  { name: 'X', url: 'https://x.com/LoadSaathi' },
  { name: 'Facebook', url: 'https://www.facebook.com/people/Load-Saathi/61590859902405/' },
  { name: 'Instagram', url: 'https://www.instagram.com/loadsaathi/' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/load-saathi-119867422/' },
  { name: 'Reddit', url: 'https://www.reddit.com/user/Loadsaathi/' },
  { name: 'Threads', url: 'https://www.threads.com/@loadsaathi' },
];

export const OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Verifiable counts. `sitemapUrls` must equal the number of <url> entries in
 * public/sitemap.xml; `freightRoutes` / `cityPages` must equal the number of
 * /routes/* and /location/* entries in it. scripts/smoke.mjs enforces this.
 */
export const COVERAGE = {
  sitemapUrls: 215,
  freightRoutes: 48,
  cityPages: 14,
};

/** Service lines described across the marketing pages. */
export const SERVICES = {
  ptl: 'PTL (partial truckload)',
  ltl: 'LTL (less-than-truckload)',
  ftl: 'FTL (full truckload)',
};

/** Fee percentages quoted on /pricing, /about and the trust pages. */
export const FEES = {
  shipper: '1.5–3%',
  trucker: '1.5–2.5%',
};

/**
 * Trim a summary/description to a search-snippet-safe length without cutting a
 * word in half. Falls back to a hard cut only when no earlier word boundary
 * exists (very short input).
 *
 * The React pages (BlogArticle, LocationPage, GuidePage, TransportServicePage)
 * call the identical helper from @/config/site so the server-injected <meta
 * name="description"> and the post-hydration one are byte-identical.
 */
export function clampMetaDescription(text, max = 160) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = lastSpace > 60 ? cut.slice(0, lastSpace) : cut.slice(0, max);
  return trimmed.replace(/[\s,;:.\-–—]+$/, '').trim();
}