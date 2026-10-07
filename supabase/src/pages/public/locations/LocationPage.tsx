import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowRight, Truck, Clock } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";
import { routes } from "@/data/routes";
import { clampMetaDescription } from "@/config/site";
import { cityData } from "@/data/locations";


// URL-slug aliases → cityData key. Canonical slug is what the sitemap lists.
const CITY_ALIASES: Record<string, { key: string; canonicalSlug: string }> = {
  visakhapatnam: { key: "vizag", canonicalSlug: "visakhapatnam" },
  vizag: { key: "vizag", canonicalSlug: "visakhapatnam" },
};

export default function LocationPage() {
  const { city } = useParams<{ city: string }>();
  const slug = city ? city.toLowerCase() : "";
  const alias = CITY_ALIASES[slug];
  const data = city ? (alias ? cityData[alias.key] : cityData[slug]) : null;
  const canonicalSlug = (alias?.canonicalSlug ?? slug) || "";

  if (!data) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#050816] flex items-center justify-center">
        <SeoMeta title="City Not Found" description="We do not have a page for this city yet." robots="noindex, nofollow" />
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-4xl font-black text-foreground mb-4">City Not Found</h1>
          <p className="text-muted-foreground mb-8">We don't have a page for this city yet. Check back soon!</p>
          <Link to="/routes">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold">
              Browse All Routes
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const cityRoutes = routes.filter(
    (r) =>
      r.from.toLowerCase() === data.name.toLowerCase() ||
      r.to.toLowerCase() === data.name.toLowerCase()
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Freight Transport in ${data.name}, ${data.state} — LoadSaathi`,
    description: data.description,
    url: `https://loadsaathi.in/location/${canonicalSlug}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".city-snippet-answer"],
    },
    isPartOf: { "@type": "WebSite", name: "LoadSaathi", url: "https://loadsaathi.in" },
    about: {
      "@type": "Place",
      name: data.name,
      address: { "@type": "PostalAddress", addressRegion: data.state, addressCountry: "IN" },
    },
  };

  const faqSchema = data.localFaq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "QAPage",
    name: `Frequently Asked Questions — Freight Transport in ${data.name}`,
    mainEntity: data.localFaq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h2>{data.name} Freight Transport — LoadSaathi</h2>
          <p>{data.description}</p>
          <ul>
            <li><strong>State:</strong> {data.state}</li>
            <li><strong>Industries:</strong> {data.industries.join(', ')}</li>
          </ul>
        </div>
      </noscript>
      <SeoMeta
        title={`Freight Transport in ${data.name}, ${data.state} — LoadSaathi`}
        description={clampMetaDescription(data.description)}
        keywords={`freight ${data.name.toLowerCase()}, truck booking ${data.name.toLowerCase()}, PTL ${data.name.toLowerCase()}, logistics ${data.name.toLowerCase()} ${data.state.toLowerCase()}`}
        canonical={`/location/${canonicalSlug}`}
        jsonLd={faqSchema ? [schema, faqSchema] : schema}
        breadcrumbs={[
          { name: "Routes", url: "/routes" },
          { name: data.name, url: `/location/${canonicalSlug}` },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        {/* Hero */}
        <section className={`bg-gradient-to-br ${data.heroGradient} text-white py-20 px-6`}>
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
              <MapPin className="h-4 w-4" />
              <span>{data.state}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4">
              Freight Transport in {data.name}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-[700px] mb-8">
              {data.description}
            </p>
            {/* Snippet bait: self-contained answer for featured snippets / AI answers */}
            <p className="city-snippet-answer text-base sm:text-lg text-white max-w-[700px] mb-8 font-medium">
              Need a truck in {data.name}, {data.state}? LoadSaathi connects shippers with verified local truckers for PTL and full-load freight across {data.hubDistances.map((h) => h.city).join(", ")} corridors, with live GPS tracking and transparent per-kg pricing. Post your load free and get matched in minutes.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors"
            >
              Start Shipping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Industries */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">Industries Served in {data.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.industries.map((industry) => (
                <div key={industry} className="glass-card p-4 rounded-xl border border-border text-center">
                  <span className="text-sm font-semibold text-foreground">{industry}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Commodities */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">Key Commodities from {data.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.commodities.map((item) => (
                <div key={item} className="glass-card p-4 rounded-xl border border-border">
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Distance to Hubs */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">Distance from {data.name} to Major Hubs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.hubDistances.map((hub) => (
                <div key={hub.city} className="glass-card p-5 rounded-xl border border-border text-center">
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{hub.km} km</p>
                  <p className="text-sm text-muted-foreground mt-1">to {hub.city}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rate Ranges */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">Typical Freight Rates from {data.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.rateRanges.map((rr) => (
                <div key={rr.type} className="glass-card p-5 rounded-xl border border-border text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{rr.type}</p>
                  <p className="text-xl font-bold text-foreground">{rr.range}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Routes from this city */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Freight Routes from {data.name}
            </h2>
            <p className="text-muted-foreground mb-8">
              {cityRoutes.length} active corridors connecting {data.name} to major cities across East India.
            </p>
            {cityRoutes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cityRoutes.map((route) => (
                  <Link
                    key={route.slug}
                    to={`/routes/${route.slug}`}
                    className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {route.from} → {route.to}
                      </span>
                      <ArrowRight className="h-4 w-4 text-orange-400 shrink-0" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" /> {route.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> ~{route.transitTime} hrs
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Routes coming soon. Check back later!</p>
            )}
          </div>
        </section>

        {/* FAQ */}
        {data.localFaq.length > 0 && (
          <section className="py-16 px-6">
            <div className="max-w-[1200px] mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Frequently Asked Questions — {data.name} Freight
              </h2>
              <div className="space-y-4">
                {data.localFaq.map((faq, i) => (
                  <div key={i} className="glass-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-3">{faq.q}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ship from {data.name} with LoadSaathi
            </h2>
            <p className="text-muted-foreground mb-8">
              Join hundreds of shippers and truckers in {data.name} using AI-powered freight matching to save time and money.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                Get Started Free
              </Link>
              <Link to="/routes" className="border border-border hover:border-orange-500/30 text-foreground px-8 py-3 rounded-lg font-semibold transition-colors">
                Browse All Routes
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
