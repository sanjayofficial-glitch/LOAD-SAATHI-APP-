
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Route, Truck } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";
import { routes } from "@/data/routes";

function getStatePairs() {
  const pairSet = new Set<string>();
  for (const r of routes) {
    const key = [r.fromState, r.toState].sort().join("-");
    pairSet.add(key);
  }
  return Array.from(pairSet).map((k) => {
    const [a, b] = k.split("-");
    return a === b ? `Within ${a}` : `${a} → ${b}`;
  });
}

const uniqueCorridors = getStatePairs();

export default function RoutesIndex() {
  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h1>India's Major Freight Routes — Popular Trucking Routes</h1>
          <p>Discover India's most important freight corridors, key highways, and strategic trucking routes connecting major industrial hubs, ports, and commercial centers.</p>
          <h2>Route Corridors</h2>
          <ul>
            <li><strong>Delhi-Mumbai Industrial Corridor:</strong> Noida to Mumbai, 1,400 km. Top manufacturing and consumption hub connection.</li>
            <li><strong>Chennai-Bengaluru Industrial Corridor:</strong> Chennai to Bengaluru, 350 km. Automotive, electronics, and textile corridor.</li>
            <li><strong>Amritsar-Kolkata Corridor:</strong> Amritsar to Kolkata, 1,800 km. Major east-west trade route.</li>
            <li><strong>North-South Corridor:</strong> Srinagar to Kanyakumari, 4,000 km. National highway connecting north to south India.</li>
            <li><strong>East-West Corridor:</strong> Porbandar to Silchar, 3,300 km. National highway connecting west to east India.</li>
          </ul>
          <h2>Key Highways</h2>
          <ul>
            <li><strong>NH 48:</strong> Delhi to Mumbai, 1,400 km. India's busiest freight highway.</li>
            <li><strong>NH 44:</strong> Srinagar to Kanyakumari, 4,000 km. Longest highway in India.</li>
            <li><strong>NH 16:</strong> Kolkata to Chennai, 1,600 km. Major east coast corridor.</li>
            <li><strong>NH 7:</strong> Varanasi to Kanyakumari, 2,350 km. National highway connecting north to south India.</li>
            <li><strong>NH 2:</strong> Delhi to Kolkata, 1,450 km. Major east-west highway.</li>
          </ul>
          <h2>Strategic Trade Routes</h2>
          <ul>
            <li><strong>Kandla Port to Delhi:</strong> Major import-export corridor, 1,200 km. High demand for containerized cargo.</li>
            <li><strong>Mumbai Port to Pune:</strong> Short-haul high-frequency corridor, 150 km. Daily shipments.</li>
            <li><strong>Chennai Port to Bengaluru:</strong> Southern industrial corridor, 350 km. High-frequency route.</li>
            <li><strong>Kolkata Port to Delhi:</strong> Eastern gateway, 1,450 km. High volume industrial route.</li>
          </ul>
          <h2>Regional Hubs</h2>
          <ul>
            <li><strong>Delhi NCR:</strong> Logistics capital of India. 150+ daily trips to various destinations.</li>
            <li><strong>Mumbai:</strong> Financial and logistics hub. 120+ daily trips to various destinations.</li>
            <li><strong>Bengaluru:</strong> Tech and manufacturing hub. 90+ daily trips to various destinations.</li>
            <li><strong>Chennai:</strong> Southern gateway. 75+ daily trips to various destinations.</li>
          </ul>
          <h2>Frequently Asked Questions</h2>
          <h3>Which is the busiest freight route in India?</h3>
          <p>The Delhi-Mumbai corridor (NH 48) handles the highest volume of freight traffic, with thousands of trucks plying daily.</p>
          <h3>Are there toll costs I should know about?</h3>
          <p>Most national highways have toll plazas. LoadSaathi's route optimizer factors in toll costs when calculating fair pricing.</p>
        </div>
      </noscript>
      <SeoMeta
        title="PTL & LTL Freight Routes — East India"
        description="Browse PTL and LTL freight routes across East India. Book shared truck loads from Rourkela, Ranchi, Jamshedpur, Bhubaneswar, Kolkata, and more. Save up to 40% on shipping."
        canonical="/routes"
        keywords="PTL freight routes East India, LTL transport corridors Odisha Jharkhand, truck booking routes Ranchi Rourkela, shared freight East India, part load routes"
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        {/* Hero */}
        <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent dark:from-orange-500/10" />
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-orange-800/30 mb-6">
                <Route className="h-3.5 w-3.5" />
                Freight Corridors
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground dark:text-white mb-6 tracking-tight">
                PTL & LTL Routes Across<br />
                <span className="text-orange-600 dark:text-orange-400">East India</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Browse our network of freight corridors connecting key industrial and commercial cities across Odisha, Jharkhand, West Bengal, and beyond. Book PTL and LTL loads with AI-matched trucking.
              </p>
            </div>

            {/* Corridor filters */}
            <div className="flex flex-wrap justify-center gap-2 mt-10">
              {uniqueCorridors.map((c) => (
                <span key={c} className="px-3 py-1.5 rounded-full bg-card/50 border border-border text-xs font-medium text-muted-foreground">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Route Grid */}
        <section className="pb-24">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {routes.map((route) => {
                const crossState = route.fromState !== route.toState;
                return (
                  <Link
                    key={route.slug}
                    to={`/routes/${route.slug}`}
                    className="group glass-card p-6 rounded-xl border border-border dark:border-white/[0.08] hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.08)] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 dark:bg-orange-900/30 w-10 h-10 rounded-xl flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-foreground">{route.from}</span>
                            <ArrowRight className="h-4 w-4 text-orange-400" />
                            <span className="font-bold text-lg text-foreground">{route.to}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {route.fromState} → {route.toState}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Route className="h-3.5 w-3.5 text-orange-400" />
                        {route.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-orange-400" />
                        ~{route.transitTime} hrs
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {route.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-border dark:border-white/[0.06]">
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:gap-3 transition-all">
                        {crossState ? "Cross-State Route" : "Intra-State Route"}
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24">
          <div className="max-w-xl mx-auto px-6 sm:px-12 text-center">
            <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20">
              <Truck className="h-10 w-10 text-orange-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
                Route Not Listed?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                LoadSaathi covers thousands of routes across India. Post your shipment and our AI will match you with available trucks on any route.
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
