
import { Link } from 'react-router-dom';
import { TrendingUp, Truck, Package, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";

const insights = [
  {
    icon: TrendingUp,
    title: 'Freight Rate Trends',
    description: 'Average PTL rates across East India corridors have remained stable in Q3 2026, with slight increases during monsoon season (15–20% seasonal premium).',
    metric: '₹1,800–3,500',
    metricLabel: '/tonne PTL rates',
  },
  {
    icon: Truck,
    title: 'Empty Kilometre Reduction',
    description: 'Digital freight marketplaces reduced empty return trips by 35–40% in East India corridors by matching truckers with backhaul loads.',
    metric: '35–40%',
    metricLabel: 'empty km reduction',
  },
  {
    icon: Package,
    title: 'PTL Market Growth',
    description: 'India\'s PTL logistics market is growing at 9.7% CAGR (MarkNtel 2026), driven by MSME demand for shared freight capacity.',
    metric: '9.7%',
    metricLabel: 'PTL market CAGR',
  },
  {
    icon: Users,
    title: 'Truck Utilization',
    description: 'Average truck utilization on digital platforms: 87% (vs 60% on traditional broker networks). Higher utilization = lower cost per tonne.',
    metric: '87%',
    metricLabel: 'truck utilization',
  },
];

const corridors = [
  { route: 'Rourkela → Ranchi', distance: '180 km', ptlRate: '₹1,800–2,500', ftlRate: '₹9,000–12,000' },
  { route: 'Rourkela → Bhubaneswar', distance: '340 km', ptlRate: '₹2,200–3,000', ftlRate: '₹14,000–18,000' },
  { route: 'Rourkela → Kolkata', distance: '430 km', ptlRate: '₹2,500–3,500', ftlRate: '₹18,000–24,000' },
  { route: 'Ranchi → Jamshedpur', distance: '130 km', ptlRate: '₹1,500–2,200', ftlRate: '₹7,000–9,000' },
  { route: 'Bhubaneswar → Kolkata', distance: '470 km', ptlRate: '₹2,000–2,800', ftlRate: '₹16,000–22,000' },
  { route: 'Jamshedpur → Burdwan', distance: '320 km', ptlRate: '₹2,200–3,000', ftlRate: '₹12,000–16,000' },
];

export default function Data() {
  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h1>LoadSaathi Freight Intelligence — East India Market Data</h1>
          <p>Key freight market insights for East India: PTL rates, empty kilometre trends, truck utilization, and corridor-specific data from LoadSaathi's marketplace.</p>
          <h2>Freight Rate Insights</h2>
          <ul>
            <li>PTL rates: ₹1,500–3,500 per tonne across East India corridors</li>
            <li>FTL rates: ₹7,000–24,000 per trip depending on distance and truck type</li>
            <li>Empty kilometre reduction: 35–40% with digital marketplace matching</li>
            <li>Truck utilization on digital platforms: 87% vs 60% on traditional networks</li>
          </ul>
          <h2>Key Corridors</h2>
          <ul>
            <li>Rourkela → Ranchi: 180 km, PTL ₹1,800–2,500/tonne</li>
            <li>Rourkela → Bhubaneswar: 340 km, PTL ₹2,200–3,000/tonne</li>
            <li>Rourkela → Kolkata: 430 km, PTL ₹2,500–3,500/tonne</li>
          </ul>
          <h2>Market Trends</h2>
          <p>India's PTL market is growing at 9.7% CAGR driven by MSME demand. Digital freight platforms are reducing logistics costs for small businesses by 30–40%.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Freight Intelligence | East India Market Data & Insights"
        description="Key freight market insights for East India: PTL rates, empty kilometre trends, truck utilization, and corridor-specific data. Updated quarterly from LoadSaathi's marketplace."
        keywords="freight intelligence India, East India freight data, PTL rates 2026, freight market trends, truck utilization India"
        canonical="/data"
        breadcrumbs={[{ name: "Freight Data", url: "/data" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "LoadSaathi East India Freight Intelligence",
          "description": "Quarterly freight rate trends, empty kilometre data, and truck utilization metrics for East India corridors.",
          "url": "https://loadsaathi.in/data",
          "publisher": {
            "@type": "Organization",
            "name": "LoadSaathi",
            "url": "https://loadsaathi.in"
          },
          "dateModified": "2026-08-08"
        }}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">

      {/* HERO */}
      <section className="relative pt-32 pb-20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold tracking-widest uppercase bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-700/30">
                Freight Intelligence
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
              East India Freight<br />
              <span className="bg-gradient-to-r from-green-500 to-blue-400 bg-clip-text text-transparent">Market Data</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Key insights from LoadSaathi's marketplace: PTL rates, empty kilometre trends, truck utilization, and corridor-specific data across East India.
            </p>
            <p className="text-xs text-muted-foreground mt-4">Last updated: August 2026 · Sources: LoadSaathi marketplace data, MarkNtel, Mordor Intelligence</p>
          </div>
        </div>
      </section>

      {/* INSIGHTS */}
      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-green-500/30 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="bg-green-600/10 dark:bg-green-900/20 p-3 rounded-xl shrink-0">
                    <insight.icon className="text-green-500 text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{insight.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-green-400">{insight.metric}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{insight.metricLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORRIDOR RATES */}
      <section className="py-16 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Corridor Rate Index</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Approximate PTL and FTL rates per corridor. Rates vary by season, fuel, and availability.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full glass-card rounded-xl">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-sm font-bold text-muted-foreground">Corridor</th>
                  <th className="p-4 text-left text-sm font-bold text-muted-foreground">Distance</th>
                  <th className="p-4 text-left text-sm font-bold text-blue-400">PTL / tonne</th>
                  <th className="p-4 text-left text-sm font-bold text-orange-400">FTL / trip</th>
                </tr>
              </thead>
              <tbody>
                {corridors.map((c, i) => {
                  const slug = c.route.toLowerCase().replace(/ → /g, '-to-').replace(/ /g, '');
                  return (
                    <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <Link to={`/routes/${slug}`} className="text-sm font-semibold text-foreground hover:text-orange-400 transition-colors">
                          {c.route}
                        </Link>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{c.distance}</td>
                      <td className="p-4 text-sm font-semibold text-blue-300">{c.ptlRate}</td>
                      <td className="p-4 text-sm font-semibold text-orange-300">{c.ftlRate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-xl mx-auto px-6 sm:px-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Need a Quote for Your Route?</h2>
          <p className="text-lg text-muted-foreground mb-8">Get AI-powered pricing based on real-time market data.</p>
          <div className="flex justify-center gap-4">
            <Link to="/tools/fare-calculator">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 h-auto rounded-lg">
                Get a Rate Estimate
              </Button>
            </Link>
            <Link to="/routes">
              <Button variant="outline" className="font-bold px-8 py-4 h-auto rounded-lg">
                Browse All Routes
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
    </>
  );
}
