
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Shield, Truck, MapPin, Clock, IndianRupee, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from "@/components/SeoMeta";

const comparisonData = [
  {
    feature: 'Pricing Transparency',
    loadsaathi: { value: 'AI-calculated market rates visible upfront', available: true },
    brokers: { value: 'Phone-based negotiation, opaque margins', available: false },
  },
  {
    feature: 'GPS Tracking',
    loadsaathi: { value: 'Real-time live tracking on every trip', available: true },
    brokers: { value: 'Manual check-in calls, no live visibility', available: false },
  },
  {
    feature: 'Credit Score System',
    loadsaathi: { value: '300-900 digital freight credit score', available: true },
    brokers: { value: 'No standardized trust metric', available: false },
  },
  {
    feature: 'AI Load Matching',
    loadsaathi: { value: 'Multi-factor AI algorithm (7 weighted criteria)', available: true },
    brokers: { value: 'Manual matching via phone calls', available: false },
  },
  {
    feature: 'Empty Kilometer Reduction',
    loadsaathi: { value: 'Return-load matching saves up to 40%', available: true },
    brokers: { value: 'No systematic return-load solution', available: false },
  },
  {
    feature: 'In-App Chat',
    loadsaathi: { value: 'Real-time messaging with dispute protection', available: true },
    brokers: { value: 'Phone calls only, no audit trail', available: false },
  },
  {
    feature: 'Digital Documentation',
    loadsaathi: { value: 'E-receipts, trip history, digital records', available: true },
    brokers: { value: 'Paper-based, manual record-keeping', available: false },
  },
  {
    feature: 'Carbon Emissions Tracking',
    loadsaathi: { value: 'Per-trip CO2 calculation and reporting', available: true },
    brokers: { value: 'Not available', available: false },
  },
];

const stats = [
  { value: '40%', label: 'Lower Empty Kilometers', icon: Truck },
  { value: '34%', label: 'Higher Capacity Utilization', icon: BarChart3 },
  { value: '28%', label: 'Faster Load-to-Truck', icon: Clock },
  { value: '3x', label: 'Faster Return Loads', icon: MapPin },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "LoadSaathi vs Traditional Freight Brokers — Detailed Comparison",
  description: "Compare LoadSaathi's AI-powered freight marketplace with traditional brokers. See pricing transparency, GPS tracking, credit scores, and AI matching advantages side-by-side.",
  url: "https://loadsaathi.in/compare",
  isPartOf: { "@type": "WebSite", name: "LoadSaathi", url: "https://loadsaathi.in" },
  mainEntity: {
    "@type": "ItemList",
    name: "LoadSaathi vs Traditional Brokers Comparison",
    itemListElement: comparisonData.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.feature,
      description: `LoadSaathi: ${item.loadsaathi.value}. Traditional brokers: ${item.brokers.value}.`,
    })),
  },
};

export default function Comparison() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <SeoMeta
        title="LoadSaathi vs Traditional Freight Brokers — Full Comparison (2026)"
        description="Compare LoadSaathi's AI-powered freight marketplace with traditional brokers. See pricing transparency, GPS tracking, credit scores, and AI matching advantages side-by-side."
        canonical="/compare"
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Comparison", url: "/compare" },
        ]}
      />
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h1>LoadSaathi vs Traditional Freight Brokers</h1>
          <p>LoadSaathi is an AI-powered freight marketplace that connects shippers directly with verified truckers. Compared to traditional brokers, LoadSaathi offers transparent AI-calculated pricing, real-time GPS tracking, a 300-900 credit score system, multi-factor AI matching (7 weighted criteria), return-load matching that reduces empty kilometers by up to 40%, in-app chat with dispute protection, digital documentation, and carbon emissions tracking.</p>
          <h2>Key Advantages</h2>
          <ul>
            <li>40% lower empty kilometers through return-load matching</li>
            <li>34% higher capacity utilization via AI matching</li>
            <li>28% faster load-to-truck matching times</li>
            <li>3x faster return loads for truckers</li>
            <li>Transparent pricing with no broker margins</li>
            <li>Real-time GPS tracking on every trip</li>
            <li>Digital freight credit score (300-900)</li>
          </ul>
          <p><strong>Traditional brokers</strong> rely on phone-based negotiation, opaque margins, manual check-in calls, no standardized trust metrics, paper-based records, and no systematic return-load solutions.</p>
          <h2>Learn More</h2>
          <p>Visit <a href="https://loadsaathi.in/features">Features</a>, <a href="https://loadsaathi.in/pricing">Pricing</a>, or <a href="https://loadsaathi.in/about">About</a> for more details.</p>
        </div>
      </noscript>
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-40" />
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
            style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="max-w-[1200px] mx-auto px-6 sm:px-12 py-20 sm:py-28 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">Comparison Guide</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground dark:text-white">
              LoadSaathi <span className="text-orange-600 dark:text-orange-400">vs</span> Traditional Brokers
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              A side-by-side comparison of India's AI-powered freight marketplace against the traditional broker model. See why truckers and shippers are switching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg font-semibold rounded-xl">
                  Join LoadSaathi Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-border dark:border-white/5 bg-muted/50 dark:bg-[#010f1f]/80 backdrop-blur-sm">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-3" />
                <div className="text-3xl sm:text-4xl font-black text-orange-600 dark:text-orange-400">{stat.value}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 sm:py-28">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white text-center">Feature-by-Feature Comparison</h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">Every advantage LoadSaathi offers over the traditional broker model — with specifics.</p>
            <div className="space-y-0 border border-border dark:border-white/10 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-muted/80 dark:bg-white/5 border-b border-border dark:border-white/10 px-6 py-4">
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Feature</div>
                <div className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-center">LoadSaathi</div>
                <div className="text-sm font-bold text-muted-foreground/60 uppercase tracking-wider text-center">Traditional Brokers</div>
              </div>
              {comparisonData.map((item, i) => (
                <div key={i} className={`grid grid-cols-3 px-6 py-5 ${i < comparisonData.length - 1 ? 'border-b border-border dark:border-white/5' : ''} hover:bg-muted/30 transition-colors`}>
                  <div className="text-sm font-semibold text-foreground">{item.feature}</div>
                  <div className="flex items-start justify-center gap-2 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item.loadsaathi.value}</span>
                  </div>
                  <div className="flex items-start justify-center gap-2 px-4">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground/60">{item.brokers.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 sm:py-28 bg-muted/30 dark:bg-[#010f1f]/50 border-y border-border dark:border-white/5">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-12 text-foreground dark:text-white text-center">How LoadSaathi Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Post Your Load', desc: 'Enter origin, destination, weight, and cargo details. AI calculates a market-aligned price instantly.', icon: Truck },
                { step: '2', title: 'AI Matches You', desc: 'Our algorithm scores truckers on 7 factors: route fit, capacity, price, timing, rating, communication, and tenure.', icon: Shield },
                { step: '3', title: 'Track & Complete', desc: 'Real-time GPS tracking, in-app chat, digital receipts, and automatic credit score updates.', icon: MapPin },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-600 text-white flex items-center justify-center text-2xl font-black mx-auto mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-28">
          <div className="max-w-[800px] mx-auto px-6 sm:px-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-6 text-foreground dark:text-white">Ready to Skip the Broker?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 500+ verified truckers and shippers using LoadSaathi's AI-powered marketplace. Free to join, no hidden fees.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg font-semibold rounded-xl">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-semibold rounded-xl border-orange-500/30 hover:bg-orange-500/10">
                  View Pricing <IndianRupee className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
