import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Truck, Route as RouteIcon } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";
import DirectAnswer from "@/components/DirectAnswer";
import OdishaLeadWidget from "@/components/odisha/OdishaLeadWidget";
import OdishaAeoAndSchema from "@/components/odisha/OdishaAeoAndSchema";
import { odishaHubs, odishaDistricts } from "@/data/odishaHubs";

/**
 * /odisha — standalone Odisha Hub page (additive, zero overlap with
 * /location/* and /routes/*; it only LINKS to those existing pages).
 */

const HIGHWAY_CORRIDORS = [
  {
    highway: "NH-16",
    segment: "East Coast corridor — Kolkata ↔ Bhubaneswar ↔ Cuttack ↔ Brahmapur ↔ Visakhapatnam",
    towns: "Balasore, Cuttack, Bhubaneswar, Berhampur",
  },
  {
    highway: "NH-53",
    segment: "Coastal-to-western — Cuttack ↔ Angul ↔ Sambalpur ↔ Jharsuguda",
    towns: "Angul, Talcher, Sambalpur, Jharsuguda",
  },
  {
    highway: "NH-143",
    segment: "Rourkela ↔ Rajgangpur ↔ Lahunipara (toward Ranchi)",
    towns: "Rourkela, Rajgangpur",
  },
  {
    highway: "NH-520",
    segment: "Rourkela ↔ Jharsuguda western coal belt",
    towns: "Rourkela, Jharsuguda",
  },
  {
    highway: "NH-49",
    segment: "Western corridor — Sambalpur ↔ Jharsuguda ↔ Chhattisgarh border",
    towns: "Sambalpur, Jharsuguda",
  },
];

const EXISTING_LOCATION_PAGES = [
  { slug: "rourkela", label: "Rourkela" },
  { slug: "bhubaneswar", label: "Bhubaneswar" },
  { slug: "cuttack", label: "Cuttack" },
  { slug: "angul", label: "Angul" },
  { slug: "jharsuguda", label: "Jharsuguda" },
  { slug: "sambalpur", label: "Sambalpur" },
  { slug: "balasore", label: "Balasore" },
  { slug: "berhampur", label: "Berhampur" },
];

const EXISTING_ROUTE_PAGES = [
  "rourkela-to-ranchi",
  "ranchi-to-rourkela",
  "rourkela-to-bhubaneswar",
  "bhubaneswar-to-rourkela",
  "rourkela-to-cuttack",
  "cuttack-to-rourkela",
  "rourkela-to-kolkata",
  "kolkata-to-rourkela",
  "rourkela-to-sambalpur",
  "sambalpur-to-rourkela",
  "jamshedpur-to-rourkela",
  "rourkela-to-jamshedpur",
  "ranchi-to-bhubaneswar",
  "jamshedpur-to-bhubaneswar",
  "bhubaneswar-to-jamshedpur",
  "sambalpur-to-bhubaneswar",
  "bhubaneswar-to-sambalpur",
  "sambalpur-to-jharsuguda",
  "jharsuguda-to-sambalpur",
  "balasore-to-bhubaneswar",
  "bhubaneswar-to-balasore",
  "berhampur-to-bhubaneswar",
  "bhubaneswar-to-berhampur",
  "cuttack-to-bhubaneswar",
  "bhubaneswar-to-cuttack",
  "bhubaneswar-to-kolkata",
  "kolkata-to-bhubaneswar",
  "bhubaneswar-to-vizag",
  "visakhapatnam-to-bhubaneswar",
];

export default function OdishaHub() {
  const hubs = Object.values(odishaHubs);

  return (
    <>
      <SeoMeta
        title="Odisha Truck Booking, PTL & Return Load Hub (All 30 Districts)"
        description="Odisha's freight hub: book FTL, PTL & return loads across all 30 districts with verified fleet. Compare NH-16/NH-53/NH-143 corridor rates and get an instant quote."
        keywords="odisha truck booking, ptl odisha, return load odisha, truck rate odisha, rourkela bhubaneswar truck"
        canonical="/odisha"
        breadcrumbs={[
          { name: "Routes", url: "/routes" },
          { name: "Odisha Hub", url: "/odisha" },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        {/* Hero */}
        <section className="bg-gradient-to-br from-orange-600 to-red-700 text-white py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
              <MapPin className="h-4 w-4" />
              <span>Odisha, India</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
              Odisha Truck Booking, PTL &amp; Return Load Hub
            </h1>
            <p className="text-lg text-white/90 max-w-[720px] mb-6">
              All 30 districts · Rourkela HQ (FTBI, NIT Rourkela)
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 max-w-[720px]">
              <DirectAnswer
                answer="LoadSaathi is an AI-powered freight marketplace headquartered in Rourkela. Odisha, connecting shippers with KYC-verified truck owners for Full Truck Load (FTL), Part Truck Load (PTL), and return-load matching across all 30 districts. Book a 14ft to 40ft trailer in under 2 minutes via the fare calculator or WhatsApp +91-83289-98031."
                qualifier="Indicative 2026 rates — live quotes vary by truck type, season, and load."
              />
            </div>
          </div>
        </section>

        {/* Highway corridor rate table */}
        <section className="py-14 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Odisha Highway Corridor Rate Map
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              FTL ≈ ₹85–120/km trip rate; PTL ≈ ₹17–24 per tonne-km (floor ₹1,200/tonne) — the same model the fare calculator uses.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 dark:bg-white/[0.02] text-left">
                    <th className="px-4 py-3 font-bold text-foreground">Highway</th>
                    <th className="px-4 py-3 font-bold text-foreground">Route Segment</th>
                    <th className="px-4 py-3 font-bold text-foreground">Key Freight Towns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {HIGHWAY_CORRIDORS.map((row) => (
                    <tr key={row.highway}>
                      <td className="px-4 py-3 font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">{row.highway}</td>
                      <td className="px-4 py-3 text-foreground">{row.segment}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.towns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Instant rate widget */}
        <section className="py-8 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <OdishaLeadWidget defaultOrigin="" leadSource="odisha_hub" />
          </div>
        </section>

        {/* Industrial hubs */}
        <section className="py-14 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">Odisha Industrial Hubs</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Dedicated pages for Odisha's heaviest B2B freight generators.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hubs.map((hub) => (
                <Link
                  key={hub.slug}
                  to={`/odisha/${hub.slug}`}
                  className={`glass-card p-5 rounded-xl border border-border hover:border-orange-500/40 transition-all group bg-gradient-to-br ${hub.heroGradient}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{hub.name}</h3>
                      <p className="text-sm text-white/85 mb-3">{hub.tagline}</p>
                      <p className="text-xs text-white/70 line-clamp-2">{hub.intro}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/80 shrink-0 ml-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All 30 districts */}
        <section className="py-14 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">All 30 Districts Covered</h2>
            <p className="text-sm text-muted-foreground mb-6">
              From Sundargarh to Malkangiri — verified fleet and return-load matching in every Odisha district.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {odishaDistricts.map((d) => (
                <div key={d.name} className="glass-card p-3 rounded-lg border border-border">
                  <p className="text-sm font-semibold text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.industry}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Existing pages */}
        <section className="py-14 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">Explore Existing Odisha Pages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-foreground mb-3">
                  <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" /> City locations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {EXISTING_LOCATION_PAGES.map((loc) => (
                    <Link
                      key={loc.slug}
                      to={`/location/${loc.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:border-orange-500/40 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {loc.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-foreground mb-3">
                  <RouteIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" /> Corridor routes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {EXISTING_ROUTE_PAGES.map((slug) => (
                    <Link
                      key={slug}
                      to={`/routes/${slug}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:border-orange-500/40 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      {slug.split("-to-").join(" → ")}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AEO + schema */}
        <section className="py-14 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <OdishaAeoAndSchema cityOrRouteName="Odisha" pageUrl="https://loadsaathi.in/odisha" />
          </div>
        </section>
      </div>
    </>
  );
}
