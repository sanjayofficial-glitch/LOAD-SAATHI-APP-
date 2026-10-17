
import { Reveal } from "@/components/motion";

import { Link } from 'react-router-dom';
import { Package, DollarSign, Shield, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from "@/components/SeoMeta";
import DirectAnswer from "@/components/DirectAnswer";
import KeyTakeaways from "@/components/KeyTakeaways";

const benefits = [
  {
    icon: DollarSign,
    title: 'Pay Only for Space Used',
    desc: 'LTL shipping lets you share truck capacity with other businesses. You pay only for the weight and volume your cargo occupies.',
    stat: '30-40%',
    statLabel: 'Savings vs Full Truck',
  },
  {
    icon: Package,
    title: 'Small Shipment Friendly',
    desc: 'From 50 kg to 3 tonnes, LTL is designed for shipments too large for couriers but too small for a dedicated truck.',
    stat: '50kg–3T',
    statLabel: 'Weight Range',
  },
  {
    icon: Users,
    title: 'Shared Network Effect',
    desc: 'Your cargo travels alongside other verified shipments. More loads per truck means lower cost per tonne for everyone.',
    stat: '200+',
    statLabel: 'Active Trucks Daily',
  },
  {
    icon: Shield,
    title: 'Verified & Insured',
    desc: 'Every trucker is credit-scored and verified. Cargo insurance up to ₹5 lakh. GPS tracking on every shipment.',
    stat: '₹5L',
    statLabel: 'Cargo Insurance',
  },
];

const howItWorks = [
  { step: '1', title: 'Enter Shipment Details', desc: 'Origin, destination, weight, cargo type. Our calculator shows instant rate estimates.' },
  { step: '2', title: 'Choose a Truck', desc: 'AI recommends the best truck for your weight and route. Compare options and prices.' },
  { step: '3', title: 'Book & Track', desc: 'Confirm booking and track your cargo live via GPS. Get updates at every milestone.' },
  { step: '4', title: 'Deliver & Pay', desc: 'Receive delivery confirmation with ePOD. Pay securely through escrow.' },
];

const routes = [
  { from: 'Rourkela', to: 'Ranchi', rate: '₹1,800–2,500/tonne', distance: '180 km' },
  { from: 'Rourkela', to: 'Bhubaneswar', rate: '₹2,200–3,000/tonne', distance: '340 km' },
  { from: 'Rourkela', to: 'Kolkata', rate: '₹2,500–3,500/tonne', distance: '430 km' },
  { from: 'Ranchi', to: 'Jamshedpur', rate: '₹1,500–2,200/tonne', distance: '130 km' },
  { from: 'Bhubaneswar', to: 'Kolkata', rate: '₹2,000–2,800/tonne', distance: '470 km' },
  { from: 'Jamshedpur', to: 'Burdwan', rate: '₹2,200–3,000/tonne', distance: '320 km' },
];

const faqs = [
  { q: "What is LTL transport?", a: "LTL (Less Than Truckload) is a freight method where multiple shippers share space on the same truck. You pay only for the weight and volume your cargo uses. It's ideal for shipments from 50 kg to 3 tonnes that don't need an entire truck." },
  { q: "How is LTL different from PTL?", a: "PTL (Partial Truckload) and LTL (Less Than Truckload) are often used interchangeably in India. Both involve sharing truck space. PTL typically refers to 0.5–3 tonne shipments, while LTL can also cover smaller parcel-level loads. On LoadSaathi, we use PTL for the 0.5–3 tonne range." },
  { q: "What are typical LTL rates?", a: "LTL rates on East India corridors range from ₹1,500–3,500 per tonne depending on route, weight, and cargo type. Use LoadSaathi's fare calculator for an instant estimate." },
  { q: "Is my cargo safe in shared trucks?", a: "Yes. Every LoadSaathi trucker is verified with a credit score (300–900), GPS-tracked in real time, and cargo is insured up to ₹5 lakh. You also get electronic proof of delivery (ePOD)." },
  { q: "Which cities does LoadSaathi LTL cover?", a: "LoadSaathi covers all major East India cities: Rourkela, Ranchi, Bhubaneswar, Kolkata, Jamshedpur, Burdwan, Dhanbad, Sambalpur, and 50+ cities across Odisha, Jharkhand, and West Bengal." },
];

export default function LtlTransport() {
  
  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h2>LTL Transport in India | Less Than Truckload Shipping | LoadSaathi</h2>
          <p>LTL (Less Than Truckload) shipping lets businesses move 50kg–3 tonne shipments at shared-truck rates across East India. Pay only for the space your cargo uses with LoadSaathi's AI-matched trucks.</p>
          <h2>What is LTL Transport?</h2>
          <p>LTL freight consolidates multiple shippers' goods onto the same truck. Each shipper pays only for the weight and volume they use, making it cost-effective for small to medium shipments.</p>
          <h2>LTL vs PTL vs FTL</h2>
          <ul>
            <li><strong>LTL/PTL:</strong> 50kg–3 tonnes, shared truck, 30–40% cheaper</li>
            <li><strong>FTL:</strong> 7+ tonnes, exclusive truck, fastest delivery</li>
          </ul>
          <h2>Typical LTL Rates</h2>
          <ul>
            <li>Rourkela → Ranchi: ₹1,800–2,500/tonne</li>
            <li>Rourkela → Bhubaneswar: ₹2,200–3,000/tonne</li>
            <li>Rourkela → Kolkata: ₹2,500–3,500/tonne</li>
          </ul>
          <h2>Get Started</h2>
          <p>Post your LTL shipment at loadsaathi.in/register for instant AI-matched truck options.</p>
        </div>
      </noscript>
      <SeoMeta
        title="LTL Transport in India | Less Than Truckload Shipping"
        description="LTL (Less Than Truckload) transport for small shipments across East India. Move 50kg–3 tonnes at shared-truck rates. AI-matched trucks on Rourkela, Ranchi, Bhubaneswar, Kolkata corridors."
        keywords="LTL transport India, less than truckload India, LTL shipping, LTL freight, small shipment transport, LTL logistics, part load India"
        canonical="/ltl-transport"
        breadcrumbs={[{ name: "LTL Transport", url: "/ltl-transport" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "LoadSaathi LTL Transport",
            "description": "AI-powered less than truckload (LTL) shipping connecting businesses with shared truck capacity across East India.",
            "provider": {
              "@type": "Organization",
              "name": "LoadSaathi",
              "url": "https://loadsaathi.in"
            },
            "areaServed": ["Odisha", "Jharkhand", "West Bengal"],
            "serviceType": "Less Than Truckload Shipping"
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(f => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a }
            }))
          }
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">

      {/* HERO */}
      <section className="relative min-h-[680px] flex items-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.15]"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8">
              <div className="inline-flex items-center gap-2 w-fit">
                <span className="text-xs font-semibold tracking-widest uppercase bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-700/30">
                  Less Than Truckload
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                Small Loads.<br />
                <span className="bg-gradient-to-r from-violet-500 to-orange-400 bg-clip-text text-transparent">Big Savings.</span>
              </h1>
              <DirectAnswer
                answer="LTL (Less Than Truckload) transport is a freight method where multiple shippers share space on the same truck. You pay only for the weight and volume your cargo uses — ideal for shipments from 50 kg to 3 tonnes that don't need an entire truck."
                qualifier="Indicative rates only — actual quotes depend on cargo, route, and availability."
              />
              <KeyTakeaways
                items={[
                  "LTL is ideal for shipments from 50 kg to 3 tonnes",
                  "Pay only for the weight and volume your cargo uses",
                  "Costs 30–40% less than booking a full truck",
                  "Cargo is consolidated with other verified shipments",
                  "GPS tracking and escrow payments included"
                ]}
              />
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Moving 50 kg to 3 tonnes? Don't pay for an entire truck. LTL shipping consolidates your cargo with other shipments — you pay only for the space you use.
              </p>
              {/* Internal links to related services */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Link to="/ptl-transport" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">PTL Transport</Link>
                <span className="text-muted-foreground">·</span>
                <Link to="/truck-load-booking" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">Book a Full Truck</Link>
                <span className="text-muted-foreground">·</span>
                <Link to="/return-load" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">Find Return Loads</Link>
                <span className="text-muted-foreground">·</span>
                <Link to="/freight-marketplace" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">Freight Marketplace</Link>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <Link to="/register?type=shipper">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)] group">
                    Ship via LTL
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/tools/fare-calculator">
                  <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg border-border hover:border-violet-400 hover:text-violet-500 dark:hover:text-violet-400 transition-all text-foreground">
                    Get a Rate Estimate
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-float h-full min-h-[400px] flex items-center justify-center">
              <div className="glass-panel w-full h-[520px] rounded-xl p-6 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse-ring" />
                    <span className="text-xs text-muted-foreground dark:text-gray-300 uppercase tracking-widest">LTL Rate Estimator</span>
                  </div>
                  <span className="text-xs bg-violet-900/50 text-violet-300 px-2 py-1 rounded border border-violet-700/50">LTL</span>
                </div>
                <div className="flex-grow relative bg-card/50 rounded border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                  <div className="p-5 space-y-4 relative z-10">
                    <div className="glass-card p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase mb-3">Rate Comparison</div>
                      <div className="space-y-3">
                        {[
                          { type: 'LTL (1 tonne)', rate: '₹2,100/tonne', total: '₹2,100' },
                          { type: 'PTL (2 tonnes)', rate: '₹1,900/tonne', total: '₹3,800' },
                          { type: 'FTL (full truck)', rate: '₹9,500 flat', total: '₹9,500' },
                        ].map((item, i) => (
                          <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${i === 0 ? 'bg-violet-900/20 border border-violet-700/30' : 'bg-background/30'}`}>
                            <span className="text-sm font-semibold text-foreground">{item.type}</span>
                            <div className="text-right">
                              <span className={`text-sm font-bold ${i === 0 ? 'text-violet-400' : 'text-muted-foreground'}`}>{item.total}</span>
                              <span className="text-[10px] text-muted-foreground block">{item.rate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <Reveal as="section" className="py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Why Choose LTL</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">LTL is the most cost-effective way to ship small to medium loads across India.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-violet-500/30 elevate group">
                <div className="flex items-start gap-5">
                  <div className="bg-violet-600/10 dark:bg-violet-900/20 p-3 rounded-xl shrink-0">
                    <benefit.icon className="text-violet-500 text-2xl group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                      <span className="text-2xl font-black text-violet-400">{benefit.stat}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{benefit.statLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ROUTES */}
      <Reveal as="section" className="py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">LTL Rates on Popular Corridors</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Approximate rates per tonne. Use the fare calculator for exact pricing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route, i) => (
              <Link key={i} to={`/routes/${route.from.toLowerCase()}-to-${route.to.toLowerCase()}`} className="glass-card p-5 rounded-xl hover:border-violet-500/30 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{route.from} → {route.to}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-violet-400">{route.rate}</span>
                  <span className="text-xs text-muted-foreground">{route.distance}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* HOW IT WORKS */}
      <Reveal as="section" className="py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">How LTL Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <div key={i} className="glass-card p-8 rounded-xl text-center hover:border-violet-500/30 elevate">
                <div className="bg-violet-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-black">{step.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* FAQ */}
      <Reveal as="section" className="py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-3xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Frequently Asked Questions</h2>
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
      </Reveal>

      {/* CTA */}
      <Reveal as="section" className="py-32 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-violet-500/20 shadow-[0_0_50px_rgba(139,92,246,0.1)] text-center">
            <div className="bg-violet-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-8 w-8 text-violet-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Ship Small. Save Big.</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">Post your LTL shipment in 2 minutes. Get AI-matched trucks and transparent per-tonne pricing.</p>
            <Link to="/register?type=shipper">
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] group">
                Post LTL Shipment <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>

    </div>
    </>
  );
}
