import { useEffect, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Route, Truck, Package, Search, Shield, TrendingUp, CheckCircle, BookOpen, Map, Boxes, Warehouse, Repeat, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";
import DirectAnswer from "@/components/DirectAnswer";
import {
  routes,
  rateBand,
  formatINR,
  laneTitle,
  laneMetaDescription,
  findReverse,
  RATES_UPDATED_LABEL,
  type RouteInfo,
} from "@/data/routes";
import { cityLoadingPoints } from "@/data/loadingPoints";
// Metadata only — the ~400 KB article-body bundle in data/blog stays out of
// this route chunk. findRelatedArticles is generated from blog.ts by
// scripts/generate-blog-meta.mjs so it can never drift.
import { findRelatedArticles } from "@/data/blogMeta";
import QuoteLeadCard from "@/components/QuoteLeadCard";
import { trackRouteView } from "@/utils/analytics";

// Recharts (~400 KB) is below the fold — load it on demand.
const PriceTrendChart = lazy(() => import("@/components/PriceTrendChart"));

/** When the lane figures were last checked against road routing. */
const LANE_REVIEWED_LABEL = "October 2026";

const benefits = [
  {
    icon: Search,
    title: "AI-Powered Matching",
    desc: "Our algorithm finds the best truck for your load by analyzing route compatibility, capacity, pricing history, and trucker ratings in seconds.",
    stat: "2.4x",
    statLabel: "Faster Matching",
  },
  {
    icon: MapPin,
    title: "Real-Time GPS Tracking",
    desc: "Know exactly where your shipment is at every moment. Live tracking, ETA updates, and automatic milestone notifications for every load.",
    stat: "100%",
    statLabel: "Live Visibility",
  },
  {
    icon: Shield,
    title: "Digital Credit Scores",
    desc: "Every shipper and trucker has a verified digital reputation. Higher scores unlock better rates, faster matches, and priority support.",
    stat: "300-900",
    statLabel: "Credit Score Range",
  },
  {
    icon: TrendingUp,
    title: "AI Price Predictions",
    desc: "Know the fair market rate before you book. Our price prediction engine analyzes current demand, fuel costs, and route data in real time.",
    stat: "95%",
    statLabel: "Price Accuracy",
  },
];

/** Truck classes that run East India lanes — capacities from data/vehicleDimensions.ts. */
const TRUCK_TYPES = [
  { type: "14 ft truck", capacity: "2.5 t", use: "Small part loads and intra-state LTL freight" },
  { type: "19 ft truck", capacity: "5.5 t", use: "Mid-size PTL loads and consolidated shipments" },
  { type: "22 ft truck", capacity: "7.5–10 t", use: "Large part loads and full-truck moves" },
  { type: "32 ft MXL container", capacity: "16 t", use: "Containerised FTL freight on long-haul lanes" },
  { type: "Multi-axle trailer", capacity: "25 t", use: "Steel coils, machinery and oversize cargo" },
];

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Rourkela": { lat: 22.2604, lng: 84.8536 },
  "Ranchi": { lat: 23.3441, lng: 85.3096 },
  "Bhubaneswar": { lat: 20.2961, lng: 85.8245 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Jamshedpur": { lat: 22.8046, lng: 86.2029 },
  "Cuttack": { lat: 20.4625, lng: 85.8830 },
  "Durgapur": { lat: 23.5204, lng: 87.3119 },
  "Asansol": { lat: 23.6739, lng: 86.9524 },
  "Burdwan": { lat: 23.2324, lng: 87.8615 },
  "Howrah": { lat: 22.5726, lng: 88.2663 },
  "Kharagpur": { lat: 23.3460, lng: 87.2320 },
  "Jharsuguda": { lat: 21.8557, lng: 84.0067 },
  "Sambalpur": { lat: 21.4704, lng: 83.9709 },
  "Angul": { lat: 20.8430, lng: 84.0067 },
  "Balasore": { lat: 21.4934, lng: 86.9324 },
  "Delhi": { lat: 28.7041, lng: 77.1025 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Nagpur": { lat: 21.1458, lng: 79.0882 },
  "Raipur": { lat: 21.2514, lng: 81.6296 },
  "Patna": { lat: 25.6093, lng: 85.1376 },
  "Bokaro": { lat: 23.6693, lng: 86.1511 },
  "Paradip": { lat: 20.2662, lng: 86.6163 },
  "Vizag": { lat: 17.6868, lng: 83.2185 },
  "Bhilai": { lat: 21.2187, lng: 81.4297 },
};

function citySchema(name: string) {
  const coords = CITY_COORDS[name];
  const schema: Record<string, unknown> = { "@type": "City", name };
  if (coords) {
    schema.geo = { "@type": "GeoCoordinates", latitude: coords.lat, longitude: coords.lng };
  }
  return schema;
}

const howItWorks = [
  {
    step: "1",
    title: "Post Your Load",
    desc: "Enter origin, destination, weight, dimensions, and pickup window. Takes less than 3 minutes.",
  },
  {
    step: "2",
    title: "AI Matches Trucks",
    desc: "Our algorithm evaluates hundreds of factors to rank the best truckers for your specific shipment.",
  },
  {
    step: "3",
    title: "Book & Track",
    desc: "Confirm the match and track your shipment live from pickup to delivery with GPS tracking.",
  },
  {
    step: "4",
    title: "Pay & Review",
    desc: "Pay securely through the platform. Leave a review and build your digital reputation for future shipments.",
  },
];

/** "~1 hours" → "~1 hour"; every other value keeps the plural. */
function hoursLabel(t: string, unit: "hour" | "hrs" = "hour") {
  const one = Number(t) === 1;
  if (unit === "hour") return one ? "1 hour" : `${t} hours`;
  return one ? "1 hr" : `${t} hrs`;
}

/** One link card whose accessible text is the full lane phrase. */
function RouteLinkCard({ r }: { r: RouteInfo }) {
  return (
    <Link
      to={`/routes/${r.slug}`}
      className="glass-card p-4 rounded-xl border border-border hover:border-orange-500/30 transition-all group flex items-center justify-between"
    >
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{r.from}</span>
          <ArrowRight className="h-3 w-3 text-orange-400" />
          <span className="text-sm font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{r.to}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          part load transport · {r.distanceKm} km · ~{r.transitTime} hrs
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-orange-400 shrink-0 ml-2" />
    </Link>
  );
}

export default function RouteDetail() {
  const { slug } = useParams<{ slug: string }>();
  const route = slug ? routes.find((r) => r.slug === slug.toLowerCase()) : null;

  useEffect(() => {
    if (route) {
      trackRouteView({
        route_slug: route.slug,
        origin: route.from,
        destination: route.to,
        distance_km: route.distanceKm,
      });
    }
  }, [route]);

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#050816]">
        <SeoMeta title="Route Not Found" description="The freight route you are looking for does not exist." robots="noindex, nofollow" />
        <div className="text-center max-w-md mx-auto px-6">
          <Truck className="h-16 w-16 text-orange-400/50 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-foreground mb-3">Route Not Found</h1>
          <p className="text-muted-foreground mb-6">The freight route you're looking for doesn't exist or has been removed.</p>
          <Link to="/routes">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Browse All Routes <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const crossState = route.fromState !== route.toState;
  const stateLabel = crossState
    ? `${route.fromState} → ${route.toState}`
    : `Within ${route.fromState}`;

  // ── Single source of truth: every price on this page (meta, snippet, FAQ,
  // table, schema) is generated from these bands. ─────────────────────────
  const bands = rateBand(route);
  const metaDescription = laneMetaDescription(route);
  const reverse = findReverse(route);

  const originPoints = cityLoadingPoints[route.from];
  const destPoints = cityLoadingPoints[route.to];

  const originSiblings = routes
    .filter((r) => r.from === route.from && r.slug !== route.slug)
    .slice(0, 4);
  const destSiblings = routes
    .filter((r) => r.to === route.to && r.from !== route.from && r.slug !== route.slug)
    .slice(0, 3);

  // ── Shared FAQ copy: rendered visibly AND emitted as FAQPage schema, so
  // structured data can never disagree with the page. ────────────────────
  const faqs: { q: string; a: string }[] = [
    {
      q: `What is the freight cost from ${route.from} to ${route.to}?`,
      a: `FTL truck rates from ${route.from} to ${route.to} (${route.distanceKm} km) range from ₹${formatINR(bands.perTruckMin)} to ₹${formatINR(bands.perTruckMax)} per trip (₹${bands.perKmMin}–₹${bands.perKmMax} per km) depending on truck type. Part load (PTL) rates are ₹${formatINR(bands.perTonneMin)}–${formatINR(bands.perTonneMax)} per tonne (₹${bands.perKgMin}–${bands.perKgMax} per kg). Rates updated ${RATES_UPDATED_LABEL} — they move with diesel prices and return-truck availability. Use LoadSaathi's freight rate calculator for a precise quote based on your cargo weight and truck preference.`,
    },
    {
      q: `How long does delivery take from ${route.from} to ${route.to}?`,
      a: `Delivery from ${route.from} to ${route.to} takes approximately ${hoursLabel(route.transitTime)} for direct FTL shipments over ${route.distanceKm} km. PTL shipments may take ${Math.round(Number(route.transitTime) * 1.3)}–${Math.round(Number(route.transitTime) * 1.5)} hours due to consolidation stops. LoadSaathi's GPS tracking provides real-time ETAs and milestone notifications.`,
    },
    {
      q: `What truck types operate on the ${route.from}–${route.to} route?`,
      a: `Available truck types on the ${route.from}–${route.to} corridor include 14 ft trucks (2.5 t), 19 ft trucks (5.5 t), 22 ft trucks (7.5–10 t), 32 ft MXL containers (16 t) and multi-axle trailers (25 t). The best truck type depends on your cargo weight, dimensions, and special requirements. LoadSaathi's AI matcher recommends the optimal truck for your shipment.`,
    },
    {
      q: `Is PTL shipping available on the ${route.from}–${route.to} route?`,
      a: `Yes. LoadSaathi specializes in PTL (Part Truck Load) and LTL (Less Than Truck Load) freight on the ${route.from}–${route.to} corridor. PTL lets you share truck space with other shippers and costs less than booking a full truck for loads under 5 tonnes — part-load rates on this lane are ₹${formatINR(bands.perTonneMin)}–${formatINR(bands.perTonneMax)} per tonne. Ideal for shipments under 3 tonnes.`,
    },
    {
      q: `Can I track my ${route.from} to ${route.to} shipment in real time?`,
      a: `Yes. Every LoadSaathi shipment comes with live GPS tracking. You can see your truck's location on a map, receive estimated time of arrival updates, and get notified at pickup confirmation, in-transit milestones, and delivery completion. Share the tracking link with your supply chain partners automatically.`,
    },
    {
      q: `Is there a minimum weight for PTL shipping from ${route.from} to ${route.to}?`,
      a: `No fixed minimum. PTL freight on this corridor is priced per tonne (₹${formatINR(bands.perTonneMin)}–${formatINR(bands.perTonneMax)} per tonne, i.e. ₹${bands.perKgMin}–${bands.perKgMax} per kg), so you only pay for the truck space you use. Even a few hundred kilos can ship cost-effectively by sharing truck space. Enter your exact weight in LoadSaathi's freight rate calculator for a precise quote.`,
    },
    {
      q: `What documents are needed for ${route.from} to ${route.to} freight?`,
      a: `Standard documentation for part load and full truck shipments on this lane: a consignment note (LR), GST invoice or bill of supply, e-way bill for consignments above ₹50,000, packing list, and route permits where applicable. Delivery is confirmed with proof of delivery (POD) in the LoadSaathi app.`,
    },
  ];

  const routeSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: laneTitle(route),
        description: metaDescription,
        url: `https://loadsaathi.in/routes/${route.slug}`,
        provider: {
          "@type": "Organization",
          name: "LoadSaathi",
          url: "https://loadsaathi.in",
          logo: "https://loadsaathi.in/logo.png"
        },
        areaServed: [
          { ...citySchema(route.from), containedInPlace: { "@type": "State", name: route.fromState } },
          { ...citySchema(route.to), containedInPlace: { "@type": "State", name: route.toState } }
        ],
        serviceType: ["Part load transport", "PTL", "LTL", "FTL"],
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: Math.round(bands.perTruckMin),
          priceSpecification: {
            "@type": "PriceSpecification",
            minPrice: Math.round(bands.perTruckMin),
            maxPrice: Math.round(bands.perTruckMax),
            priceCurrency: "INR",
            description: `Full truck (FTL) rate band for the ${route.distanceKm} km ${route.from}–${route.to} lane; part load from ₹${formatINR(bands.perTonneMin)}/tonne. Rates updated ${RATES_UPDATED_LABEL}.`
          },
          availability: "https://schema.org/InStock"
        }
      },
      {
        "@type": "FAQPage",
        "name": `Frequently Asked Questions — ${route.from} to ${route.to} Freight`,
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", ".route-snippet-answer"]
        },
        "mainEntity": faqs.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.a
          }
        }))
      },
      {
        "@type": "Table",
        "about": `PTL vs FTL freight comparison for ${route.from} to ${route.to} (${route.distanceKm} km)`,
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": `PTL shared freight ${route.from} to ${route.to}: ₹${formatINR(bands.perTonneMin)}–₹${formatINR(bands.perTonneMax)} per tonne (₹${bands.perKgMin}–₹${bands.perKgMax} per kg), transit ~${Math.round(Number(route.transitTime) * 1.4)} hours, best for loads under 5 tonnes`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": `FTL full truck ${route.from} to ${route.to}: ₹${formatINR(bands.perTruckMin)}–₹${formatINR(bands.perTruckMax)} per trip (₹${bands.perKmMin}–₹${bands.perKmMax} per km), transit ~${route.transitTime} hours, best for loads of 5 tonnes and above`
            }
          ]
        }
      }
    ]
  };

  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h2>{route.from} to {route.to} Freight Route — LoadSaathi</h2>
          <p>{route.description}</p>
          <ul>
            <li><strong>Distance:</strong> {route.distanceKm} km</li>
            <li><strong>Transit Time:</strong> {route.transitTime} hours</li>
            <li><strong>From:</strong> {route.from}, {route.fromState}</li>
            <li><strong>To:</strong> {route.to}, {route.toState}</li>
          </ul>
          <h2>Route Details</h2>
          <p>{metaDescription}</p>
        </div>
      </noscript>
      <SeoMeta
        title={laneTitle(route)}
        description={metaDescription}
        canonical={`/routes/${route.slug}`}
        keywords={route.keywords}
        // Only the lanes with a real Hindi twin carry the reciprocal
        // alternate — unpaired hreflang annotations are ignored by Google.
        alternates={
          route.slug === "rourkela-to-ranchi"
            ? [{ hreflang: "hi", href: `/hi/route/${route.slug}` }]
            : undefined
        }
        jsonLd={routeSchema}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Freight Routes", url: "/routes" },
          { name: `${route.from} → ${route.to}`, url: `/routes/${route.slug}` },
        ]}
      />

      <div className="min-h-screen bg-background dark:bg-[#050816]">
        {/* Hero */}
        <section className="relative pt-20 pb-10 sm:pt-28 sm:pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent dark:from-orange-500/10" />
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Link to="/routes" className="hover:text-orange-400 transition-colors">Freight Routes</Link>
                <span>/</span>
                <span className="text-orange-400">{route.from} → {route.to}</span>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-orange-800/30 mb-6">
                <MapPin className="h-3.5 w-3.5" />
                {stateLabel}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground dark:text-white mb-6 tracking-tight">
                Part Load Transport<br />
                <span className="text-orange-600 dark:text-orange-400">{route.from} to {route.to}</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
                {route.description}
              </p>

              {/* Direct Answer for AEO — visible HTML, concise, non-promotional */}
              <DirectAnswer
                answer={`Part load (PTL) freight from ${route.from} to ${route.to} (${route.distanceKm} km) costs approximately ₹${bands.perKgMin}–₹${bands.perKgMax} per kg (₹${formatINR(bands.perTonneMin)}–₹${formatINR(bands.perTonneMax)} per tonne), while a full truck costs ₹${formatINR(bands.perTruckMin)}–₹${formatINR(bands.perTruckMax)} per trip. Transit takes about ${route.transitTime} hours with live GPS tracking on LoadSaathi.`}
                qualifier={`Indicative rates, updated ${RATES_UPDATED_LABEL}. Actual quotes depend on cargo, route, and availability.`}
              />

              {/* Route stats */}
              <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-6 mb-4">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border">
                  <Route className="h-5 w-5 text-orange-400" />
                  <div>
                    <div className="font-bold text-foreground">{route.distanceKm} km</div>
                    <div className="text-xs text-muted-foreground">Total Distance</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border">
                  <Clock className="h-5 w-5 text-orange-400" />
                  <div>
                    <div className="font-bold text-foreground">~{hoursLabel(route.transitTime)}</div>
                    <div className="text-xs text-muted-foreground">Transit Time</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border">
                  <Package className="h-5 w-5 text-orange-400" />
                  <div>
                    <div className="font-bold text-foreground">PTL / LTL</div>
                    <div className="text-xs text-muted-foreground">Freight Type</div>
                  </div>
                </div>
                {route.highway && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border">
                    <Map className="h-5 w-5 text-orange-400" />
                    <div>
                      <div className="font-bold text-foreground">{route.highway}</div>
                      <div className="text-xs text-muted-foreground">Highway</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification state of the published figures */}
              {route.dataStatus === "needs_review" ? (
                <p className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 max-w-2xl mb-8">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Distance pending re-verification — published road-routing figure shown. Rates updated {RATES_UPDATED_LABEL}.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground max-w-2xl mb-8">
                  Distance {route.dataStatus === "corrected" ? "corrected against" : "verified against"} road routing · Last reviewed {LANE_REVIEWED_LABEL} · Rates updated {RATES_UPDATED_LABEL}.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] group">
                    Ship from {route.from} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to={`/tools/fare-calculator?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`}>
                  <Button variant="outline" className="w-full sm:w-auto border-orange-500/30 text-foreground hover:bg-orange-500/5 text-sm font-bold px-8 py-4 h-auto rounded-lg">
                    Check Estimated Fare
                  </Button>
                </Link>
              </div>

              {/* Inline quote card — converts visitors who want to talk to a specialist */}
              <div className="mt-8 max-w-lg">
                <QuoteLeadCard
                  origin={route.from}
                  destination={route.to}
                  weight={10}
                  avgPrice={Math.round((bands.perTruckMin + bands.perTruckMax) / 2)}
                  route={`${route.from} → ${route.to}`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Why this route */}
        <section className="py-20 border-y border-border dark:border-white/5 relative">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-6">
                  Why Ship {route.from} → {route.to} with LoadSaathi?
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Whether you need PTL (Part Truck Load) or LTL (Less Than Truck Load) shipping on the {route.from}–{route.to} corridor, LoadSaathi's AI-powered platform makes freight booking simple, transparent, and cost-effective.
                </p>
                <div className="space-y-4">
                  {[
                    `AI-matched trucks on the ${route.from}–${route.to} route within minutes`,
                    `GPS tracking from pickup to delivery across ${route.distanceKm} km`,
                    `Transparent pricing — know the fair market rate before you book`,
                    `Digital credit scores for trusted shippers and truckers`,
                    crossState ? `Cross-state logistics made simple — the ${route.fromState} to ${route.toState} border crossing is handled seamlessly` : `Intra-state shipping within ${route.fromState} — fast and reliable`,
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card p-8 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
                <div className="text-center">
                  <div className="text-6xl font-black text-orange-600 dark:text-orange-400 mb-2">{route.distanceKm}</div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Kilometers Covered</div>
                </div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent my-6" />
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-black text-foreground">{route.transitTime}h</div>
                    <div className="text-xs text-muted-foreground mt-1">Avg Transit</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-foreground">PTL</div>
                    <div className="text-xs text-muted-foreground mt-1">Freight Type</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lane intelligence: commodity mix + truck types */}
        <section className="py-20">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3">
                  <Boxes className="h-4 w-4" /> Lane intelligence
                </div>
                <h2 className="text-3xl font-black text-foreground dark:text-white mb-6">
                  What Moves on {route.from} → {route.to}
                </h2>
                <div className="space-y-3">
                  {route.commodities.map((c) => (
                    <div key={c} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>

                {(originPoints || destPoints) && (
                  <>
                    <h2 className="text-3xl font-black text-foreground dark:text-white mt-10 mb-6">
                      Loading & Unloading Points
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {originPoints && (
                        <div className="glass-card p-5 rounded-xl border border-border">
                          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-orange-400" /> Loading in {route.from}
                          </h3>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {originPoints.map((p) => <li key={p}>{p}</li>)}
                          </ul>
                        </div>
                      )}
                      {destPoints && (
                        <div className="glass-card p-5 rounded-xl border border-border">
                          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-orange-400" /> Unloading in {route.to}
                          </h3>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {destPoints.map((p) => <li key={p}>{p}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <h2 className="text-3xl font-black text-foreground dark:text-white mb-6">
                  Truck Types Running {route.from} → {route.to}
                </h2>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60 dark:bg-white/5 text-left">
                        <th className="px-4 py-3 font-bold text-foreground">Truck type</th>
                        <th className="px-4 py-3 font-bold text-foreground">Capacity</th>
                        <th className="px-4 py-3 font-bold text-foreground">Typical use</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TRUCK_TYPES.map((t) => (
                        <tr key={t.type} className="border-t border-border">
                          <td className="px-4 py-3 font-semibold text-foreground">{t.type}</td>
                          <td className="px-4 py-3 text-muted-foreground">{t.capacity}</td>
                          <td className="px-4 py-3 text-muted-foreground">{t.use}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Return-load economics */}
                <div className="glass-card p-6 rounded-xl border border-orange-500/20 mt-8">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3">
                    <Repeat className="h-4 w-4" /> Cheaper direction on this lane
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Trucks finishing a trip into {route.to} often run empty looking for a backload, and the same
                    happens returning to {route.from}. That return-load availability — not distance alone — is what
                    makes one direction cheaper than the other on any given day. Post your trip before loading to
                    match with trucks already running the {route.from}–{route.to} corridor.
                  </p>
                  <Link to="/return-load" className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-400 mt-4 hover:gap-3 transition-all">
                    Explore return loads <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">
                Why LoadSaathi for {route.from} → {route.to}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to ship freight on this corridor — from booking to delivery.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="glass-card p-6 rounded-xl border border-border dark:border-white/[0.08] hover:border-orange-500/30 elevate">
                  <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                  <div className="mt-4 pt-3 border-t border-border dark:border-white/[0.06]">
                    <span className="text-lg font-black text-orange-600 dark:text-orange-400">{benefit.stat}</span>
                    <span className="text-xs text-muted-foreground ml-1">{benefit.statLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">
                How to Ship from {route.from} to {route.to}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get your freight moving on the {route.from}–{route.to} corridor in four simple steps.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((step) => (
                <div key={step.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{step.step}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Price Trend */}
        <section className="py-20">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            {/* Chart is below the fold and pulls the ~400 KB recharts bundle —
                fallback keeps layout height stable so lazy loading causes no CLS. */}
            <Suspense
              fallback={
                <div className="h-72 rounded-xl border border-border bg-muted/30 dark:bg-white/5 animate-pulse" aria-hidden="true" />
              }
            >
              <PriceTrendChart origin={route.from} destination={route.to} />
            </Suspense>
          </div>
        </section>

        {/* PTL vs FTL comparison */}
        <section className="py-20 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5">
          <div className="max-w-3xl mx-auto px-6 sm:px-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">
                PTL vs FTL: {route.from} to {route.to}
              </h2>
              <p className="text-lg text-muted-foreground">Which option fits your shipment?</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 dark:bg-white/5 text-left">
                    <th className="px-4 py-3 font-bold text-foreground">Option</th>
                    <th className="px-4 py-3 font-bold text-foreground">Cost</th>
                    <th className="px-4 py-3 font-bold text-foreground">Transit</th>
                    <th className="px-4 py-3 font-bold text-foreground">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 font-semibold text-foreground">PTL (shared)</td>
                    <td className="px-4 py-3 text-muted-foreground">₹{formatINR(bands.perTonneMin)}–₹{formatINR(bands.perTonneMax)}/tonne</td>
                    <td className="px-4 py-3 text-muted-foreground">~{Math.max(1, Math.round(Number(route.transitTime) * 1.4))} hrs</td>
                    <td className="px-4 py-3 text-muted-foreground">Loads under 5 tonnes</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 font-semibold text-foreground">FTL (full truck)</td>
                    <td className="px-4 py-3 text-muted-foreground">₹{formatINR(bands.perTruckMin)}–₹{formatINR(bands.perTruckMax)}/trip</td>
                    <td className="px-4 py-3 text-muted-foreground">~{hoursLabel(route.transitTime, "hrs")}</td>
                    <td className="px-4 py-3 text-muted-foreground">Loads of 5 tonnes and above</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Rates updated {RATES_UPDATED_LABEL} · Rates move with diesel prices and return-truck availability.
            </p>
          </div>
        </section>

        {/* FAQ — same copy emitted as FAQPage JSON-LD above */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6 sm:px-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">
                Part Load Transport {route.from} to {route.to} — FAQs
              </h2>
              <p className="text-lg text-muted-foreground">Everything you need to know about shipping on this route.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((item, i) => (
                <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
                  <h3 className="font-bold text-foreground mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Blog Articles */}
        {(function() {
          const relevantArticles = findRelatedArticles(route.slug);
          if (relevantArticles.length === 0) return null;
          return (
            <section className="py-20 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5">
              <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
                <div className="text-center mb-10">
                  <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">
                    Related Resources for {route.from} → {route.to}
                  </h2>
                  <p className="text-lg text-muted-foreground">Guides and insights for shipping on this route.</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-5">
                  {relevantArticles.map((a) => (
                    <Link key={a.slug} to={`/blog/${a.slug}`} className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all group">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-4 w-4 text-orange-400" />
                        <span className="text-xs font-medium text-muted-foreground">{a.category}</span>
                      </div>
                      <h3 className="font-bold text-foreground text-sm mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">{a.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{a.summary.substring(0, 100)}...</p>
                      <p className="text-xs text-muted-foreground mt-2">{a.readTime}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* Internal link cluster: reverse lane + siblings, full-lane anchor text */}
        <section className="py-20">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">
                Routes Connected to {route.from} → {route.to}
              </h2>
              <p className="text-lg text-muted-foreground">
                Follow the corridor in either direction, or branch off to nearby lanes.
              </p>
            </div>

            {reverse && (
              <div className="mb-8 max-w-xl mx-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3 text-center">
                  Return direction
                </p>
                <RouteLinkCard r={reverse} />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              {originSiblings.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    More lanes from {route.from}
                  </h3>
                  <div className="grid gap-3">
                    {originSiblings.map((r) => <RouteLinkCard key={r.slug} r={r} />)}
                  </div>
                </div>
              )}
              {destSiblings.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    More lanes into {route.to}
                  </h3>
                  <div className="grid gap-3">
                    {destSiblings.map((r) => <RouteLinkCard key={r.slug} r={r} />)}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mt-8">
              <Link to="/routes">
                <Button variant="outline" className="border-orange-500/30 text-foreground hover:bg-orange-500/5">
                  View All Routes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Helpful Guides */}
        <section className="py-20 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">
                Helpful Guides for Shippers
              </h2>
              <p className="text-lg text-muted-foreground">Learn more about freight shipping in East India.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { title: "PTL vs FTL: Which is Right for You?", slug: "ptl-vs-ftl", desc: "Understand the difference between Partial and Full Truckload shipping." },
                { title: "Freight Rates in East India 2026", slug: "freight-rates-east-india", desc: "Current rates across major East India corridors." },
                { title: "How to Ship Steel Safely", slug: "shipping-steel", desc: "Complete guide to transporting steel products." },
              ].map((guide) => (
                <Link key={guide.slug} to={`/guide/${guide.slug}`} className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all group">
                  <h3 className="font-bold text-foreground text-sm mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{guide.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{guide.desc}</p>
                  <span className="text-xs font-semibold text-orange-500 mt-3 inline-block">Read Guide →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Locations */}
        <section className="py-20 border-y border-border dark:border-white/5">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">
                Freight from Major Cities
              </h2>
              <p className="text-lg text-muted-foreground">Browse freight corridors by city.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { city: "Rourkela", slug: "rourkela" },
                { city: "Ranchi", slug: "ranchi" },
                { city: "Kolkata", slug: "kolkata" },
                { city: "Bhubaneswar", slug: "bhubaneswar" },
                { city: "Jamshedpur", slug: "jamshedpur" },
              ].map((loc) => (
                <Link key={loc.slug} to={`/location/${loc.slug}`} className="glass-card px-5 py-3 rounded-xl border border-border hover:border-orange-500/30 transition-all group flex items-center gap-2">
                  <Map className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{loc.city}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.12),transparent_70%)]" />
          <div className="max-w-xl mx-auto px-6 sm:px-12 relative z-10 text-center">
            <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)]">
              <Truck className="h-12 w-12 text-orange-400 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                Ship from {route.from} to {route.to} Today
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
                Post your load and get AI-matched with available trucks on this route at transparent, market-rate pricing.
              </p>
              <div className="space-y-3">
                <Link to="/register">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] group">
                    Post a Shipment <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center justify-center gap-6 pt-2">
                  {["AI matching", "GPS tracking", "Transparent pricing"].map((item, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-400" /> {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
