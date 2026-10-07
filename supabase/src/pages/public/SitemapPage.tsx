import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Route as RouteIcon, BookOpen, Wrench, Globe } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";
import { routes } from "@/data/routes";
import { getBlogListItems } from "@/data/blog";
import { guideData } from "@/data/guides";
import { cityData } from "@/data/locations";
import { TRANSPORT_SERVICES } from "@/data/transportServices";

/**
 * HTML sitemap for crawlers and visitors.
 *
 * Every list is derived from the same module the routed pages read, so this
 * page can never list a URL that 404s or miss one that exists. Static entries
 * mirror the STATIC array in scripts/generate-sitemap.mjs — same exclusion
 * policy (no /screens/*, /share/*, auth, or private app routes).
 */

const STATIC_PAGES: { group: string; links: { label: string; path: string }[] }[] = [
  {
    group: "Main",
    links: [
      { label: "Home", path: "/" },
      { label: "Features", path: "/features" },
      { label: "How It Works", path: "/how-it-works" },
      { label: "Pricing", path: "/pricing" },
      { label: "FAQ", path: "/faq" },
      { label: "Contact", path: "/contact" },
      { label: "Safety & Trust", path: "/safety-trust" },
      { label: "Compare", path: "/compare" },
    ],
  },
  {
    group: "Solutions",
    links: [
      { label: "For Shippers", path: "/solutions/shippers" },
      { label: "For Truckers", path: "/solutions/truckers" },
      { label: "For MSMEs", path: "/for-msmes" },
      { label: "AI Logistics", path: "/ai-logistics" },
      { label: "Freight Data", path: "/data" },
    ],
  },
  {
    group: "Freight",
    links: [
      { label: "All Routes", path: "/routes" },
      { label: "Return Loads", path: "/return-load" },
      { label: "PTL Transport", path: "/ptl-transport" },
      { label: "LTL Transport", path: "/ltl-transport" },
      { label: "Truck Load Booking", path: "/truck-load-booking" },
      { label: "Freight Marketplace", path: "/freight-marketplace" },
      { label: "Truck Near Me", path: "/truck-near-me" },
    ],
  },
  {
    group: "Tools",
    links: [
      { label: "All Tools", path: "/tools" },
      { label: "Fare Calculator", path: "/tools/fare-calculator" },
      { label: "Freight Rate Calculator", path: "/tools/freight-rate-calculator" },
      { label: "Return Load Calculator", path: "/tools/return-load-calculator" },
      { label: "Truck Load Calculator", path: "/tools/truck-load-calculator" },
      { label: "PTL vs FTL", path: "/tools/ptl-vs-ftl-calculator" },
      { label: "Route Optimizer", path: "/tools/route-optimizer" },
      { label: "Empty KM Savings", path: "/tools/empty-km-savings" },
      { label: "Trip Profit", path: "/tools/trip-profit" },
      { label: "Shared Savings", path: "/tools/shared-savings" },
      { label: "Document Checklist", path: "/tools/document-checklist" },
      { label: "Carbon Savings", path: "/tools/carbon-savings" },
      { label: "Toll & Fuel", path: "/tools/toll-fuel" },
      { label: "GST Calculator", path: "/tools/gst-calculator" },
      { label: "Payload Utilization", path: "/tools/payload-utilization" },
    ],
  },
  {
    group: "Hindi",
    links: [
      { label: "होम", path: "/hi" },
      { label: "पीटीएल ट्रांसपोर्ट", path: "/hi/ptl-transport" },
      { label: "रिटर्न लोड", path: "/hi/return-load" },
      { label: "भाड़ा कैसे बुक करें", path: "/hi/bhada-kaise-book-kare" },
      { label: "राउरकेला से रांची", path: "/hi/route/rourkela-to-ranchi" },
    ],
  },
  {
    group: "Company",
    links: [
      { label: "About", path: "/about" },
      { label: "Blog", path: "/blog" },
      { label: "Gallery", path: "/gallery" },
      { label: "Privacy Policy", path: "/privacy" },
      { label: "Terms of Service", path: "/terms" },
    ],
  },
];

// vizag is the stored key; visakhapatnam is the canonical slug the sitemap and
// <link rel="canonical"> already use, so list only the canonical form.
const CITY_SLUGS: Record<string, string> = {
  vizag: "visakhapatnam",
};

const cityLinks = Object.entries(cityData).map(([key, city]) => ({
  label: `Freight Transport in ${city.name}`,
  path: `/location/${CITY_SLUGS[key] ?? key}`,
}));

const routeLinks = routes.map((r) => ({
  label: `PTL Freight ${r.from} to ${r.to}`,
  path: `/routes/${r.slug}`,
}));

const serviceLinks = Object.entries(TRANSPORT_SERVICES).map(([slug, service]) => ({
  label: `Transport Services in ${service.name}`,
  path: `/transport-service/${slug}`,
}));

const guideLinks = Object.entries(guideData).map(([slug, guide]) => ({
  label: guide.title,
  path: `/guide/${slug}`,
}));

const blogLinks = getBlogListItems().map((a) => ({
  label: a.title,
  path: `/blog/${a.slug}`,
}));

const DYNAMIC_GROUPS = [
  {
    icon: RouteIcon,
    heading: "Freight Routes",
    blurb: "Every active corridor in the LoadSaathi network, with distance, transit time and per-lane rates.",
    links: routeLinks,
  },
  {
    icon: MapPin,
    heading: "City Pages",
    blurb: "Pickup and delivery coverage by city across Odisha, Jharkhand and West Bengal.",
    links: cityLinks,
  },
  {
    icon: Globe,
    heading: "Transport Services",
    blurb: "Hub-level service pages covering commodities, industries and rate ranges for each city.",
    links: serviceLinks,
  },
  {
    icon: BookOpen,
    heading: "Guides",
    blurb: "In-depth freight guides covering PTL vs FTL, regional rate cards and steel shipment logistics.",
    links: guideLinks,
  },
  {
    icon: BookOpen,
    heading: "Blog",
    blurb: "Practical articles for shippers and truckers on rates, compliance and utilisation.",
    links: blogLinks,
  },
];

const TOTAL_LINKS =
  STATIC_PAGES.reduce((n, g) => n + g.links.length, 0) +
  DYNAMIC_GROUPS.reduce((n, g) => n + g.links.length, 0);

const SITE_DESCRIPTION =
  "Complete HTML sitemap of LoadSaathi: freight routes, city pages, calculators, guides and blog articles for PTL and LTL shipping across East India.";

function LinkColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; path: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">
        {heading}
      </h2>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.path}>
            <Link
              to={l.path}
              className="text-sm text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SitemapPage() {
  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h2>LoadSaathi Sitemap</h2>
          <p>{SITE_DESCRIPTION}</p>
          <p>
            The full HTML sitemap is also available as an XML file at
            https://loadsaathi.in/sitemap.xml
          </p>
          {STATIC_PAGES.map((g) => (
            <div key={g.group}>
              <h3>{g.group}</h3>
              <ul>
                {g.links.map((l) => (
                  <li key={l.path}>
                    <a href={`https://loadsaathi.in${l.path}`}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {DYNAMIC_GROUPS.map((g) => (
            <div key={g.heading}>
              <h3>{g.heading}</h3>
              <p>{g.blurb}</p>
              <ul>
                {g.links.map((l) => (
                  <li key={l.path}>
                    <a href={`https://loadsaathi.in${l.path}`}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </noscript>
      <SeoMeta
        title="Sitemap — All Pages & Freight Routes | LoadSaathi"
        description={SITE_DESCRIPTION}
        canonical="/sitemap"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Sitemap", url: "/sitemap" },
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "LoadSaathi Sitemap",
          description: SITE_DESCRIPTION,
          url: "https://loadsaathi.in/sitemap",
          isPartOf: {
            "@type": "WebSite",
            name: "LoadSaathi",
            url: "https://loadsaathi.in",
          },
        }}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        {/* Hero */}
        <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-14 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent dark:from-orange-500/10" />
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-orange-800/30 mb-6">
                <Wrench className="h-3.5 w-3.5" />
                Site Index
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground dark:text-white mb-6 tracking-tight">
                LoadSaathi <span className="text-orange-600 dark:text-orange-400">Sitemap</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {SITE_DESCRIPTION} All {TOTAL_LINKS} pages are listed below.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Crawlers and agents: the machine-readable version lives at{" "}
                <a
                  href="/sitemap.xml"
                  className="text-orange-600 dark:text-orange-400 font-semibold underline underline-offset-2"
                >
                  /sitemap.xml
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Static groups */}
        <section className="pb-16">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {STATIC_PAGES.map((g) => (
                <LinkColumn key={g.group} heading={g.group} links={g.links} />
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic groups */}
        {DYNAMIC_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.heading} className="pb-16">
              <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
                <div className="flex items-start gap-3 mb-6">
                  <div className="bg-orange-100 dark:bg-orange-900/30 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">
                      {group.heading}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.blurb} ({group.links.length})
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 sm:pl-14">
                  {group.links.map((l) => (
                    <Link
                      key={l.path}
                      to={l.path}
                      className="text-sm text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors py-1"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <section className="pb-24">
          <div className="max-w-xl mx-auto px-6 sm:px-12 text-center">
            <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
                Looking for a Specific Lane?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Post your shipment and our matching engine will find available trucks on
                any corridor — listed or not.
              </p>
              <Link to="/register">
                <span className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-3 rounded-lg transition-colors">
                  Post a Shipment <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}