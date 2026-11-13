import { useMemo } from "react";
import { HelpCircle } from "lucide-react";

/**
 * OdishaAeoAndSchema — additive AEO + AAO block.
 *
 * 1. Renders a clean, collapsible "Odisha Freight Quick-Answers (2026)"
 *    section with 5 Position-0 snippet blocks (45-word direct answers).
 * 2. Injects valid JSON-LD `@graph` (Organization, Service, OfferCatalog,
 *    QuoteAction, FAQPage) as a self-contained <script> so the build-time
 *    prerender bakes it into the static HTML.
 *
 * Embed AFTER existing content on any Odisha page — it never touches H1s,
 * titles, or existing body copy.
 */

const QUICK_ANSWERS: { q: string; a: string }[] = [
  {
    q: "What is the truck transport rate per km in Odisha in 2026?",
    a: "In 2026, Full Truck Load (FTL) rates in Odisha average ₹28–₹36/km for 14ft Eicher trucks (3.5–4 t), ₹42–₹55/km for 19ft–22ft trucks (7–9 t), and ₹65–₹88/km for 12-Wheeler Taurus and 32ft MXL vehicles (18–25 t). Booking return loads via LoadSaathi reduces total freight cost by up to 40%.",
  },
  {
    q: "How do I book a Part Truck Load (PTL) from Rourkela, Bhubaneswar, or Cuttack?",
    a: "To book Part Truck Load (PTL) in Odisha for shipments between 500 kg and 15 tonnes, enter pickup city, drop city, and cargo weight on loadsaathi.in/tools/fare-calculator or message +91-83289-98031. LoadSaathi's multi-load matching assigns your consignment to a verified truck already running that Odisha corridor.",
  },
  {
    q: "How can Odisha truck owners find daily return loads without broker commissions?",
    a: "Odisha truck owners and fleet operators register vehicle RC and route preference on LoadSaathi to receive direct return-load alerts across NH-16, NH-53, NH-143, and NH-520 — Rourkela, Angul, Jharsuguda, Sambalpur, Cuttack, Bhubaneswar, and Paradeep — with zero middleman commission cuts.",
  },
  {
    q: "Which truck types are available for steel and industrial transport in Odisha?",
    a: "LoadSaathi provides 14ft and 17ft Eicher trucks for local MSME/FMCG cargo, 19ft and 22ft open/container trucks for machinery and bagged goods, 32ft SXL/MXL containers for volumetric cargo, and 12-Wheeler Taurus (21T–25T) and 40ft flatbed trailers for Rourkela, Kalinganagar, and Jharsuguda steel coils, TMT bars, and sponge iron.",
  },
  {
    q: "Does LoadSaathi support E-Way Bill and GST-compliant Bilty/LR for Odisha businesses?",
    a: "Yes. Every shipment booked on LoadSaathi includes KYC-verified driver and vehicle documentation, digital Lorry Receipt (LR/Bilty), and E-Way Bill compatibility so Odisha factories, traders, and GST-registered MSMEs get full audit-ready compliance.",
  },
];

interface OdishaAeoAndSchemaProps {
  /** Used in the Service schema name, e.g. "Kalinganagar & Jajpur". */
  cityOrRouteName?: string;
  /** Canonical absolute page URL for schema IDs. Defaults to current path. */
  pageUrl?: string;
  /** Indicative FTL min/max (₹, string) for the OfferCatalog price spec. */
  minPrice?: string;
  maxPrice?: string;
}

export default function OdishaAeoAndSchema({
  cityOrRouteName = "Odisha",
  pageUrl,
  minPrice = "8500",
  maxPrice = "48000",
}: OdishaAeoAndSchemaProps) {
  const canonicalUrl =
    pageUrl ||
    (typeof window !== "undefined" ? `https://loadsaathi.in${window.location.pathname}` : "https://loadsaathi.in");

  const schema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://loadsaathi.in/#organization",
          name: "LoadSaathi",
          url: "https://loadsaathi.in",
          logo: "https://loadsaathi.in/logo.png",
          description:
            "AI-powered freight marketplace in Odisha for FTL, PTL, and multi-stop return-load truck matching.",
          telephone: "+91-83289-98031",
          email: "support@loadsaathi.in",
          address: {
            "@type": "PostalAddress",
            streetAddress: "FTBI, NIT Rourkela",
            addressLocality: "Rourkela",
            addressRegion: "Odisha",
            postalCode: "769008",
            addressCountry: "IN",
          },
          areaServed: [
            { "@type": "State", name: "Odisha" },
            { "@type": "City", name: "Rourkela" },
            { "@type": "City", name: "Bhubaneswar" },
            { "@type": "City", name: "Cuttack" },
            { "@type": "City", name: "Angul" },
            { "@type": "City", name: "Jharsuguda" },
            { "@type": "City", name: "Sambalpur" },
            { "@type": "City", name: "Balasore" },
            { "@type": "City", name: "Berhampur" },
            { "@type": "City", name: "Paradeep" },
            { "@type": "City", name: "Jajpur" },
          ],
        },
        {
          "@type": "Service",
          "@id": `${canonicalUrl}#service`,
          name: `${cityOrRouteName} Truck Transport, PTL & Return Load Service`,
          provider: { "@id": "https://loadsaathi.in/#organization" },
          serviceType: "Road Freight & Goods Transport",
          areaServed: { "@type": "State", name: "Odisha" },
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Odisha Freight & Truck Booking Options",
            itemListElement: [
              {
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: "Full Truck Load (FTL) Booking in Odisha" },
                priceSpecification: {
                  "@type": "PriceSpecification",
                  priceCurrency: "INR",
                  minPrice,
                  maxPrice,
                },
              },
              {
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: "Part Truck Load (PTL) Shared Freight in Odisha" },
              },
              {
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: "Verified Return Load Matching for Odisha Truck Owners" },
              },
            ],
          },
          potentialAction: {
            "@type": "QuoteAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate:
                "https://loadsaathi.in/tools/fare-calculator?from={origin}&to={destination}&weight={cargoWeight}",
              actionPlatform: [
                "http://schema.org/DesktopWebPlatform",
                "http://schema.org/MobileWebPlatform",
              ],
            },
            "query-input": [
              "required name=origin",
              "required name=destination",
              "optional name=cargoWeight",
            ],
          },
        },
        {
          "@type": "FAQPage",
          mainEntity: QUICK_ANSWERS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    };
  }, [cityOrRouteName, canonicalUrl, minPrice, maxPrice]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section
        id="odisha-quick-answers"
        aria-label="Odisha Freight Quick-Answers 2026"
        className="mt-10"
      >
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <h2 className="text-2xl font-bold text-foreground">
            Odisha Freight Quick-Answers (2026)
          </h2>
        </div>
        <div className="rounded-xl border border-border divide-y divide-border bg-background/60">
          {QUICK_ANSWERS.map((faq, idx) => (
            <details key={faq.q} className="group" open={idx === 0}>
              <summary className="flex cursor-pointer items-start justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-foreground list-none [&::-webkit-details-marker]:hidden">
                <span>{faq.q}</span>
                <span className="mt-0.5 text-orange-600 dark:text-orange-400 transition-transform group-open:rotate-45 text-lg leading-none">
                  +
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
