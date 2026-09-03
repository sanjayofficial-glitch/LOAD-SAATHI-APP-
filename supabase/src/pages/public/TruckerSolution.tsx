
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Route, DollarSign, Shield, MessageSquare, TrendingUp, Clock, Star, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from "@/components/SeoMeta";

const problems = [
  {
    icon: Route,
    title: 'Empty Return Trips',
    desc: 'You haul a load one way and drive back empty. Fuel, time, and toll — all wasted. The industry average is 40% empty kilometers.',
    color: 'text-orange-500',
  },
  {
    icon: DollarSign,
    title: 'Broker Margins',
    desc: 'Middlemen take 15-25% of every trip. You do the work; they take the cut. Direct connections would put that money in your pocket.',
    color: 'text-red-400',
  },
  {
    icon: Clock,
    title: 'Payment Delays',
    desc: 'Waiting 30-60 days for payment is normal. Fuel is cash, tolls are cash, but your earnings are stuck in someone\'s ledger.',
    color: 'text-yellow-400',
  },
  {
    icon: MapPin,
    title: 'Route Uncertainty',
    desc: 'No visibility into return loads means every trip is a gamble. You never know if the next kilometer will earn or burn.',
    color: 'text-blue-400',
  },
];

const features = [
  {
    icon: Route,
    title: 'Find Return Loads',
    desc: 'Browse hundreds of available shipments on your return route. Book instantly and never drive empty again.',
    stat: '40%',
    statLabel: 'More Revenue Per Trip',
  },
  {
    icon: TrendingUp,
    title: 'AI Price Prediction',
    desc: 'Know the fair market rate for any route before you bid. Our AI analyzes demand, fuel, and seasonality so you never under-quote.',
    stat: '22%',
    statLabel: 'Higher Earnings',
  },
  {
    icon: Shield,
    title: 'Credit Score',
    desc: 'Build a verifiable reputation with every completed trip. Higher scores unlock premium loads and faster payments.',
    stat: '850+',
    statLabel: 'Top Trucker Score',
  },
  {
    icon: MessageSquare,
    title: 'Direct Communication',
    desc: 'Chat directly with shippers. Negotiate terms, share updates, and build relationships — no broker in between.',
    stat: '< 5min',
    statLabel: 'Avg. Response Time',
  },
];

const stats = [
  { value: '8,500+', label: 'Truckers Onboarded' },
  { value: '₹85Cr+', label: 'Total Trucker Earnings' },
  { value: '35%', label: 'Avg. Income Increase' },
  { value: '4.9/5', label: 'Trucker Satisfaction' },
];

export default function TruckerSolution() {
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
          <h1>LoadSaathi for Truckers — AI-Powered Load Discovery</h1>
          <p>Transform your trucking business with LoadSaathi. Get AI-matched loads, optimize routes, maximize earnings, and eliminate empty returns with India's leading freight platform.</p>
          <h2>Why Truckers Choose LoadSaathi</h2>
          <ul>
            <li><strong>Backhaul Loads:</strong> AI finds loads on your return route to eliminate empty kilometers.</li>
            <li><strong>Zero Empty Returns:</strong> Intelligent matching ensures every trip generates revenue.</li>
            <li><strong>Guaranteed Payments:</strong> Escrow-backed instant payments after delivery.</li>
            <li><strong>AI Route Optimization:</strong> Saves fuel and maximizes trips per month.</li>
            <li><strong>Digital Records:</strong> Complete digital trip history for compliance.</li>
            <li><strong>Performance Tracking:</strong> AI monitors safety, speed, and efficiency.</li>
          </ul>
          <h2>LoadSaathi Trucker Dashboard</h2>
          <ul>
            <li>AI-matched load recommendations</li>
            <li>Route optimization and navigation</li>
            <li>Real-time trip tracking</li>
            <li>Earnings and payment history</li>
            <li>Load filtering by type, route, weight</li>
            <li>Smart alerts for new loads</li>
            <li>Trip analytics and insights</li>
          </ul>
          <h2>How to Get Started</h2>
          <ol>
            <li>Create account as Trucker</li>
            <li>Complete KYC verification</li>
            <li>Add truck details</li>
            <li>Browse AI-matched loads</li>
            <li>Accept and start earning</li>
          </ol>
          <h2>Frequently Asked Questions</h2>
          <h3>How does LoadSaathi eliminate empty returns?</h3>
          <p>The AI matches backhaul loads on your return route based on location, timing, and truck capacity.</p>
          <h3>When do I get paid?</h3>
          <p>Payments are released instantly after GPS + ePOD delivery confirmation.</p>
          <h3>What fees does LoadSaathi charge?</h3>
          <p>2-4% per completed trip, reduced for high credit scores. No hidden charges, fuel surcharges, or commissions.</p>
        </div>
      </noscript>
      <SeoMeta
        title="For Truckers — Find Loads & Earn More"
        description="Join LoadSaathi to find return loads, reduce empty kilometers, get paid faster, and build your digital credit score. India's trucker-friendly freight platform."
        keywords="find truck loads India, return load for truck, trucker app, reduce empty kilometers, freight platform for truckers"
        canonical="/solutions/truckers"
        breadcrumbs={[{ name: "For Truckers", url: "/solutions/truckers" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How does LoadSaathi eliminate empty returns?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "The AI matches backhaul loads on your return route based on location, timing, and truck capacity.",
              },
            },
            {
              "@type": "Question",
              name: "When do I get paid?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Payments are released instantly after GPS + ePOD delivery confirmation.",
              },
            },
            {
              "@type": "Question",
              name: "What fees does LoadSaathi charge?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "2-4% per completed trip, reduced for high credit scores. No hidden charges, fuel surcharges, or commissions.",
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
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.15]"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8">
              <div className="inline-flex items-center gap-2 w-fit">
                <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
                  For Truckers & Fleet Owners
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                Fill Every Kilometer.<br />
                <span className="text-gradient-orange-blue">Maximize Your Earnings.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Stop driving empty and start earning what you deserve. LoadSaathi connects you directly with shippers, eliminates broker margins, and fills your return trips — all from one dashboard.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Link to="/register?type=trucker">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)] group">
                    Start Hauling
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
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse-ring" />
                    <span className="text-xs text-muted-foreground dark:text-gray-300 uppercase tracking-widest">Trucker Command Center</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-700/50">FLEET.ON</span>
                    <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded border border-orange-700/50">AI.SYNC</span>
                  </div>
                </div>
                <div className="flex-grow relative bg-card/50 rounded border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                  <div className="p-5 space-y-4 relative z-10">
                    <div className="glass-card p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Fleet Utilization</div>
                        <div className="text-3xl font-black text-foreground">87%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase mb-1">This Month</div>
                        <div className="text-lg font-bold text-green-400">+12.4%</div>
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase mb-3">Available Return Loads</div>
                      <div className="space-y-2">
                        {[
                          { route: 'Delhi → Mumbai', payout: '₹38,000', distance: '1,420 km' },
                          { route: 'Bangalore → Chennai', payout: '₹14,500', distance: '350 km' },
                          { route: 'Ahmedabad → Pune', payout: '₹22,000', distance: '650 km' },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-border pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <Route className="h-3 w-3 text-orange-400" />
                              <span className="text-xs font-semibold text-foreground">{item.route}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-green-400">{item.payout}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">{item.distance}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-card p-3 rounded-lg flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-green-400 shrink-0" />
                      <span className="text-xs text-muted-foreground">AI recommends: Take the Delhi → Mumbai load — optimal rate/route match</span>
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
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">The Trucker&#39;s Reality</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">You keep India moving, but the system holds you back. Here&#39;s what needs to change.</p>
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
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Built for the Road</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Every feature designed to put more earning kilometers under your wheels and more money in your pocket.</p>
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
                      <span className="text-2xl font-black text-green-400">{feature.stat}</span>
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
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Your Trucker Dashboard</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">One screen to find loads, track earnings, and manage your fleet — from the cab or the office.</p>
          </div>
          <div className="glass-card rounded-xl border-border overflow-hidden shadow-2xl">
            <div className="h-12 border-b border-border bg-card/80 flex items-center px-5 gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">Trucker OS — Fleet Overview</span>
              <div className="flex-grow" />
              <span className="text-[10px] bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded border border-orange-700/30">AI LOAD MATCHING ACTIVE</span>
            </div>
            <div className="p-6 bg-background/50 dark:bg-[#050816]/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Revenue This Month', value: '₹2.8L', change: '+18%', icon: TrendingUp },
                  { label: 'Active Loads', value: '6', change: '+2', icon: Route },
                  { label: 'Utilization Rate', value: '87%', change: '+12%', icon: Truck },
                  { label: 'Avg. Rating', value: '4.8', change: 'Top Performer', icon: Star },
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground uppercase">{stat.label}</span>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-black text-foreground">{stat.value}</div>
                    <div className="text-xs font-semibold text-green-400">{stat.change}</div>
                  </div>
                ))}
              </div>
              <div className="glass-card p-5 rounded-lg bg-card/30">
                <div className="flex items-center gap-2 mb-4">
                  <Route className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recommended Return Loads</span>
                </div>
                <div className="space-y-3">
                  {[
                    { route: 'Delhi → Mumbai', payout: '₹38,000', distance: '1,420 km', match: '98%', type: 'FTL' },
                    { route: 'Delhi → Ahmedabad', payout: '₹25,000', distance: '950 km', match: '92%', type: 'FTL' },
                    { route: 'Delhi → Pune', payout: '₹32,000', distance: '1,200 km', match: '87%', type: 'PTL' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card/50 dark:bg-[#0B1220] border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-green-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{item.route}</div>
                          <div className="text-xs text-muted-foreground">{item.type} · {item.distance}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">{item.payout}</div>
                        <div className="text-xs text-orange-400">{item.match} match</div>
                      </div>
                    </div>
                  ))}
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
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Trucker FAQ</h2>
            <p className="text-lg text-muted-foreground">Questions from truckers about using LoadSaathi.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "How do I find loads on LoadSaathi?", a: "Register your fleet, then browse AI-matched shipments from your dashboard. Our engine prioritizes loads matching your truck type, capacity, and preferred routes. New matches are pushed to you in real-time." },
              { q: "How does the Digital Freight Credit Score work?", a: "Your score (300-900) is calculated from completion rates, on-time performance, reviews, communication, and tenure. Higher scores unlock priority matching, lower transaction fees, and faster payments." },
              { q: "When and how do I get paid?", a: "Payments are released through our secure escrow system within 24-48 hours of delivery confirmation. You can track earnings and payment history from your dashboard." },
              { q: "Can I choose which loads to accept?", a: "Absolutely. Each shipment listing includes full details — origin, destination, cargo type, weight, price, and shipper reviews. Accept only the loads that fit your schedule and preferences." },
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
              <Truck className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Stop Driving Empty.<br />Start Earning More.</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">Join thousands of truckers who have eliminated empty kilometers, doubled their earnings, and built lasting relationships with fair-paying shippers.</p>
            <div className="space-y-3">
              <Link to="/register?type=trucker">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] group">
                  Register as Trucker <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
