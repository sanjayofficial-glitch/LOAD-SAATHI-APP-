/**
 * Single source of truth for platform facts, fees, contact info, and entity details.
 * All marketing, SEO, and UI copy MUST import from here — never hardcode these values.
 */

// ── Brand & Entity ──────────────────────────────────────────────────────────

export const BRAND_NAME = 'LoadSaathi';
export const BRAND_TAGLINE = 'Smart Freight Marketplace for East India';
export const BASE_URL = 'https://loadsaathi.in';
export const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
export const LOGO_URL = `${BASE_URL}/logo-512.png`;

// ── Contact ─────────────────────────────────────────────────────────────────

export const SUPPORT_EMAIL = 'support@loadsaathi.in';
export const SUPPORT_PHONE = '+91 83289 98031';
export const OFFICE_ADDRESS = {
  street: 'FIITJEE Campus',
  locality: 'Sector 19',
  city: 'Rourkela',
  state: 'Odisha',
  pincode: '769005',
  country: 'IN',
};
export const OFFICE_GEO = { lat: 22.2604, lng: 84.8536 };

// ── Fees (authoritative) ────────────────────────────────────────────────────
// IMPORTANT: llms.txt, pricing.md, and all public copy MUST match these values.

export const FEES = {
  /** Shipper platform fee range (percentage of shipment value) */
  shipper: { min: 1.5, max: 3.0, unit: '%' as const },
  /** Trucker platform fee range (percentage of trip value) */
  trucker: { min: 1.5, max: 2.5, unit: '%' as const },
  /** Platform commission note */
  note: 'No hidden charges. Platform fee is only charged on successful delivery.',
} as const;

/** Human-readable fee summary for SEO/llms.txt */
export const FEE_SUMMARY = `Shipper: ${FEES.shipper.min}-${FEES.shipper.max}${FEES.shipper.unit} | Trucker: ${FEES.trucker.min}-${FEES.trucker.max}${FEES.trucker.unit}`;

// ── Coverage ────────────────────────────────────────────────────────────────

export const COVERAGE = {
  /** Primary operating states */
  primaryStates: ['Odisha', 'Jharkhand', 'West Bengal', 'Chhattisgarh'] as const,
  /** Extended coverage (operational but less dense) */
  secondaryStates: [
    'Bihar', 'Andhra Pradesh', 'Telangana', 'Maharashtra',
    'Karnataka', 'Tamil Nadu', 'Madhya Pradesh', 'Rajasthan',
    'Uttar Pradesh', 'Gujarat',
  ] as const,
  /** Corridors data source: supabase/src/data/routes.ts */
  totalRoutes: 30,
  /** Headline stat for landing pages */
  headline: 'Trusted by 500+ MSMEs across East India',
} as const;

// ── Business Hours ──────────────────────────────────────────────────────────

export const BUSINESS_HOURS = {
  weekday: '09:00-18:00',
  saturday: '09:00-14:00',
  sunday: 'Closed',
  timezone: 'Asia/Kolkata',
} as const;

// ── Social Links ────────────────────────────────────────────────────────────

export const SOCIAL_LINKS = {
  linkedin: 'https://linkedin.com/company/loadsaathi',
  twitter: 'https://twitter.com/loadsaathi',
  facebook: 'https://facebook.com/loadsaathi',
  instagram: 'https://instagram.com/loadsaathi',
  whatsapp: 'https://wa.me/918328998031',
} as const;

// ── Schema Helpers ──────────────────────────────────────────────────────────

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    url: BASE_URL,
    logo: LOGO_URL,
    description: BRAND_TAGLINE,
    email: SUPPORT_EMAIL,
    telephone: SUPPORT_PHONE,
    address: {
      '@type': 'PostalAddress',
      streetAddress: OFFICE_ADDRESS.street,
      addressLocality: OFFICE_ADDRESS.city,
      addressRegion: OFFICE_ADDRESS.state,
      postalCode: OFFICE_ADDRESS.pincode,
      addressCountry: OFFICE_ADDRESS.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: OFFICE_GEO.lat,
      longitude: OFFICE_GEO.lng,
    },
    sameAs: Object.values(SOCIAL_LINKS),
  };
}

export function buildLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${BRAND_NAME} – Freight Marketplace`,
    url: BASE_URL,
    logo: LOGO_URL,
    description: 'AI-powered freight marketplace connecting MSMEs with verified truckers across East India.',
    email: SUPPORT_EMAIL,
    telephone: SUPPORT_PHONE,
    address: {
      '@type': 'PostalAddress',
      streetAddress: OFFICE_ADDRESS.street,
      addressLocality: OFFICE_ADDRESS.city,
      addressRegion: OFFICE_ADDRESS.state,
      postalCode: OFFICE_ADDRESS.pincode,
      addressCountry: OFFICE_ADDRESS.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: OFFICE_GEO.lat,
      longitude: OFFICE_GEO.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '14:00',
      },
    ],
    priceRange: `₹${FEES.shipper.min}-${FEES.shipper.max}%`,
    areaServed: [...COVERAGE.primaryStates, ...COVERAGE.secondaryStates].map(state => ({
      '@type': 'State',
      name: state,
    })),
  };
}
