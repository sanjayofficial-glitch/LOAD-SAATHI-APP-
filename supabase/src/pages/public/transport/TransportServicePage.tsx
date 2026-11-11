import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowRight, Truck, Clock, Package, ArrowLeftRight, Calculator } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";
import { routes } from "@/data/routes";
import { clampMetaDescription } from "@/config/site";
import { TRANSPORT_SERVICES } from "@/data/transportServices";


const SERVICE_LINKS = [
  { key: "ptl", title: "PTL Part Load", to: "/ptl-transport", Icon: Package },
  { key: "ftl", title: "FTL Full Truck", to: "/truck-load-booking", Icon: Truck },
  { key: "returnLoad", title: "Return Load Booking", to: "/return-load", Icon: ArrowLeftRight },
  { key: "quote", title: "Instant Freight Quote", to: "/tools/freight-rate-calculator", Icon: Calculator },
] as const;

export default function TransportServicePage() {
  const { city } = useParams<{ city: string }>();
  const data = city ? TRANSPORT_SERVICES[city.toLowerCase()] : undefined;

  if (!data) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#050816] flex items-center justify-center">
        <SeoMeta
          title="Transport Service Not Found | LoadSaathi"
          description="We don't have a transport service page for this city yet. Browse LoadSaathi part load and full truck booking services across East India."
          canonical="/transport-service"
          robots="noindex, nofollow"
        />
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-4xl font-black text-foreground mb-4">City Not Found</h1>
          <p className="text-muted-foreground mb-8">We don't have a transport service page for this city yet. Check back soon!</p>
          <Link to="/routes">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold">
              Browse All Routes
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const slug = (city || "").toLowerCase();
  const canonicalUrl = `/transport-service/${slug}`;
  const title = `${data.name} Part Load & FTL Truck Booking | PTL/LTL`;
  const description = clampMetaDescription(data.answer);

  const cityRoutes = routes.filter(
    (r) =>
      r.from.toLowerCase() === data.name.toLowerCase() ||
      r.to.toLowerCase() === data.name.toLowerCase()
  );

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `https://loadsaathi.in${canonicalUrl}`,
    isPartOf: { "@type": "WebSite", name: "LoadSaathi", url: "https://loadsaathi.in" },
    about: {
      "@type": "Place",
      name: data.name,
      address: { "@type": "PostalAddress", addressRegion: data.state, addressCountry: "IN" },
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.serviceFaq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "LoadSaathi",
    url: "https://loadsaathi.in",
    description: `Part load transport, PTL booking and FTL truck booking in ${data.name}, ${data.state}.`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-83289-98031",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    areaServed: [
      { "@type": "State", name: "Jharkhand" },
      { "@type": "State", name: "Odisha" },
      { "@type": "State", name: "West Bengal" },
    ],
  };

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Part Load Transport in {data.name} | PTL &amp; Goods Booking</h2>
          <p>{data.lead}</p>
          <h2>Book part load and full truck transport in {data.name}</h2>
          <p>{data.answer}</p>
          <h2>Transport services we offer in {data.name}</h2>
          <ul>
            <li><strong>PTL Part Load:</strong> {data.serviceBlurbs.ptl}</li>
            <li><strong>FTL Full Truck:</strong> {data.serviceBlurbs.ftl}</li>
            <li><strong>Return Load Booking:</strong> {data.serviceBlurbs.returnLoad}</li>
            <li><strong>Instant Freight Quote:</strong> {data.serviceBlurbs.quote}</li>
          </ul>
          <h2>Typical freight rates from {data.name}</h2>
          <ul>
            {data.rateRanges.map((rr) => (
              <li key={rr.type}><strong>{rr.type}:</strong> {rr.range}</li>
            ))}
          </ul>
          <h2>Distance from {data.name} to Major Hubs</h2>
          <ul>
            {data.hubDistances.map((h) => (
              <li key={h.city}>{h.city}: {h.km} km</li>
            ))}
          </ul>
          <h2>Frequently Asked Questions — transport services in {data.name}</h2>
          {data.serviceFaq.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
          <p>
            <a href={`https://loadsaathi.in${canonicalUrl}`}>View this page</a> |{" "}
            <a href="https://loadsaathi.in/register">Book transport on LoadSaathi</a>
          </p>
        </div>
      </noscript>
      <SeoMeta
        title={title}
        description={description}
        keywords={`part load transport ${data.name.toLowerCase()}, PTL booking ${data.name.toLowerCase()}, truck booking ${data.name.toLowerCase()}, freight service ${data.name.toLowerCase()}`}
        canonical={canonicalUrl}
        jsonLd={[webPageSchema, faqSchema, localBusinessSchema]}
        breadcrumbs={[
          { name: "Routes", url: "/routes" },
          ...(data.locationSlug
            ? [{ name: data.name, url: `/location/${data.locationSlug}` }]
            : []),
          { name: `Transport Service ${data.name}`, url: canonicalUrl },
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
              Part Load Transport in {data.name}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-[700px] mb-8">{data.lead}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors"
              >
                Start Shipping <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/tools/freight-rate-calculator"
                className="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Get Freight Quote <Calculator className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Answer */}
        <section className="py-16 px-6">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Book part load and full truck transport in {data.name}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">{data.answer}</p>
            <p className="text-xs text-muted-foreground">Last updated: 25 September 2026</p>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Transport services we offer in {data.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVICE_LINKS.map(({ key, title: serviceTitle, to, Icon }) => (
                <Link
                  key={key}
                  to={to}
                  className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="h-9 w-9 rounded-lg bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {serviceTitle}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {data.serviceBlurbs[key]}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-600 dark:text-orange-400">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Rate Ranges */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Typical freight rates from {data.name}
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Indicative market ranges. Get a precise quote for your lane with LoadSaathi's freight
              rate calculator.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.rateRanges.map((rr) => (
                <div
                  key={rr.type}
                  className="glass-card p-5 rounded-xl border border-border text-center"
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {rr.type}
                  </p>
                  <p className="text-xl font-bold text-foreground">{rr.range}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hub Distances */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Distance from {data.name} to Major Hubs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.hubDistances.map((hub) => (
                <div
                  key={hub.city}
                  className="glass-card p-5 rounded-xl border border-border text-center"
                >
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {hub.km} km
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">to {hub.city}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Industries served in {data.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.industries.map((industry) => (
                <div
                  key={industry}
                  className="glass-card p-4 rounded-xl border border-border text-center"
                >
                  <span className="text-sm font-semibold text-foreground">{industry}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commodities */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Key commodities shipped from {data.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.commodities.map((item) => (
                <div
                  key={item}
                  className="glass-card p-4 rounded-xl border border-border flex items-center gap-3"
                >
                  <Truck className="h-4 w-4 text-orange-500 shrink-0" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Routes */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Freight routes from {data.name}
            </h2>
            <p className="text-muted-foreground mb-8">
              {cityRoutes.length > 0
                ? `${cityRoutes.length} active corridors connecting ${data.name} to major cities across East India.`
                : "Direct corridor listings for this city are being added. You can still request a load on any lane."}
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
              <p className="text-muted-foreground">
                Routes coming soon.{" "}
                <Link to="/tools/freight-rate-calculator" className="text-orange-600 dark:text-orange-400 underline">
                  Request a quote for this lane
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Frequently Asked Questions — transport services in {data.name}
            </h2>
            <div className="space-y-4">
              {data.serviceFaq.map((faq, i) => (
                <div key={i} className="glass-card p-6 rounded-xl border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{faq.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Book your {data.name} transport on LoadSaathi
            </h2>
            <p className="text-muted-foreground mb-8">
              Compare truck types, rate ranges and verified trucker ratings for {data.name} before
              you confirm — no broker calls, no hidden charges.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/tools/freight-rate-calculator"
                className="border border-border hover:border-orange-500/30 text-foreground px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Freight Quote
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
