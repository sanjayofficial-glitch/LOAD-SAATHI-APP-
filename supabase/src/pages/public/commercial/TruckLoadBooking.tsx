
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, CreditCard, Shield, Route, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from "@/components/SeoMeta";

const benefits = [
  {
    icon: Search,
    title: 'AI-Matched Trucks',
    desc: 'Enter your origin, destination, and cargo. Our AI instantly finds the best available trucks based on route, capacity, price, and reliability.',
    stat: '2.4x',
    statLabel: 'Faster Than Brokers',
  },
  {
    icon: CreditCard,
    title: 'Transparent Pricing',
    desc: 'AI price prediction shows you the fair market rate before you book. No hidden charges, no broker markups, no surprises.',
    stat: '0%',
    statLabel: 'Hidden Fees',
  },
  {
    icon: Shield,
    title: 'Verified Truckers',
    desc: 'Every trucker has a digital credit score (300–900). See their ratings, completion rate, and payment history before booking.',
    stat: '8,500+',
    statLabel: 'Verified Truckers',
  },
  {
    icon: Route,
    title: 'Live GPS Tracking',
    desc: 'Track your shipment from pickup to delivery. Real-time location, ETA updates, and milestone notifications.',
    stat: '100%',
    statLabel: 'Shipment Visibility',
  },
];

const truckTypes = [
  { name: 'Tata Ace / Mini Truck', capacity: '0.5–1T', bestFor: 'Local, small parcels' },
  { name: 'Tata Intra / Pickup', capacity: '1–2T', bestFor: 'Short-haul, light cargo' },
  { name: 'Tata 407 / Eicher', capacity: '2–5T', bestFor: 'Medium PTL/LTL loads' },
  { name: 'Container / LPT', capacity: '5–10T', bestFor: 'Large PTL, weather-sensitive' },
  { name: 'Tractor Trailer', capacity: '15–25T', bestFor: 'Bulk, FTL shipments' },
];

const howItWorks = [
  { step: '1', title: 'Post Your Load', desc: 'Enter origin, destination, weight, cargo type, and pickup window. Takes 2 minutes.' },
  { step: '2', title: 'AI Matches Trucks', desc: 'Our algorithm evaluates hundreds of truckers and recommends the best match.' },
  { step: '3', title: 'Book & Pay', desc: 'Confirm the match, pay securely via escrow. No cash, no broker.' },
  { step: '4', title: 'Track & Receive', desc: 'GPS tracking from pickup to delivery. Confirm ePOD and release payment.' },
];

const faqs = [
  { q: "How do I book a truck on LoadSaathi?", a: "Register as a shipper, post your load with origin, destination, weight, and cargo details. Our AI instantly matches you with available trucks. Review options, compare prices, and book in minutes." },
  { q: "What truck types are available?", a: "LoadSaathi offers Tata Ace (0.5T), Intra pickups (1–2T), Tata 407/Eicher (2–5T), containers (5–10T), and tractor-trailers (15–25T). AI recommends the right truck for your cargo." },
  { q: "How is pricing determined?", a: "Our AI price predictor analyzes distance, weight, route demand, fuel costs, and truck availability to recommend fair market rates. You see the estimate before booking — no hidden fees." },
  { q: "Is payment secure?", a: "Yes. LoadSaathi uses escrow-backed payments. Funds are held securely and released to the trucker only after delivery confirmation via GPS and electronic proof of delivery (ePOD)." },
  { q: "Can I track my shipment?", a: "Absolutely. Every LoadSaathi shipment includes real-time GPS tracking. You get location updates, ETA predictions, and milestone notifications from pickup to delivery." },
];

export default function TruckLoadBooking() {
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
          <h1>Truck Load Booking in India | Book Trucks Online | LoadSaathi</h1>
          <p>Book trucks online for PTL, LTL, and FTL shipments across East India. AI-matched trucks, transparent pricing, GPS tracking, and secure payments on LoadSaathi.</p>
          <h2>How to Book a Truck</h2>
          <ol>
            <li>Post your load with origin, destination, weight, and cargo type</li>
            <li>AI matches you with the best available trucks</li>
            <li>Compare options, review trucker ratings, and book</li>
            <li>Track via GPS and pay securely on delivery</li>
          </ol>
          <h2>Truck Types Available</h2>
          <ul>
            <li><strong>Mini Truck (Tata Ace):</strong> 0.5–1 tonne, local deliveries</li>
            <li><strong>Pickup (Tata Intra):</strong> 1–2 tonnes, short-haul</li>
            <li><strong>Light Commercial (Tata 407):</strong> 2–5 tonnes, medium loads</li>
            <li><strong>Container:</strong> 5–10 tonnes, weather-sensitive cargo</li>
            <li><strong>Tractor Trailer:</strong> 15–25 tonnes, bulk shipments</li>
          </ul>
          <h2>Get Started</h2>
          <p>Register at loadsaathi.in/register as a shipper to book your first truck.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Truck Load Booking in India | Book Trucks Online"
        description="Book trucks online for PTL, LTL, and FTL shipments across East India. AI-matched trucks, transparent pricing, GPS tracking, and secure payments. 8,500+ verified truckers."
        keywords="truck load booking India, book truck online, truck transport booking, freight booking India, online truck booking, book truck for goods"
        canonical="/truck-load-booking"
        breadcrumbs={[{ name: "Truck Load Booking", url: "/truck-load-booking" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "LoadSaathi Truck Load Booking",
            "description": "Online truck booking platform for PTL, LTL, and FTL freight across East India. AI-matched trucks, transparent pricing, GPS tracking.",
            "provider": {
              "@type": "Organization",
              "name": "LoadSaathi",
              "url": "https://loadsaathi.in"
            },
            "areaServed": ["Odisha", "Jharkhand", "West Bengal"],
            "serviceType": "Truck Booking"
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
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8">
              <div className="inline-flex items-center gap-2 w-fit">
                <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
                  Book Trucks Online
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                Book a Truck.<br />
                <span className="bg-gradient-to-r from-orange-500 to-green-400 bg-clip-text text-transparent">Ship Anywhere.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                From 50 kg to 25 tonnes. Post your load, get AI-matched trucks in seconds, book with transparent pricing, and track every kilometre live.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Link to="/register?type=shipper">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)] group">
                    Book a Truck
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/tools/fare-calculator">
                  <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg border-border hover:border-orange-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all text-foreground">
                    Get a Price Estimate
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-float h-full min-h-[400px] flex items-center justify-center">
              <div className="glass-panel w-full h-[520px] rounded-xl p-6 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse-ring" />
                    <span className="text-xs text-muted-foreground dark:text-gray-300 uppercase tracking-widest">Truck Booking</span>
                  </div>
                  <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-700/50">LIVE</span>
                </div>
                <div className="flex-grow relative bg-card/50 rounded border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                  <div className="p-5 space-y-4 relative z-10">
                    <div className="glass-card p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase mb-3">AI Matched Trucks</div>
                      <div className="space-y-2">
                        {[
                          { truck: 'Tata 407 Gold SFC', match: '98%', price: '₹4,200', capacity: '5T' },
                          { truck: 'Eicher 14ft', match: '92%', price: '₹3,800', capacity: '4T' },
                          { truck: 'Tata Intra V30', match: '85%', price: '₹2,600', capacity: '2T' },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-border pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <Truck className="h-3 w-3 text-orange-400" />
                              <div>
                                <span className="text-xs font-semibold text-foreground">{item.truck}</span>
                                <span className="text-[10px] text-muted-foreground block">{item.capacity} · {item.match} match</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-green-400">{item.price}</span>
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
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Why Book on LoadSaathi</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-orange-500/30 transition-all duration-300 group">
                <div className="flex items-start gap-5">
                  <div className="bg-orange-600/10 dark:bg-orange-900/20 p-3 rounded-xl shrink-0">
                    <benefit.icon className="text-orange-500 text-2xl group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                      <span className="text-2xl font-black text-orange-400">{benefit.stat}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{benefit.statLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUCK TYPES */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Available Truck Types</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">From mini trucks to tractor-trailers. AI recommends the right truck for your cargo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {truckTypes.map((truck, i) => (
              <div key={i} className="glass-card p-5 rounded-xl hover:border-orange-500/30 transition-all text-center">
                <Truck className="h-8 w-8 text-orange-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-foreground mb-1">{truck.name}</h3>
                <p className="text-lg font-black text-orange-400">{truck.capacity}</p>
                <p className="text-xs text-muted-foreground mt-1">{truck.bestFor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">How Truck Booking Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <div key={i} className="glass-card p-8 rounded-xl text-center hover:border-orange-500/30 transition-all duration-300">
                <div className="bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-black">{step.step}</div>
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)] text-center">
            <div className="bg-orange-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Ready to Ship?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">Post your first load in 2 minutes. Get AI-matched trucks, transparent pricing, and GPS-tracked delivery.</p>
            <Link to="/register?type=shipper">
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] group">
                Book a Truck Now <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
    </>
  );
}
