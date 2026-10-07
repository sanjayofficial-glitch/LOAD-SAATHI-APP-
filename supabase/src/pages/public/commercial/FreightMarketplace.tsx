
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Package, Route, Shield, DollarSign, MapPin, ArrowRight, CheckCircle, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from "@/components/SeoMeta";

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Matching',
    desc: 'Multi-factor algorithm analyzes route, capacity, price, rating, and timing to match shippers with the best truckers in seconds.',
    stat: '7',
    statLabel: 'Matching Factors',
  },
  {
    icon: DollarSign,
    title: 'Transparent Pricing',
    desc: 'AI price prediction shows fair market rates. No broker markups, no hidden fees, no surprises.',
    stat: '0%',
    statLabel: 'Middlemen',
  },
  {
    icon: Shield,
    title: 'Verified Users',
    desc: 'Every shipper and trucker has a credit score (300–900). See ratings, completion rates, and reviews before transacting.',
    stat: '300-900',
    statLabel: 'Credit Score Range',
  },
  {
    icon: MapPin,
    title: 'Real-Time Tracking',
    desc: 'GPS tracking from pickup to delivery. Live location, ETA, and milestone notifications for every shipment.',
    stat: '100%',
    statLabel: 'Live Visibility',
  },
  {
    icon: Package,
    title: 'PTL, LTL & FTL',
    desc: 'Move 50 kg or 25 tonnes. Share truck space (PTL/LTL) or book the entire truck (FTL). AI recommends the best option.',
    stat: '50kg–25T',
    statLabel: 'Weight Range',
  },
  {
    icon: Clock,
    title: 'Fast Payments',
    desc: 'Escrow-backed payments released within 24–48 hours of delivery. No more 30–60 day broker credit cycles.',
    stat: '< 48hrs',
    statLabel: 'Payment Release',
  },
];

const forShippers = [
  'Post loads in 2 minutes — origin, destination, weight, cargo type',
  'AI matches the best trucks for your route and budget',
  'Compare trucker ratings, prices, and transit times',
  'GPS tracking from pickup to delivery',
  'Secure escrow payments — release on ePOD confirmation',
  'Credit scores ensure trucker accountability',
];

const forTruckers = [
  'Browse AI-matched loads on your routes',
  'Find return loads — eliminate empty kilometres',
  'Transparent pricing — know the rate before you accept',
  'Build your credit score with every trip',
  'Fast payments within 24–48 hours',
  'Direct shipper communication — no brokers',
];

const corridors = [
  { route: 'Rourkela → Ranchi', distance: '180 km' },
  { route: 'Rourkela → Bhubaneswar', distance: '340 km' },
  { route: 'Rourkela → Kolkata', distance: '430 km' },
  { route: 'Ranchi → Jamshedpur', distance: '130 km' },
  { route: 'Bhubaneswar → Kolkata', distance: '470 km' },
  { route: 'Jamshedpur → Burdwan', distance: '320 km' },
];

const faqs = [
  { q: "What is a digital freight marketplace?", a: "A digital freight marketplace is an online platform connecting shippers (businesses needing to move goods) with truckers (those with available capacity). Instead of calling brokers, both sides transact directly through the platform with transparent pricing, verified identities, and secure payments." },
  { q: "How does LoadSaathi work?", a: "Shippers post loads with origin, destination, weight, and cargo details. LoadSaathi's AI matches them with available trucks based on 7 factors: route, capacity, price, rating, timeliness, communication, and tenure. Both sides track the shipment via GPS and transact through escrow." },
  { q: "What does LoadSaathi charge?", a: "LoadSaathi is free to join. We charge a 2–5% transaction fee per completed shipment, varying by role, volume, and credit score. No subscriptions, no hidden fees, no minimum commitments." },
  { q: "Which corridors does LoadSaathi cover?", a: "LoadSaathi covers 25+ corridors across East India: Rourkela–Ranchi, Rourkela–Bhubaneswar, Rourkela–Kolkata, Ranchi–Jamshedpur, Bhubaneswar–Kolkata, and more across Odisha, Jharkhand, and West Bengal." },
  { q: "Is LoadSaathi a broker?", a: "No. LoadSaathi is a digital freight marketplace — not a broker. We connect shippers directly with verified truckers. Our AI handles matching, pricing, and tracking. No middlemen, no markups." },
];

export default function FreightMarketplace() {
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
          <h2>Freight Marketplace in India | Digital Freight Platform | LoadSaathi</h2>
          <p>LoadSaathi is India's AI-powered freight marketplace connecting shippers directly with verified truckers for PTL, LTL, and FTL loads across East India. Transparent pricing, GPS tracking, and secure payments.</p>
          <h2>What is a Freight Marketplace?</h2>
          <p>A freight marketplace is an online platform where shippers post loads and truckers offer capacity. LoadSaathi uses AI to match the best truck for each load based on route, price, capacity, and reliability.</p>
          <h2>How LoadSaathi Works</h2>
          <ol>
            <li>Shipper posts a load (origin, destination, weight, cargo type)</li>
            <li>AI matches the best available trucks</li>
            <li>Shipper books and pays via escrow</li>
            <li>Trucker delivers, GPS-tracked in real time</li>
            <li>Payment released on delivery confirmation</li>
          </ol>
          <h2>Key Features</h2>
          <ul>
            <li>AI-powered 7-factor matching</li>
            <li>Transparent AI price prediction</li>
            <li>Credit scores (300–900) for all users</li>
            <li>Real-time GPS tracking</li>
            <li>PTL, LTL, and FTL options</li>
            <li>Escrow-backed fast payments</li>
          </ul>
          <h2>Get Started</h2>
          <p>Register at loadsaathi.in/register as a shipper or trucker.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Freight Marketplace in India | Digital Freight Platform"
        description="LoadSaathi is India's AI-powered freight marketplace for PTL, LTL, and FTL loads. Connect shippers with verified truckers across East India. Transparent pricing, GPS tracking, secure payments."
        keywords="freight marketplace India, digital freight platform, freight booking India, online freight, truck marketplace, freight platform India"
        canonical="/freight-marketplace"
        breadcrumbs={[{ name: "Freight Marketplace", url: "/freight-marketplace" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi",
            "url": "https://loadsaathi.in",
            "applicationCategory": "BusinessApplication",
            "description": "AI-powered freight marketplace connecting shippers and truckers for PTL, LTL, and FTL loads across East India.",
            "operatingSystem": "Web, Android",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            }
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
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
                India's AI Freight Marketplace
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Move More.<br />
              <span className="bg-gradient-to-r from-orange-500 to-blue-400 bg-clip-text text-transparent">Waste Less.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              LoadSaathi connects businesses that need to ship goods with truckers who have available capacity. PTL, LTL, and FTL loads across East India — with AI matching, transparent pricing, and GPS tracking.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register?type=shipper">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)] group">
                  I'm a Shipper
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/register?type=trucker">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.4)] group">
                  I'm a Trucker
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Platform Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Everything you need to ship and move freight digitally.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-orange-500/30 transition-all duration-300 group">
                <div className="bg-orange-600/10 dark:bg-orange-900/20 p-3 rounded-xl w-fit mb-4">
                  <feature.icon className="text-orange-500 text-2xl group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{feature.desc}</p>
                <div className="pt-4 border-t border-border flex items-center gap-2">
                  <span className="text-2xl font-black text-orange-400">{feature.stat}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{feature.statLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR SHIPPERS / FOR TRUCKERS */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-orange-400" />
                <h3 className="text-2xl font-black text-foreground">For Shippers</h3>
              </div>
              <ul className="space-y-3">
                {forShippers.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register?type=shipper" className="mt-6 inline-block">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-3 h-auto rounded-lg group">
                  Ship Now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="glass-card p-8 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="h-6 w-6 text-blue-400" />
                <h3 className="text-2xl font-black text-foreground">For Truckers</h3>
              </div>
              <ul className="space-y-3">
                {forTruckers.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register?type=trucker" className="mt-6 inline-block">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-3 h-auto rounded-lg group">
                  Find Loads <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CORRIDORS */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Key Freight Corridors</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">25+ corridors across East India. Browse all routes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {corridors.map((corridor, i) => {
              const slug = corridor.route.toLowerCase().replace(/ → /g, '-to-').replace(/ /g, '');
              return (
                <Link key={i} to={`/routes/${slug}`} className="glass-card p-5 rounded-xl hover:border-orange-500/30 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Route className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-semibold text-foreground">{corridor.route}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-7">{corridor.distance}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Link to="/routes" className="text-sm text-orange-400 hover:text-orange-300 underline underline-offset-4">
              Browse all 25+ corridors →
            </Link>
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
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Join India's Freight Revolution</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">Whether you're shipping goods or hauling freight, LoadSaathi gives you the tools, transparency, and trust to move smarter.</p>
            <div className="space-y-3">
              <Link to="/register?type=shipper">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] group">
                  Register as Shipper <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/register?type=trucker">
                <Button variant="outline" className="w-full text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg border-border hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all text-foreground">
                  Register as Trucker
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
    </>
  );
}
