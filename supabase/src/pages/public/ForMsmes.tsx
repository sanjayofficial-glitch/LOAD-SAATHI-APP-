
import { Link } from "react-router-dom";
import { ArrowRight, IndianRupee, Shield, BarChart3, Users, MapPin, Package } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";

const benefits = [
  { icon: IndianRupee, title: "Transparent Pricing", desc: "No hidden charges. See freight rates upfront before you book." },
  { icon: Shield, title: "Verified Truckers", desc: "Every trucker is verified with Aadhaar, driving licence, and vehicle RC." },
  { icon: BarChart3, title: "AI Rate Predictions", desc: "Know the fair market rate for your route before you commit." },
  { icon: Users, title: "Direct Connections", desc: "Skip brokers. Connect directly with truckers on your route." },
  { icon: Package, title: "PTL & LTL Options", desc: "Ship small loads at shared-truck rates. Pay only for the space you use." },
  { icon: MapPin, title: "GPS Tracking", desc: "Track your shipment in real time from pickup to delivery." },
];

const faqItems = [
  {
    q: "What is LoadSaathi for MSMEs?",
    a: "LoadSaathi is an AI-powered freight marketplace that connects small businesses directly with verified truckers. We eliminate the middleman so MSMEs get fair rates, transparent pricing, and reliable delivery.",
  },
  {
    q: "How much can MSMEs save on freight?",
    a: "MSMEs pay only for the truck space they use instead of booking a full truck. Our AI price predictor shows you the market rate before you book, so you can compare fairly.",
  },
  {
    q: "Can I ship small quantities?",
    a: "Yes. LoadSaathi supports PTL (Partial Truckload) and LTL (Less Than Truckload) options. You pay only for the space your cargo occupies — no need to book an entire truck for small shipments.",
  },
  {
    q: "Is LoadSaathi available in my city?",
    a: "LoadSaathi covers major cities across Odisha (Rourkela, Bhubaneswar, Cuttack, Sambalpur), Jharkhand (Ranchi, Jamshedpur), and West Bengal (Kolkata). We are expanding to more cities regularly.",
  },
];

export default function ForMsmes() {
  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Freight Transport for MSMEs — LoadSaathi</h2>
          <p>LoadSaathi connects small businesses directly with verified truckers. Transparent pricing, AI rate predictions, PTL/LTL options, and GPS tracking.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Freight Transport for MSMEs | PTL/LTL Shared Truck Booking"
        description="LoadSaathi connects MSMEs with verified truckers via AI-powered rate predictions and PTL/LTL options. No brokers, no hidden charges."
        keywords="MSME logistics India, small business freight transport, affordable truck booking, PTL for small business, B2B transport India, reduce freight cost MSME"
        canonical="/for-msmes"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "For MSMEs", url: "/for-msmes" },
        ]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Freight Transport for MSMEs — LoadSaathi",
            "description": "AI-powered freight marketplace for Indian MSMEs with transparent pricing and verified truckers.",
            "url": "https://loadsaathi.in/for-msmes",
          },
          {
            "@context": "https://schema.org",
            "@type": "QAPage",
            "mainEntity": {
              "@type": "Question",
              "name": "How can MSMEs reduce freight transport costs in India?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MSMEs can book through AI-powered marketplaces like LoadSaathi instead of using traditional brokers. LoadSaathi provides transparent pricing, AI rate predictions for each route, and PTL/LTL options so you only pay for the truck space you need.",
              },
            },
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        {/* Hero */}
        <section className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white py-20 px-6">
          <div className="max-w-[1200px] mx-auto">
            <p className="text-sm font-bold uppercase tracking-wider text-white/70 mb-3">Built for Indian MSMEs</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4">
              Freight Transport Made Affordable for Small Businesses
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-[700px] mb-8">
              LoadSaathi connects MSMEs directly with verified truckers. Transparent pricing, AI rate predictions, and no brokers — so you pay for the space you use.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/tools/freight-rate-calculator" className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors">
                Calculate Your Rate <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors">
                Sign Up Free
              </Link>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              Why Do MSMEs Pay More for Freight?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                { problem: "Broker Dependency", solution: "Direct trucker access via LoadSaathi", stat: "30%" },
                { problem: "Opaque Pricing", solution: "AI rate predictions before booking", stat: "Transparent rates" },
                { problem: "No Small-Load Options", solution: "PTL/LTL for any shipment size", stat: "50%" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl glass-card border border-border space-y-3">
                  <p className="text-red-400 text-sm font-bold">Problem: {item.problem}</p>
                  <p className="text-green-400 text-sm font-bold">Solution: {item.solution}</p>
                  <p className="text-4xl font-black text-orange-400">{item.stat}</p>
                  <p className="text-xs text-muted-foreground">savings / improvement</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2">How LoadSaathi Helps MSMEs</h2>
            <p className="text-muted-foreground mb-8">Everything your small business needs to ship cargo affordably and reliably.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b) => (
                <div key={b.title} className="glass-card p-6 rounded-xl border border-border space-y-3">
                  <b.icon className="h-6 w-6 text-orange-400" />
                  <h3 className="text-lg font-bold text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-8">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Enter Your Route", desc: "Tell us your origin, destination, and cargo weight." },
                { step: "2", title: "Get AI-Rated Quote", desc: "See the fair market rate before you commit." },
                { step: "3", title: "Book & Track", desc: "Choose a verified trucker and track in real time." },
              ].map((s) => (
                <div key={s.step} className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-orange-600 text-white font-black text-xl flex items-center justify-center mx-auto">{s.step}</div>
                  <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.q} className="glass-card p-5 rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-[800px] mx-auto text-center space-y-6">
            <h2 className="text-3xl font-black text-foreground">Ready to Ship Smarter?</h2>
            <p className="text-muted-foreground">Join hundreds of MSMEs already saving on freight with LoadSaathi.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                Get Started Free
              </Link>
              <Link to="/tools/freight-rate-calculator" className="border border-border hover:border-orange-500/30 text-foreground px-8 py-3 rounded-lg font-semibold transition-colors">
                Calculate Freight Rate
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
