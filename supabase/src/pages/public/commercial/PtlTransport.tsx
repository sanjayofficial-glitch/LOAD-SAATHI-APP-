
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, DollarSign, Shield, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from "@/components/SeoMeta";

const benefits = [
  {
    icon: DollarSign,
    title: '30–40% Lower Than FTL',
    desc: 'Share truck space with other shipments heading the same way. Pay only for the space your goods use, not the whole truck.',
    stat: '30-40%',
    statLabel: 'Cost Savings vs FTL',
  },
  {
    icon: Zap,
    title: 'Ideal for 0.5–3 Tonnes',
    desc: 'PTL is designed for shipments too large for couriers but too small to fill an entire truck. The sweet spot for MSMEs.',
    stat: '0.5–3T',
    statLabel: 'Optimal Weight Range',
  },
  {
    icon: Truck,
    title: 'Shared Truck Network',
    desc: 'Your goods travel on verified trucks heading the same direction. AI matches cargo by route, timing, and truck type.',
    stat: '95%',
    statLabel: 'Route Match Accuracy',
  },
  {
    icon: Shield,
    title: 'Full Cargo Protection',
    desc: 'GPS tracking, ePOD, and escrow-backed payments. Your cargo is protected from pickup to delivery.',
    stat: '₹5L',
    statLabel: 'Cargo Insurance',
  },
];

const differences = [
  { factor: 'Weight Range', ptl: '0.5–3 tonnes', ftl: '7+ tonnes' },
  { factor: 'Cost', ptl: '30–40% cheaper', ftl: 'Full truck rate' },
  { factor: 'Transit Time', ptl: '1–2 extra days', ftl: 'Direct, fastest' },
  { factor: 'Space', ptl: 'Shared with others', ftl: 'Exclusive use' },
  { factor: 'Best For', ptl: 'MSMEs, small batches', ftl: 'Bulk, urgent cargo' },
];

const howItWorks = [
  { step: '1', title: 'Post Your Shipment', desc: 'Enter origin, destination, weight, cargo type. Takes 2 minutes.' },
  { step: '2', title: 'AI Matches Trucks', desc: 'Our engine finds available PTL trucks on your route and recommends the best option.' },
  { step: '3', title: 'Compare & Confirm', desc: 'Review matched truckers, ratings, and estimated delivery times. Book instantly.' },
  { step: '4', title: 'Track & Get Paid', desc: 'GPS tracking from pickup to delivery. Pay securely via escrow on delivery confirmation.' },
];

const faqs = [
  { q: "What is PTL transport?", a: "PTL (Partial Truckload) is a freight shipping method where your goods share truck space with other shipments heading in the same direction. You pay only for the space your cargo occupies, making it 30–40% cheaper than booking an entire truck (FTL). It's ideal for shipments between 0.5 and 3 tonnes." },
  { q: "When should I use PTL instead of FTL?", a: "Use PTL when your shipment is under 3 tonnes and you have 1–2 extra days of delivery buffer. PTL saves 30–40% compared to FTL. Use FTL for shipments over 7 tonnes, urgent deliveries, or when you need exclusive use of the truck." },
  { q: "How is PTL different from LTL?", a: "PTL (Partial Truckload) and LTL (Less Than Truckload) are often used interchangeably in India. PTL typically refers to shipments 0.5–3 tonnes that share truck space, while LTL can include smaller parcel-level shipments. On LoadSaathi, we use PTL for the 0.5–3 tonne range." },
  { q: "What is the cost of PTL shipping?", a: "PTL rates on East India corridors range from ₹1,800–3,500 per tonne depending on route, cargo type, and season. Use LoadSaathi's fare calculator for an instant estimate on your specific route." },
  { q: "Which routes support PTL?", a: "LoadSaathi covers all major East India corridors for PTL: Rourkela–Ranchi, Rourkela–Bhubaneswar, Rourkela–Kolkata, Ranchi–Jamshedpur, Bhubaneswar–Kolkata, and 20+ more routes across Odisha, Jharkhand, and West Bengal." },
];

export default function PtlTransport() {
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
          <h2>PTL Transport in India | Partial Truckload Shipping | LoadSaathi</h2>
          <p>PTL (Partial Truckload) shipping lets MSMEs move 0.5–3 tonne shipments at 30–40% lower cost than FTL by sharing truck space on the same route. LoadSaathi's AI matches your cargo with the best available trucks across East India.</p>
          <h2>What is PTL Transport?</h2>
          <p>PTL is a freight method where your goods share space with other shipments heading the same direction. You pay only for the space your cargo occupies, making it the most cost-effective option for 0.5–3 tonne shipments.</p>
          <h2>PTL vs FTL</h2>
          <ul>
            <li><strong>PTL:</strong> 0.5–3 tonnes, 30–40% cheaper, 1–2 extra transit days</li>
            <li><strong>FTL:</strong> 7+ tonnes, direct point-to-point, fastest delivery</li>
          </ul>
          <h2>PTL Rates on East India Corridors</h2>
          <ul>
            <li>Rourkela → Ranchi: ₹1,800–2,500/tonne</li>
            <li>Rourkela → Bhubaneswar: ₹2,200–3,000/tonne</li>
            <li>Rourkela → Kolkata: ₹2,500–3,500/tonne</li>
          </ul>
          <h2>Get Started</h2>
          <p>Post your PTL shipment at loadsaathi.in/register. AI matches you with the best truck in seconds.</p>
        </div>
      </noscript>
      <SeoMeta
        title="PTL Transport in India | Partial Truckload Shipping"
        description="PTL (Partial Truckload) transport for MSMEs in India. Move 0.5–3 tonne shipments at 30–40% lower cost than FTL. AI-matched trucks on Rourkela, Ranchi, Bhubaneswar, Kolkata routes."
        keywords="PTL transport India, partial truckload India, PTL freight, part truck load, PTL shipping, partial load transport, PTL logistics"
        canonical="/ptl-transport"
        breadcrumbs={[{ name: "PTL Transport", url: "/ptl-transport" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "LoadSaathi PTL Transport",
            "description": "AI-powered partial truckload (PTL) shipping connecting MSMEs with shared truck capacity across East India corridors.",
            "provider": {
              "@type": "Organization",
              "name": "LoadSaathi",
              "url": "https://loadsaathi.in"
            },
            "areaServed": ["Odisha", "Jharkhand", "West Bengal"],
            "serviceType": "Partial Truckload Shipping"
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
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8">
              <div className="inline-flex items-center gap-2 w-fit">
                <span className="text-xs font-semibold tracking-widest uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-700/30">
                  Partial Truckload Shipping
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                Move Partial Loads.<br />
                <span className="bg-gradient-to-r from-blue-500 to-orange-400 bg-clip-text text-transparent">Pay Partial Prices.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Don't pay for an entire truck when you only need half. PTL shipping lets you share truck space with other shipments heading the same way — saving 30–40% on every load.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Link to="/register?type=shipper">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)] group">
                    Ship via PTL
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/tools/fare-calculator">
                  <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg border-border hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all text-foreground">
                    Get a Rate Estimate
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-float h-full min-h-[400px] flex items-center justify-center">
              <div className="glass-panel w-full h-[520px] rounded-xl p-6 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse-ring" />
                    <span className="text-xs text-muted-foreground dark:text-gray-300 uppercase tracking-widest">PTL Shipment Builder</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-700/50">PTL</span>
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-700/50">AI.MATCH</span>
                  </div>
                </div>
                <div className="flex-grow relative bg-card/50 rounded border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                  <div className="p-5 space-y-4 relative z-10">
                    <div className="glass-card p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase mb-2">Shipment Details</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background/60 p-2 rounded"><span className="text-[10px] text-muted-foreground block">From</span><span className="text-sm font-semibold">Rourkela, Odisha</span></div>
                        <div className="bg-background/60 p-2 rounded"><span className="text-[10px] text-muted-foreground block">To</span><span className="text-sm font-semibold">Ranchi, Jharkhand</span></div>
                        <div className="bg-background/60 p-2 rounded"><span className="text-[10px] text-muted-foreground block">Weight</span><span className="text-sm font-semibold">1.5 Tonnes</span></div>
                        <div className="bg-background/60 p- rounded"><span className="text-[10px] text-muted-foreground block">Type</span><span className="text-sm font-semibold">Steel Parts</span></div>
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase mb-3">AI Recommendation</div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-900/20 border border-green-700/30">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-green-400" />
                          <div>
                            <span className="text-sm font-semibold">Tata 407 Gold SFC</span>
                            <span className="text-[10px] text-muted-foreground block">16T capacity · 1.5T your cargo</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-green-400">₹2,700</span>
                          <span className="text-[10px] text-muted-foreground block">per tonne</span>
                        </div>
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
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Why MSMEs Choose PTL</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">PTL is the smartest way for small businesses to ship goods without paying for an entire truck.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-blue-500/30 transition-all duration-300 group">
                <div className="flex items-start gap-5">
                  <div className="bg-blue-600/10 dark:bg-blue-900/20 p-3 rounded-xl shrink-0">
                    <benefit.icon className="text-blue-500 text-2xl group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                      <span className="text-2xl font-black text-blue-400">{benefit.stat}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{benefit.statLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PTL vs FTL */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">PTL vs FTL: Quick Comparison</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Choose the right option for your shipment size and timeline.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full glass-card rounded-xl">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-sm font-bold text-muted-foreground">Factor</th>
                  <th className="p-4 text-left text-sm font-bold text-blue-400">PTL</th>
                  <th className="p-4 text-left text-sm font-bold text-orange-400">FTL</th>
                </tr>
              </thead>
              <tbody>
                {differences.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="p-4 text-sm font-semibold text-foreground">{row.factor}</td>
                    <td className="p-4 text-sm text-blue-300">{row.ptl}</td>
                    <td className="p-4 text-sm text-orange-300">{row.ftl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 text-center">
            <Link to="/guide/ptl-vs-ftl" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4">
              Read the full PTL vs FTL guide →
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">How PTL Works on LoadSaathi</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From posting to delivery in 4 simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <div key={i} className="glass-card p-8 rounded-xl text-center hover:border-blue-500/30 transition-all duration-300">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-black">{step.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
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
      </section>

      {/* CTA */}
      <section className="fade-section py-32 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)] text-center">
            <div className="bg-blue-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Ship Smarter with PTL</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">Post your PTL shipment in 2 minutes. Get AI-matched trucks, transparent pricing, and GPS-tracked delivery.</p>
            <Link to="/register?type=shipper">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.3)] group">
                Post PTL Shipment <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
    </>
  );
}
