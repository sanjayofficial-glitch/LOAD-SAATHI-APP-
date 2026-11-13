import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowRight, Truck, Route as RouteIcon } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";
import DirectAnswer from "@/components/DirectAnswer";
import OdishaLeadWidget from "@/components/odisha/OdishaLeadWidget";
import OdishaAeoAndSchema from "@/components/odisha/OdishaAeoAndSchema";
import { odishaHubs, hubBandText, type OdishaHub } from "@/data/odishaHubs";
import { clampMetaDescription } from "@/config/site";

/** hub slug → best default pickup option for the widget dropdown. */
const WIDGET_ORIGIN: Record<string, string> = {
  "kalinganagar-jajpur": "Kalinganagar",
  paradeep: "Paradeep",
  "keonjhar-barbil": "Barbil",
  "talcher-angul": "Talcher",
  dhenkanal: "Dhenkanal",
  "rayagada-koraput": "Rayagada",
};

function hubTitle(hub: OdishaHub): string {
  const base = `Truck Booking & Return Loads in ${hub.name}`;
  return base.length + 15 <= 60 ? `${base} | LoadSaathi` : base;
}

function hubDescription(hub: OdishaHub): string {
  return clampMetaDescription(
    `Verified FTL, PTL & return-load trucks in ${hub.name}, Odisha. ${hub.tagline}. Save up to 40% on freight — instant quote via WhatsApp +91-83289-98031.`
  );
}

export default function OdishaHubDetail() {
  const { hub } = useParams<{ hub: string }>();
  const data = hub ? odishaHubs[hub.toLowerCase()] : undefined;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#050816]">
        <SeoMeta title="Hub Not Found" description="The Odisha industrial hub page you are looking for does not exist." robots="noindex, nofollow" />
        <div className="text-center max-w-md mx-auto px-6">
          <Truck className="h-16 w-16 text-orange-400/50 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-foreground mb-3">Hub Not Found</h1>
          <p className="text-muted-foreground mb-6">This Odisha industrial hub page doesn't exist yet.</p>
          <Link to="/odisha">
            <span className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">
              Browse Odisha Hub <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const canonical = `/odisha/${data.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${data.name} Truck Transport — LoadSaathi`,
    description: data.intro,
    url: `https://loadsaathi.in${canonical}`,
    isPartOf: { "@type": "WebSite", name: "LoadSaathi", url: "https://loadsaathi.in" },
    about: {
      "@type": "Place",
      name: data.name,
      address: { "@type": "PostalAddress", addressRegion: data.state, addressCountry: "IN" },
    },
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    name: `Frequently Asked Questions — ${data.name} Freight`,
    mainEntity: data.localFaq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <SeoMeta
        title={hubTitle(data)}
        description={hubDescription(data)}
        keywords={`${data.name.toLowerCase()} truck booking, return load ${data.name.toLowerCase()}, ptl ${data.name.toLowerCase()}, freight ${data.slug.split("-").join(" ")}`}
        canonical={canonical}
        jsonLd={[schema, faqSchema]}
        breadcrumbs={[
          { name: "Odisha Hub", url: "/odisha" },
          { name: data.name, url: canonical },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        {/* Hero */}
        <section className={`bg-gradient-to-br ${data.heroGradient} text-white py-16 px-6`}>
          <div className="max-w-[1200px] mx-auto">
            <Link to="/odisha" className="inline-flex items-center gap-1.5 text-white/80 text-sm mb-4 hover:text-white transition-colors">
              <ArrowRight className="h-4 w-4 rotate-180" /> All Odisha hubs
            </Link>
            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
              <MapPin className="h-4 w-4" />
              <span>{data.state} · {data.tagline}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
              Truck Transport, PTL &amp; Return Loads in {data.name}
            </h1>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 max-w-[720px]">
              <DirectAnswer answer={data.intro} qualifier="Indicative 2026 rates — live quotes depend on truck type, season, and load." />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/tools/fare-calculator"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors"
              >
                Calculate Freight Rate <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Industries + commodities */}
        <section className="py-14 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Industries Served</h2>
                <div className="flex flex-wrap gap-2">
                  {data.industries.map((i) => (
                    <span key={i} className="glass-card px-3 py-1.5 rounded-lg border border-border text-sm font-semibold text-foreground">{i}</span>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Commodities Moved</h2>
                <div className="flex flex-wrap gap-2">
                  {data.commodities.map((c) => (
                    <span key={c} className="glass-card px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Corridor rates */}
        <section className="py-14 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Live Freight Rates &amp; Corridors from {data.name} (2026)
            </h2>
            <p className="text-sm text-muted-foreground mb-6 italic">
              Indicative bands from LoadSaathi's published rate model (FTL ₹85–120/km; PTL ≈ ₹17–24 per tonne-km, floor ₹1,200/tonne) — use the fare calculator for a live quote.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 dark:bg-white/[0.02] text-left">
                    <th className="px-4 py-3 font-bold text-foreground">Destination Corridor</th>
                    <th className="px-4 py-3 font-bold text-foreground">Highway</th>
                    <th className="px-4 py-3 font-bold text-foreground">Distance</th>
                    <th className="px-4 py-3 font-bold text-foreground">Common Truck Types</th>
                    <th className="px-4 py-3 font-bold text-foreground">Est. FTL (₹)</th>
                    <th className="px-4 py-3 font-bold text-foreground">PTL (₹/tonne)</th>
                    <th className="px-4 py-3 font-bold text-foreground">Transit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.corridors.map((c) => {
                    const bands = hubBandText(c.distanceKm);
                    return (
                      <tr key={`${c.destination}-${c.highway}`}>
                        <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{c.destination}</td>
                        <td className="px-4 py-3 text-orange-600 dark:text-orange-400 whitespace-nowrap">{c.highway}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.distanceKm} km</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.truckTypes.join(", ")}</td>
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">{bands.ftl}</td>
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">{bands.ptl}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.transit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Widget */}
        <section className="py-10 px-6">
          <div className="max-w-[1200px] mx-auto">
            <OdishaLeadWidget defaultOrigin={WIDGET_ORIGIN[data.slug] ?? ""} leadSource={`odisha_hub_${data.slug}`} />
          </div>
        </section>

        {/* Related route pages */}
        <section className="py-14 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground mb-4">
              <RouteIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" /> Related corridor pages
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.relatedRoutes.map((slug) => (
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
        </section>

        {/* AEO + schema */}
        <section className="py-14 px-6">
          <div className="max-w-[1200px] mx-auto">
            <OdishaAeoAndSchema
              cityOrRouteName={data.name}
              pageUrl={`https://loadsaathi.in${canonical}`}
            />
          </div>
        </section>
      </div>
    </>
  );
}
