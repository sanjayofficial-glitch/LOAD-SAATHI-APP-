
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Route, Truck, DollarSign, TrendingUp, Clock, MapPin, ArrowRight, CheckCircle, Search, Shield, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from "@/components/SeoMeta";

const problems = [
  {
    icon: Fuel,
    title: 'Empty Return Trips',
    desc: 'You deliver a load one way and drive back empty. Fuel, toll, and time — all wasted. The industry average is 40% empty kilometers on return journeys.',
    color: 'text-red-500',
  },
  {
    icon: DollarSign,
    title: 'Lost Revenue',
    desc: 'Every empty kilometre costs you ₹15–30 in fuel alone. A 400 km return trip means ₹6,000–12,000 in wasted operating cost — per trip.',
    color: 'text-orange-500',
  },
  {
    icon: Clock,
    title: 'Manual Load Finding',
    desc: 'Calling brokers, checking physical load boards, waiting for callbacks. Finding a return load takes hours of dead time when you could be earning.',
    color: 'text-yellow-500',
  },
  {
    icon: MapPin,
    title: 'Route Mismatch',
    desc: 'Even when loads exist, they may not match your truck type, capacity, or timeline. You end up taking whatever is available — not what pays best.',
    color: 'text-blue-400',
  },
];

const benefits = [
  {
    icon: Search,
    title: 'AI-Matched Return Loads',
    desc: 'Our algorithm finds loads on your exact return route based on location, truck type, capacity, and timing. No more calling brokers.',
    stat: '40%',
    statLabel: 'Fewer Empty Kilometres',
  },
  {
    icon: TrendingUp,
    title: 'Fair Market Pricing',
    desc: 'AI price prediction shows you the going rate for every route before you accept. Never under-quote, never over-commit.',
    stat: '22%',
    statLabel: 'Higher Earnings',
  },
  {
    icon: Shield,
    title: 'Verified Shippers',
    desc: 'Every shipper on LoadSaathi is verified with a credit score. You see their payment history and ratings before accepting.',
    stat: '300-900',
    statLabel: 'Credit Score Range',
  },
  {
    icon: DollarSign,
    title: 'Fast Payments',
    desc: 'Escrow-backed payments released within 24–48 hours of delivery confirmation. No more 30–60 day waits.',
    stat: '< 48hrs',
    statLabel: 'Payment Release',
  },
];

const howItWorks = [
  { step: '1', title: 'Register Your Truck', desc: 'Add your truck type, capacity, and preferred routes. Takes 2 minutes.' },
  { step: '2', title: 'Browse Return Loads', desc: 'AI matches you with available shipments on your return route. Filter by weight, destination, and payout.' },
  { step: '3', title: 'Accept & Track', desc: 'Accept a load, get shipper details, and track the pickup. GPS tracking starts automatically.' },
  { step: '4', title: 'Deliver & Get Paid', desc: 'Complete delivery, confirm ePOD, and get paid within 24–48 hours via escrow.' },
];

const stats = [
  { value: '8,500+', label: 'Truckers Onboarded' },
  { value: '₹85Cr+', label: 'Total Trucker Earnings' },
  { value: '35%', label: 'Avg. Income Increase' },
  { value: '40%', label: 'Empty km Reduction' },
];

export default function ReturnLoad() {
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
          <h2>Find Return Loads for Your Truck — LoadSaathi</h2>
          <p>Don't drive back empty. LoadSaathi connects truckers with available shipments on their return route, cutting empty kilometres by up to 40% and increasing earnings by 35%.</p>
          <h2>Why Find Return Loads?</h2>
          <ul>
            <li><strong>Eliminate Empty Kilometres:</strong> The Indian trucking industry averages 40% empty return trips. LoadSaathi fills those gaps with AI-matched shipments.</li>
            <li><strong>Increase Earnings:</strong> Turn wasted fuel and time into ₹15,000–40,000 extra per return trip.</li>
            <li><strong>Fair Market Rates:</strong> AI price prediction shows the going rate before you accept.</li>
            <li><strong>Verified Shippers:</strong> Every shipper is credit-scored and verified for payment reliability.</li>
            <li><strong>Fast Payments:</strong> Escrow-backed payments released within 24–48 hours of delivery.</li>
          </ul>
          <h2>How It Works</h2>
          <ol>
            <li>Register your truck with type and capacity</li>
            <li>Browse AI-matched loads on your return route</li>
            <li>Accept and track via GPS</li>
            <li>Deliver and get paid within 48 hours</li>
          </ol>
          <h2>Supported Routes</h2>
          <p>LoadSaathi covers all major East India corridors: Rourkela–Ranchi, Rourkela–Bhubaneswar, Rourkela–Kolkata, Ranchi–Jamshedpur, Bhubaneswar–Kolkata, and more.</p>
          <h2>Get Started</h2>
          <p>Register at loadsaathi.in/register as a trucker to start finding return loads today.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Find Return Loads for Your Truck | Backhaul Freight India"
        description="Don't drive back empty. Find return loads for your truck on LoadSaathi's AI-powered freight marketplace. Cut empty kilometres by 40%, earn ₹15,000–40,000 extra per trip across East India."
        keywords="return load for truck, backhaul India, find load for truck, empty truck load, truck return load, return freight, truck load booking"
        canonical="/return-load"
        breadcrumbs={[{ name: "Return Loads", url: "/return-load" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "LoadSaathi Return Load Matching",
            "description": "AI-powered matching service connecting truckers with available shipments on their return route to eliminate empty kilometres across East India.",
            "provider": {
              "@type": "Organization",
              "name": "LoadSaathi",
              "url": "https://loadsaathi.in"
            },
            "areaServed": ["Odisha", "Jharkhand", "West Bengal"],
            "serviceType": "Freight Matching"
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is a return load?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A return load (or backhaul) is a shipment that fills a truck's empty return journey after it has delivered its initial cargo. Instead of driving back empty, truckers find loads on the same route to earn extra revenue and reduce wasted fuel."
                }
              },
              {
                "@type": "Question",
                "name": "How much can I earn from return loads?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Return load earnings vary by route, truck type, and cargo weight. On East India corridors, truckers typically earn ₹15,000–40,000 per return trip. LoadSaathi's AI price prediction shows the going rate before you accept."
                }
              },
              {
                "@type": "Question",
                "name": "How does LoadSaathi find return loads for my truck?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "LoadSaathi's AI matching engine analyzes your truck type, capacity, current location, and preferred routes to find available shipments heading in the direction you're travelling. You receive real-time notifications when matching loads are posted."
                }
              },
              {
                "@type": "Question",
                "name": "Which routes have the most return load availability?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "LoadSaathi covers all major East India corridors with high return load availability on: Rourkela–Ranchi, Rourkela–Bhubaneswar, Rourkela–Kolkata, Ranchi–Jamshedpur, Bhubaneswar–Kolkata, and Jamshedpur–Burdwan routes."
                }
              }
            ]
          }
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">

      {/* HERO */}
      <section className="relative min-h-[680px] flex items-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.15]"
            style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8">
              <div className="inline-flex items-center gap-2 w-fit">
                <span className="text-xs font-semibold tracking-widest uppercase bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-700/30">
                  For Truckers & Fleet Owners
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                Don't Drive Back Empty.<br />
                <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">Find a Load.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Every empty return trip costs you ₹15,000–40,000 in wasted fuel and lost earnings. LoadSaathi finds return loads on your route — so every kilometre earns.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Link to="/register?type=trucker">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)] group">
                    Find Return Loads
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/tools/fare-calculator">
                  <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg border-border hover:border-green-400 hover:text-green-500 dark:hover:text-green-400 transition-all text-foreground">
                    Check Rates
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-float h-full min-h-[400px] flex items-center justify-center">
              <div className="glass-panel w-full h-[520px] rounded-xl p-6 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse-ring" />
                    <span className="text-xs text-muted-foreground dark:text-gray-300 uppercase tracking-widest">Return Load Finder</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-700/50">AI.MATCH</span>
                    <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded border border-orange-700/50">LIVE</span>
                  </div>
                </div>
                <div className="flex-grow relative bg-card/50 rounded border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                  <div className="p-5 space-y-4 relative z-10">
                    <div className="glass-card p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Your Location</div>
                        <div className="text-2xl font-black text-foreground">Rourkela</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase mb-1">Truck Capacity</div>
                        <div className="text-lg font-bold text-orange-400">16 Tonnes</div>
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase mb-3">Available Return Loads</div>
                      <div className="space-y-2">
                        {[
                          { route: 'Ranchi → Rourkela', payout: '₹22,000', distance: '180 km', type: 'Steel Parts' },
                          { route: 'Bhubaneswar → Rourkela', payout: '₹35,000', distance: '340 km', type: 'Cement' },
                          { route: 'Kolkata → Rourkela', payout: '₹42,000', distance: '430 km', type: 'FMCG' },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-border pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <Route className="h-3 w-3 text-green-400" />
                              <span className="text-xs font-semibold text-foreground">{item.route}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-green-400">{item.payout}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">{item.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-card p-3 rounded-lg flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-green-400 shrink-0" />
                      <span className="text-xs text-muted-foreground">AI: Take the Bhubaneswar → Rourkela load — best rate/km ratio</span>
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
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">The Empty Return Problem</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Indian truckers drive 40% of their kilometres empty on return trips. That's money, fuel, and time wasted — every single day.</p>
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

      {/* BENEFITS */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">How LoadSaathi Fills Your Return Trip</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Every feature designed to turn empty kilometres into earning kilometres.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-green-500/30 transition-all duration-300 group">
                <div className="flex items-start gap-5">
                  <div className="bg-green-600/10 dark:bg-green-900/20 p-3 rounded-xl shrink-0">
                    <benefit.icon className="text-green-500 text-2xl group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                      <span className="text-2xl font-black text-green-400">{benefit.stat}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{benefit.statLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From empty to earning in 4 simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <div key={i} className="glass-card p-8 rounded-xl text-center hover:border-green-500/30 transition-all duration-300 relative">
                <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-black">{step.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="fade-section border-y border-border dark:border-white/5 bg-muted/50 dark:bg-[#010f1f]/80 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12 flex flex-col md:flex-row justify-around items-center gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-green-600 dark:text-green-400 tracking-tight">{stat.value}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-3xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Common questions about finding return loads on LoadSaathi.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "What is a return load?", a: "A return load (or backhaul) is a shipment that fills your truck's empty return journey. Instead of driving back empty after a delivery, you carry a load heading in the same direction — earning revenue on every kilometre." },
              { q: "How much can I earn from return loads?", a: "Earnings vary by route and truck type. On East India corridors, truckers typically earn ₹15,000–40,000 per return trip. LoadSaathi's AI price prediction shows the going rate before you accept any load." },
              { q: "How does LoadSaathi find return loads?", a: "Our AI analyzes your truck type, capacity, current location, and preferred routes. When a matching shipment is posted, you receive a real-time notification with full details — origin, destination, cargo, weight, and price." },
              { q: "Which routes have the most availability?", a: "LoadSaathi covers all major East India corridors. The busiest return load routes include Rourkela–Ranchi, Rourkela–Bhubaneswar, Rourkela–Kolkata, Ranchi–Jamshedpur, and Bhubaneswar–Kolkata." },
              { q: "When do I get paid?", a: "Payments are released through our secure escrow system within 24–48 hours of delivery confirmation via GPS and electronic proof of delivery (ePOD)." },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
                <h3 className="font-bold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RELATED ROUTES */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Popular Return Load Routes</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Browse freight rates on the busiest East India corridors.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { from: 'Ranchi', to: 'Rourkela', slug: 'ranchi-to-rourkela' },
              { from: 'Rourkela', to: 'Bhubaneswar', slug: 'rourkela-to-bhubaneswar' },
              { from: 'Ranchi', to: 'Kolkata', slug: 'ranchi-to-kolkata' },
              { from: 'Jamshedpur', to: 'Rourkela', slug: 'jamshedpur-to-rourkela' },
              { from: 'Rourkela', to: 'Burdwan', slug: 'rourkela-to-burdwan' },
              { from: 'Dhanbad', to: 'Jamshedpur', slug: 'dhanbad-to-jamshedpur' },
            ].map((route, i) => (
              <Link key={i} to={`/routes/${route.slug}`} className="glass-card p-5 rounded-xl hover:border-green-500/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-semibold text-foreground">{route.from} → {route.to}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section py-32 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(34,197,94,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.1)] text-center">
            <div className="bg-green-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Stop Driving Empty.<br />Start Earning More.</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">Join 8,500+ truckers who have eliminated empty kilometres and increased their earnings by an average of 35%.</p>
            <div className="space-y-3">
              <Link to="/register?type=trucker">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] group">
                  Find Return Loads Now <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-6 pt-2">
                {['No broker cuts', 'AI-matched loads', 'Fast payments'].map((item, i) => (
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
