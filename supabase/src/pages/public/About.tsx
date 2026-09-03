
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Target, Eye, Heart, Shield, Zap, Users, Globe, ArrowRight, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";
import TeamShowcase from "@/components/ui/team-showcase";

const values = [
  { icon: Target, title: "Purpose-Driven Innovation", desc: "Every feature we build directly targets India's 40% empty kilometer problem. We don't add fluff — we solve real logistics inefficiencies." },
  { icon: Heart, title: "Trust Above All", desc: "Our platform is built on transparency and accountability. Digital credit scores, bidirectional reviews, and verified profiles ensure trust in every transaction." },
  { icon: Shield, title: "Empathy for Both Sides", desc: "We design for shippers AND truckers, understanding the unique challenges each face. A healthy logistics ecosystem serves both equally." },
  { icon: Zap, title: "Speed & Simplicity", desc: "Logistics is complex, but using LoadSaathi shouldn't be. We obsess over reducing friction — from registration to payment settlement." },
  { icon: Users, title: "Community First", desc: "We're building more than a platform — we're building a network. Every member strengthens the ecosystem for everyone else." },
];

const stats = [
  { value: "40%", label: "Empty Kilometers Today", detail: "Of all truck kilometers in India are run empty" },
  { value: "₹1.5L Cr", label: "Annual Economic Loss", detail: "Wasted annually due to logistics inefficiency" },
  { value: "0%", label: "Tolerance for Inefficiency", detail: "Our commitment to eliminating waste" },
];

const About = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h1>About LoadSaathi — India's AI Freight Operating System</h1>
          <p>LoadSaathi is an AI-powered logistics platform founded by Sanjaya Sahu from Rourkela, Odisha. Our mission is to eliminate empty kilometers and build the most efficient freight network in India.</p>
          <h2>Our Mission</h2>
          <p>With 1 in 3 trucks returning empty and 67% of India's logistics still unorganized, we leverage AI to create a transparent, efficient, and trusted marketplace where every kilometer carries value.</p>
          <h2>Our Vision</h2>
          <p>Building India's most efficient freight network — where every kilometer carries value and empty trucks become a thing of the past.</p>
          <h2>The Problem We Solve</h2>
          <ul>
            <li>Empty trucks return 600+ km on average, wasting ₹10,000–₹25,000 in fuel.</li>
            <li>Manual processes and phone-based bookings limit truckers to 15-20 loads per month.</li>
            <li>No real-time tracking or visibility for shippers.</li>
            <li>Payment delays, disputes, and manual invoicing add 15-20 days overhead.</li>
            <li>Over 80% of freight brokers charge hidden margins.</li>
          </ul>
          <h2>Our Story</h2>
          <p>Founded by Sanjaya Sahu, an FTBI alumnus from NIT Rourkela. After years in the Indian logistics industry seeing truckers return empty and shippers struggling to find reliable carriers, he realized the problem wasn't trucks — it was disconnection. LoadSaathi was born to bring transparency, trust, and intelligence to Indian freight.</p>
          <h2>Our Values</h2>
          <ul>
            <li><strong>Transparency First:</strong> Every transaction, price, and performance metric is open and visible.</li>
            <li><strong>Win-Win Model:</strong> Both shippers and truckers must benefit from every match.</li>
            <li><strong>Community Trust:</strong> Reviews, ratings, and verification build a self-governing ecosystem.</li>
            <li><strong>AI-Driven Efficiency:</strong> Technology eliminates waste and maximizes output.</li>
            <li><strong>Trucker Dignity:</strong> Professional tools and respectful treatment of drivers.</li>
          </ul>
          <h2>Our Impact</h2>
          <ul>
            <li><strong>15,000+ km:</strong> Empty kilometers eliminated every month.</li>
            <li><strong>2,500+ Tonnes:</strong> Monthly freight movement across 14 states.</li>
            <li><strong>50+ Route Corridors:</strong> Pan-India network from Kashmir to Kanyakumari.</li>
            <li><strong>₹30L+:</strong> Monthly savings passed to truckers.</li>
          </ul>
          <h2>Leadership</h2>
          <p><strong>Sanjaya Sahu — Founder &amp; CEO</strong></p>
          <p>FTBI Alumnus, NIT Rourkela Campus. Former operations and technology leader with deep logistics expertise.</p>
          <h2>Why LoadSaathi</h2>
          <ul>
            <li><strong>For Shippers:</strong> Real-time tracking, transparent pricing, verified fleet, instant booking, guaranteed capacity.</li>
            <li><strong>For Truckers:</strong> Backhaul loads, zero empty returns, guaranteed payments, AI routing, digital records.</li>
          </ul>
          <h2>Media</h2>
          <p>Recognized in The Hindu, Business Standard, NDTV Profit, Indian Startup News, and other national publications.</p>
        </div>
      </noscript>
      <SeoMeta
        title="About Us — India's Smart Freight Network"
        description="LoadSaathi is India's shared freight marketplace connecting shippers and truckers directly. AI-powered matching, zero middlemen, lower costs for East India corridors."
        keywords="about LoadSaathi, freight marketplace India, logistics startup Rourkela, shared freight East India"
        canonical="/about"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "About", url: "/about" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About LoadSaathi",
          "description": "LoadSaathi is India's shared freight marketplace connecting shippers and truckers directly. AI-powered matching, zero middlemen, lower costs for East India corridors.",
          "url": "https://loadsaathi.in/about",
          "mainEntity": {
            "@type": "Organization",
            "name": "LoadSaathi",
            "url": "https://loadsaathi.in",
            "foundingDate": "2025",
            "founder": {
              "@type": "Person",
              "name": "Sanjaya Sahu",
              "telephone": "+91-83289-98031",
              "sameAs": "https://www.linkedin.com/in/sanjaya-sahu-253315305/"
            },
            "employee": [
              {
                "@type": "Person",
                "name": "Sanjaya Sahu",
                "jobTitle": "Founder & CEO",
                "telephone": "+91-83289-98031",
                "sameAs": "https://www.linkedin.com/in/sanjaya-sahu-253315305/"
              },
              {
                "@type": "Person",
                "name": "Prince Mallik",
                "jobTitle": "Co-Founder & COO",
                "telephone": "+91-76848-43985",
                "sameAs": "https://www.linkedin.com/in/prince-mallik-177a472a0/"
              }
            ],
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "First Floor, FTBI, T1-109, National Institute of Technology, Sector 1",
              "addressLocality": "Rourkela",
              "postalCode": "769008",
              "addressRegion": "Odisha",
              "addressCountry": "IN"
            }
          }
        }}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[500px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.15]"
            style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.15]"
            style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 w-fit mb-6">
              <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
                Our Story
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Building the <span className="text-gradient-orange-blue">operating system</span> for Indian freight.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              LoadSaathi was born from a simple observation: India doesn&apos;t have a truck shortage. India has a utilization problem. We&apos;re here to fix it.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-10 rounded-xl border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-orange-600/10 dark:bg-orange-500/10 flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To eliminate empty kilometers from Indian logistics by building an AI-powered network that connects every load to its perfect truck — instantly, transparently, and efficiently.
              </p>
            </div>
            <div className="glass-card p-10 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-blue-600/10 dark:bg-blue-500/10 flex items-center justify-center mb-6">
                <Eye className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                A future where no truck runs empty, every shipment finds its match in seconds, and India&apos;s logistics industry operates at peak efficiency — powered by intelligence, not guesswork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM & SOLUTION */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-red-500 mb-4 block">The Problem</span>
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-6">A Broken System</h2>
              <ul className="space-y-4">
                {[
                  "40% of truck kilometers in India are run empty — that's millions of tons of CO₂ and billions in wasted fuel",
                  "Fragmented broker networks with opaque pricing erode margins for both shippers and truckers",
                  "No standardized credit or trust system forces cash-only transactions and limits access to reliable partners",
                  "Manual coordination via phone calls and WhatsApp groups creates inefficiency at every step",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-green-500 mb-4 block">Our Solution</span>
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-6">Intelligence, Not Intermediaries</h2>
              <ul className="space-y-4">
                {[
                  "AI-powered matching that connects shipments to trucks in real-time, eliminating empty return trips",
                  "Transparent, market-reflective pricing powered by our prediction engine — no more guesswork",
                  "Digital Freight Credit Score (300-900) creates trust and enables secure, cashless transactions",
                  "End-to-end digitization from posting to payment with real-time tracking and automated workflows",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
              <div className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">{stat.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">What We Stand For</h2>
            <p className="text-lg text-muted-foreground">Our values shape every product decision we make and every partnership we build.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-orange-500/30 transition-all duration-300 group border-border dark:border-white/[0.08]">
                <value.icon className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-5 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-bold text-foreground mb-3">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 relative z-10 text-center">
          <Globe className="h-12 w-12 text-orange-500 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black mb-6 text-foreground dark:text-white">The LoadSaathi Story</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4 text-left max-w-3xl mx-auto">
            <p>
              LoadSaathi started with a simple question: why do 40% of India&apos;s trucks run empty? After months of talking to shippers, truckers, and fleet owners across the country, the answer became clear — not a lack of demand, but a lack of visibility and trust.
            </p>
            <p>
              Shippers couldn&apos;t find reliable transporters for their routes. Truckers couldn&apos;t find return loads after delivering. Brokers controlled information and took a cut from both sides. The entire system ran on phone calls, gut feel, and cash.
            </p>
            <p>
              We built LoadSaathi to change that. Our AI-powered platform brings transparency, efficiency, and trust to Indian freight. We&apos;re not just digitizing existing processes — we&apos;re reimagining how logistics works in a connected India.
            </p>
          </div>
        </div>
      </section>

      {/* LEADERSHIP TEAM */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">The Team Behind LoadSaathi</h2>
            <p className="text-lg text-muted-foreground">Meet the people building India&apos;s smart freight network.</p>
          </div>
          <TeamShowcase />
        </div>
      </section>

      {/* CORRIDORS WE SERVE */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Corridors We Serve</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Starting with East India&apos;s most vital freight corridors, connecting industrial hubs across three states.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { from: "Rourkela", to: "Ranchi", distance: "210 km", time: "5 hrs" },
              { from: "Ranchi", to: "Kolkata", distance: "350 km", time: "8 hrs" },
              { from: "Rourkela", to: "Kolkata", distance: "480 km", time: "11 hrs" },
              { from: "Bhubaneswar", to: "Kolkata", distance: "460 km", time: "10 hrs" },
              { from: "Rourkela", to: "Bhubaneswar", distance: "330 km", time: "7 hrs" },
              { from: "Ranchi", to: "Bhubaneswar", distance: "380 km", time: "9 hrs" },
            ].map((route, i) => (
              <Link key={i} to={`/routes/${route.from.toLowerCase()}-to-${route.to.toLowerCase()}`} className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all duration-300 group flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{route.from} → {route.to}</span>
                    <div className="text-xs text-muted-foreground">{route.distance} · {route.time}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/routes">
              <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-6 py-3 h-auto rounded-lg border-border hover:border-orange-400 text-foreground">
                View All Routes <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* GUIDES */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Learn About Freight</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Expert guides to help shippers and truckers make smarter logistics decisions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "PTL vs FTL: Which is Right for You?", slug: "ptl-vs-ftl", desc: "Understand the difference between Partial Truckload and Full Truckload shipping, and when to use each." },
              { title: "Freight Rates in East India 2026", slug: "freight-rates-east-india", desc: "Comprehensive guide to current freight rates across major East India corridors — Rourkela, Ranchi, Kolkata, and more." },
              { title: "How to Ship Steel Safely", slug: "shipping-steel", desc: "Complete guide to transporting steel coils, plates, and finished steel products across Indian highways." },
            ].map((guide, i) => (
              <Link key={i} to={`/guide/${guide.slug}`} className="glass-card p-6 rounded-xl border border-border hover:border-orange-500/30 transition-all duration-300 group">
                <Truck className="h-6 w-6 text-orange-500 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{guide.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{guide.desc}</p>
                <span className="text-xs font-semibold text-orange-500">Read Guide →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)] text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Join the Movement</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">Be part of India&apos;s freight transformation. Sign up today.</p>
            <Link to="/register">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default About;
