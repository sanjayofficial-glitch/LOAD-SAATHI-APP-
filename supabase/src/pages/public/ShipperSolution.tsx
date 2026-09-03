
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, MapPin, Shield, TrendingUp, Clock, BarChart3, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from "@/components/SeoMeta";

const problems = [
  {
    icon: Users,
    title: 'Broker Dependency',
    desc: 'Multiple intermediaries complicate the supply chain, inflate costs, and reduce transparency between you and the trucker.',
    color: 'text-orange-500',
  },
  {
    icon: TrendingUp,
    title: 'Opaque Pricing',
    desc: 'Market rates are hidden behind phone calls and negotiation. No way to know if you\'re paying a fair price for any route.',
    color: 'text-blue-400',
  },
  {
    icon: MapPin,
    title: 'No Real-Time Tracking',
    desc: 'Once the truck leaves, you\'re in the dark. Manual check-in calls replace what should be live visibility.',
    color: 'text-red-400',
  },
  {
    icon: Package,
    title: 'Empty Truck Inefficiency',
    desc: 'Trucks return empty after delivery while your next load waits. The system wastes capacity on both sides.',
    color: 'text-yellow-400',
  },
];

const features = [
  {
    icon: Search,
    title: 'AI-Powered Matching',
    desc: 'Our algorithm analyzes load dimensions, route preferences, time windows, and trucker history to find the perfect carrier match in seconds — not days.',
    stat: '2.4x',
    statLabel: 'Faster Matching',
  },
  {
    icon: MapPin,
    title: 'Real-Time Tracking',
    desc: 'GPS-enabled live tracking from pickup to delivery. Share tracking links with your entire supply chain automatically.',
    stat: '100%',
    statLabel: 'Live Visibility',
  },
  {
    icon: BarChart3,
    title: 'Price Intelligence',
    desc: 'AI predicts fair market rates for every route using historical data, fuel costs, demand patterns, and seasonal trends. No more guessing.',
    stat: '₹12K',
    statLabel: 'Avg. Savings',
  },
  {
    icon: Shield,
    title: 'Trust Network',
    desc: 'Verified trucker profiles with credit scores, completion rates, and peer reviews. Every carrier is rated before they haul your freight.',
    stat: '98%',
    statLabel: 'On-Time Delivery',
  },
];

const stats = [
  { value: '10,000+', label: 'Shipments Completed' },
  { value: '15,000+', label: 'Verified Truckers' },
  { value: '35%', label: 'Cost Reduction' },
  { value: '4.8/5', label: 'Shipper Satisfaction' },
];

export default function ShipperSolution() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-section').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h1>LoadSaathi for Shippers — AI-Powered Transport Solutions</h1>
          <p>Ship with confidence using LoadSaathi's AI-powered platform. Instant quotes, verified transporters, real-time tracking, and AI-powered analytics — all in one place.</p>
          <h2>Why Shippers Choose LoadSaathi</h2>
          <ul>
            <li><strong>2-Minute Instant Quotes:</strong> AI-powered pricing with no negotiation delays.</li>
            <li><strong>Verified Transporters:</strong> KYC-verified with credit scores and performance history.</li>
            <li><strong>Real-Time Tracking:</strong> Live GPS location, ETA, and route visualization.</li>
            <li><strong>100% Payment Protection:</strong> Escrow-backed secure transactions.</li>
            <li><strong>AI Match Accuracy:</strong> 98.5% perfect shipment-vehicle matches.</li>
            <li><strong>Pan-India Network:</strong> 50+ verified routes across 14 states.</li>
          </ul>
          <h2>LoadSaathi Shipper Dashboard</h2>
          <ul>
            <li>Post unlimited shipments</li>
            <li>Real-time bid comparison</li>
            <li>AI route optimization</li>
            <li>Track shipments on map</li>
            <li>View delivery performance</li>
            <li>Access analytics and reports</li>
            <li>Manage payments</li>
            <li>Download ePOD</li>
          </ul>
          <h2>How to Start Shipping</h2>
          <ol>
            <li>Create account as Shipper</li>
            <li>Post your first shipment</li>
            <li>Receive AI-matched bids</li>
            <li>Select transporter</li>
            <li>Track and manage delivery</li>
          </ol>
          <h2>Frequently Asked Questions</h2>
          <h3>How fast can I get quotes?</h3>
          <p>AI-powered quotes in under 2 minutes from multiple verified transporters.</p>
          <h3>Are all transporters verified?</h3>
          <p>Yes. Every transporter undergoes KYC, documentation, and background verification.</p>
          <h3>How does real-time tracking work?</h3>
          <p>GPS-enabled vehicles provide live location, ETA, and route visualization on your dashboard.</p>
        </div>
      </noscript>
      <SeoMeta
        title="For Shippers — Smarter Freight Shipping"
        description="LoadSaathi helps shippers save up to 40% on freight costs. AI-matched trucks, real-time tracking, escrow payments, and zero middlemen on East India corridors."
        keywords="freight shipping India, PTL LTL shipper, book truck online, reduce logistics cost East India"
        canonical="/solutions/shippers"
        breadcrumbs={[{ name: "For Shippers", url: "/solutions/shippers" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How fast can I get quotes?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "AI-powered quotes in under 2 minutes from multiple verified transporters.",
              },
            },
            {
              "@type": "Question",
              name: "Are all transporters verified?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Every transporter undergoes KYC, documentation, and background verification.",
              },
            },
            {
              "@type": "Question",
              name: "How does real-time tracking work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "GPS-enabled vehicles provide live location, ETA, and route visualization on your dashboard.",
              },
            },
          ],
        }}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">

      {/* HERO */}
      <section className="relative min-h-[680px] flex items-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.15]"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8">
              <div className="inline-flex items-center gap-2 w-fit">
                <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
                  For Shippers
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                Your Freight,<br />
                <span className="text-gradient-orange-blue">Perfectly Matched.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Stop chasing brokers and start shipping smarter. LoadSaathi connects you directly with the right truckers, at fair prices, with full visibility from pickup to delivery.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Link to="/register?type=shipper">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)] group">
                    Start Shipping
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg border-border hover:border-orange-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all text-foreground">
                    See How It Works
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-float h-full min-h-[400px] flex items-center justify-center">
              <div className="glass-panel w-full h-[520px] rounded-xl p-6 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse-ring" />
                    <span className="text-xs text-muted-foreground dark:text-gray-300 uppercase tracking-widest">Shipper Command Center</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-700/50">LIVE</span>
                    <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded border border-orange-700/50">AI.ACTIVE</span>
                  </div>
                </div>
                <div className="flex-grow relative bg-card/50 rounded border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                  <div className="p-5 space-y-4 relative z-10">
                    <div className="glass-card p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Active Shipments</div>
                        <div className="text-3xl font-black text-foreground">124</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase mb-1">On-Time Rate</div>
                        <div className="text-lg font-bold text-green-400">97.8%</div>
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase mb-3">Recent Tenders</div>
                      <div className="space-y-2">
                        {[
                          { route: 'Mumbai → Delhi', status: 'Matched', statusClass: 'text-green-400', type: 'FTL - 12 Tons' },
                          { route: 'Bangalore → Hyderabad', status: 'In Transit', statusClass: 'text-blue-400', type: 'PTL - 4 Tons' },
                          { route: 'Chennai → Kolkata', status: 'Bidding', statusClass: 'text-orange-400', type: 'FTL - 18 Tons' },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-border pb-2 last:border-b-0 last:pb-0">
                            <div>
                              <span className="text-xs font-semibold text-foreground">{item.route}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">{item.type}</span>
                            </div>
                            <span className={`text-xs font-semibold ${item.statusClass}`}>{item.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-card p-3 rounded-lg flex items-center gap-3">
                      <Search className="h-4 w-4 text-orange-400 shrink-0" />
                      <span className="text-xs text-muted-foreground">AI finding ideal truckers for your next load...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMS */}
      <section className="fade-section py-24 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">The Shipper&#39;s Dilemma</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Every day without a connected freight platform costs you time, money, and trust. Here&#39;s what&#39;s broken.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((problem, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-orange-500/30 transition-all duration-300 group">
                <problem.icon className={`${problem.color} text-3xl mb-4 group-hover:scale-110 transition-transform duration-300`} />
                <h3 className="text-lg font-bold text-foreground mb-2">{problem.title}</h3>
                <p className="text-sm text-muted-foreground">{problem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Everything You Need to Ship</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">A complete toolkit designed to eliminate broker friction and put you in control of every shipment.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-orange-500/30 transition-all duration-300 group">
                <div className="flex items-start gap-5">
                  <div className="bg-orange-600/10 dark:bg-orange-900/20 p-3 rounded-xl shrink-0">
                    <feature.icon className="text-orange-500 text-2xl group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                      <span className="text-2xl font-black text-orange-400">{feature.stat}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{feature.statLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD MOCKUP */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Your Shipper Dashboard</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">One screen to manage every shipment, track every truck, and analyze every cost.</p>
          </div>
          <div className="glass-card rounded-xl border-border overflow-hidden shadow-2xl">
            <div className="h-12 border-b border-border bg-card/80 flex items-center px-5 gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">Shipper OS — Dashboard</span>
              <div className="flex-grow" />
              <span className="text-[10px] bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded border border-orange-700/30">AI RECOMMENDATIONS ACTIVE</span>
            </div>
            <div className="p-6 bg-background/50 dark:bg-[#050816]/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Spent This Month', value: '₹12.4L', change: '+8.2%', icon: TrendingUp },
                  { label: 'Active Shipments', value: '18', change: '+3', icon: Package },
                  { label: 'Avg. Cost per KM', value: '₹54', change: '-6%', icon: BarChart3 },
                  { label: 'Trucker Response Time', value: '4.2m', change: '-32%', icon: Clock },
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground uppercase">{stat.label}</span>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-black text-foreground">{stat.value}</div>
                    <div className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-400' : 'text-green-400'}`}>{stat.change} vs last month</div>
                  </div>
                ))}
              </div>
              <div className="glass-card p-5 rounded-lg bg-card/30">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Shipment Map</span>
                </div>
                <div className="h-[200px] bg-card/50 dark:bg-[#0B1220] rounded border border-border flex items-center justify-center bg-grid-pattern">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-orange-400/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Interactive map with real-time truck positions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="fade-section border-y border-border dark:border-white/5 bg-muted/50 dark:bg-[#010f1f]/80 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12 flex flex-col md:flex-row justify-around items-center gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-orange-600 dark:text-orange-400 tracking-tight">{stat.value}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-3xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Shipper FAQ</h2>
            <p className="text-lg text-muted-foreground">Questions from shippers about using LoadSaathi.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "How do I post a shipment on LoadSaathi?", a: "Register as a shipper, go to your dashboard, and click 'Post Shipment'. Enter origin, destination, cargo type, weight, and preferred pickup window. Our AI will start matching immediately — the process takes under 3 minutes." },
              { q: "How is pricing determined for my shipment?", a: "Our AI Price Predictor analyzes market rates, fuel costs, route distance, and demand to suggest fair pricing. You set your budget, and transporters bid within that range — creating a transparent, competitive marketplace." },
              { q: "Can I track my shipment in real time?", a: "Yes. Every shipment includes live GPS tracking with ETAs, route visualization, and geofence alerts. You'll see your shipment's location on a map and receive notifications at every milestone." },
              { q: "What if there's a dispute with a trucker?", a: "Our support team reviews GPS data, timestamps, photos, and communication history. We aim to resolve disputes within 48 hours with fair outcomes for both parties. Escrow-backed payments protect your funds." },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
                <h3 className="font-bold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section py-32 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)] text-center">
            <div className="bg-orange-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Stop Managing Freight.<br />Start Optimizing It.</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">Join thousands of Indian businesses that have cut costs, eliminated broker friction, and gained full control over their supply chain.</p>
            <div className="space-y-3">
              <Link to="/register?type=shipper">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] group">
                  Register as Shipper <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-6 pt-2">
                {['No broker fees', 'AI-powered matching', 'Real-time tracking'].map((item, i) => (
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
