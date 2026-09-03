
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Map, Package, Truck, Route, Shield, TrendingUp, Brain, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";

const shipperFeatures = [
  { icon: Package, title: "Shipment Management", desc: "Post, track, and manage all your shipments from a single dashboard. Real-time updates, document management, and automated workflows streamline your logistics operations." },
  { icon: Search, title: "AI-Powered Transporter Discovery", desc: "Our matching engine analyzes thousands of active trucks to find the perfect carrier for your load — considering route, capacity, pricing, and reliability scores." },
  { icon: Bell, title: "Smart Notifications", desc: "Get instant alerts on bid responses, tracking updates, delivery confirmations, and payment status. Never miss a critical update in your supply chain." },
  { icon: Map, title: "Real-Time Tracking", desc: "Live GPS tracking with ETAs, route visualization, and geofencing. Know exactly where your shipment is at every stage of its journey." },
  { icon: Shield, title: "Verified Transporter Network", desc: "Every transporter on LoadSaathi is verified with documented credentials, credit scores, and past performance reviews. Ship with confidence." },
  { icon: BarChart3, title: "Analytics & Insights", desc: "Comprehensive dashboards with shipment trends, carrier performance metrics, cost analysis, and optimization recommendations powered by AI." },
];

const truckerFeatures = [
  { icon: Truck, title: "Load Discovery", desc: "Browse available shipments matching your truck type, route preference, and schedule. AI prioritizes loads that maximize your earnings per kilometer." },
  { icon: Route, title: "Route Optimization", desc: "Intelligent route planning that considers load pickups, drop-offs, fuel stops, rest periods, and toll costs to maximize your operational efficiency." },
  { icon: Bell, title: "Smart Match Alerts", desc: "Receive real-time notifications when new loads match your truck's capacity, current location, and preferred routes. Never miss a lucrative opportunity." },
  { icon: TrendingUp, title: "Earnings Dashboard", desc: "Track your income, completed trips, kilometers driven, and utilization rates. Get insights on how to optimize your operations for higher profitability." },
  { icon: Shield, title: "Payment Protection", desc: "Secure payment processing with milestone-based releases. Get paid promptly for completed deliveries with our escrow-backed payment system.", comingSoon: true },
  { icon: Clock, title: "Trip History & Reports", desc: "Detailed logs of all completed trips including routes, times, earnings, and customer reviews. Build your reputation with a verified performance history." },
];

const aiFeatures = [
  { icon: Brain, title: "AI Match Scoring", desc: "Our proprietary algorithm evaluates thousands of data points — route compatibility, pricing history, on-time performance, cargo type — to deliver match scores that predict successful partnerships with 98%+ accuracy." },
  { icon: TrendingUp, title: "Price Prediction Engine", desc: "Real-time fair pricing based on current market rates, fuel costs, demand fluctuations, and seasonal trends. Eliminate guesswork and ensure competitive, profitable pricing for every load." },
  { icon: Shield, title: "Digital Freight Credit Scoring", desc: "Comprehensive 300-900 credit score for every participant on the network, factoring in completion rates, on-time performance, customer feedback, and financial reliability." },
];

const Features = () => {
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
          <h1>LoadSaathi Features — AI-Powered Freight Platform</h1>
          <p>LoadSaathi combines AI-powered matching, real-time tracking, predictive pricing, and a trusted network to eliminate empty kilometers and transform logistics profitability.</p>
          <h2>Shipper Operating System</h2>
          <ul>
            <li><strong>Shipment Management:</strong> Post, track, and manage all your shipments from a single dashboard.</li>
            <li><strong>AI-Powered Transporter Discovery:</strong> Matching engine analyzes thousands of active trucks to find the perfect carrier.</li>
            <li><strong>Smart Notifications:</strong> Instant alerts on bid responses, tracking updates, delivery confirmations.</li>
            <li><strong>Real-Time Tracking:</strong> Live GPS tracking with ETAs, route visualization, and geofencing.</li>
            <li><strong>Verified Transporter Network:</strong> Every transporter is verified with credentials, credit scores, and reviews.</li>
            <li><strong>Analytics and Insights:</strong> Comprehensive dashboards with trends, performance metrics, and AI recommendations.</li>
          </ul>
          <h2>Transporter Operating System</h2>
          <ul>
            <li><strong>Load Discovery:</strong> Browse AI-matched shipments matching your truck type, route, and schedule.</li>
            <li><strong>Route Optimization:</strong> Intelligent route planning considering pickups, drop-offs, fuel, and tolls.</li>
            <li><strong>Smart Match Alerts:</strong> Real-time notifications for loads matching your capacity and routes.</li>
            <li><strong>Earnings Dashboard:</strong> Track income, completed trips, kilometers, and utilization rates.</li>
            <li><strong>Payment Protection:</strong> Secure milestone-based payments with escrow backing.</li>
            <li><strong>Trip History:</strong> Detailed logs of all completed trips including routes, times, and reviews.</li>
          </ul>
          <h2>AI Command Center</h2>
          <ul>
            <li><strong>AI Match Scoring:</strong> Proprietary algorithm evaluating route compatibility, pricing, performance with 98%+ accuracy.</li>
            <li><strong>Price Prediction Engine:</strong> Real-time fair pricing based on market rates, fuel costs, and demand.</li>
            <li><strong>Digital Freight Credit Scoring:</strong> 300-900 score for every participant factoring completion, performance, and feedback.</li>
          </ul>
          <h2>Frequently Asked Questions</h2>
          <h3>How does AI matching work on LoadSaathi?</h3>
          <p>Our matching engine analyzes route compatibility, vehicle capacity, pricing history, on-time performance, cargo type, and real-time availability. It ranks the best matches with a compatibility score.</p>
          <h3>What is the Digital Freight Credit Score?</h3>
          <p>Every participant receives a score between 300 and 900 based on completion rates, on-time performance, reviews, communication, and tenure. Higher scores unlock better loads, lower fees, and faster payments.</p>
          <h3>Is real-time GPS tracking included?</h3>
          <p>Yes. Every shipment and trip includes live GPS tracking with ETAs, route visualization, and geofence alerts.</p>
          <h3>How does the AI Price Predictor work?</h3>
          <p>The system uses a multi-provider AI chain to analyze route, weight, vehicle type, and historical data. It recommends a fair market rate with confidence level and trend indicator.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Features — AI-Powered Freight Platform"
        description="Explore LoadSaathi's features: AI-powered matching, real-time GPS tracking, digital credit scores, bidirection reviews, and smart fare calculator for shippers and truckers."
        keywords="freight platform features, AI load matching, GPS tracking India, digital freight credit score, logistics platform India"
        canonical="/features"
        breadcrumbs={[{ name: "Features", url: "/features" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How does AI matching work on LoadSaathi?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Our matching engine analyzes route compatibility, vehicle capacity, pricing history, on-time performance, cargo type, and real-time availability. It ranks the best matches with a compatibility score.",
              },
            },
            {
              "@type": "Question",
              name: "What is the Digital Freight Credit Score?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Every participant receives a score between 300 and 900 based on completion rates, on-time performance, reviews, communication, and tenure. Higher scores unlock better loads, lower fees, and faster payments.",
              },
            },
            {
              "@type": "Question",
              name: "Is real-time GPS tracking included?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Every shipment and trip includes live GPS tracking with ETAs, route visualization, and geofence alerts.",
              },
            },
            {
              "@type": "Question",
              name: "How does the AI Price Predictor work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "The system uses a multi-provider AI chain to analyze route, weight, vehicle type, and historical data. It recommends a fair market rate with confidence level and trend indicator.",
              },
            },
          ],
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
                Platform Capabilities
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Everything you need to<br />
              <span className="text-gradient-orange-blue">move freight smarter.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              LoadSaathi combines AI-powered matching, real-time tracking, predictive pricing, and a trusted network to eliminate empty kilometers and transform logistics profitability.
            </p>
          </div>
        </div>
      </section>

      {/* SHIPPER OS */}
      <section className="fade-section py-24 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white flex items-center gap-3">
              <Package className="text-orange-500 h-8 w-8" />
              Shipper Operating System
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">A powerful control center for shippers to manage, track, and optimize every shipment from posting to delivery.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shipperFeatures.map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-orange-500/30 transition-all duration-300 group border-border dark:border-white/[0.08]">
                <div className="w-12 h-12 rounded-lg bg-orange-600/10 dark:bg-orange-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSPORTER OS */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white flex items-center gap-3">
              <Truck className="text-blue-500 h-8 w-8" />
              Transporter Operating System
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">An intelligent platform for truckers to find profitable loads, optimize routes, and grow their business.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {truckerFeatures.map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-blue-500/30 transition-all duration-300 group border-border dark:border-white/[0.08]">
                <div className="w-12 h-12 rounded-lg bg-blue-600/10 dark:bg-blue-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                  {feature.comingSoon && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI COMMAND CENTER */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Brain className="text-orange-500 h-6 w-6" />
              <span className="text-xs font-bold tracking-widest uppercase text-orange-500">Artificial Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">AI Command Center</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Three proprietary AI engines work together to eliminate inefficiency and maximize value across the network.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aiFeatures.map((feature, i) => (
              <div key={i} className="glass-card p-10 rounded-xl border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.06] pointer-events-none"
                  style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)" }} />
                <feature.icon className="h-10 w-10 text-orange-600 dark:text-orange-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold text-foreground mb-4">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-3xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Features FAQ</h2>
            <p className="text-lg text-muted-foreground">Common questions about LoadSaathi's platform capabilities.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "How does AI matching work on LoadSaathi?", a: "Our matching engine analyzes route compatibility, vehicle capacity, pricing history, on-time performance, cargo type, and real-time availability. It ranks the best matches with a compatibility score so you can choose with confidence." },
              { q: "What is the Digital Freight Credit Score?", a: "Every participant receives a score between 300 and 900 based on completion rates, on-time performance, reviews, communication, and tenure. Higher scores unlock better loads, lower fees, and faster payments." },
              { q: "Is real-time GPS tracking included?", a: "Yes. Every shipment and trip on LoadSaathi includes live GPS tracking with ETAs, route visualization, and geofence alerts. Location data stays within the platform and is never sold to third parties." },
              { q: "How does the AI Price Predictor work?", a: "The system uses a multi-provider AI chain (Gemini, Groq, OpenRouter) to analyze route, weight, vehicle type, and historical data. It recommends a fair market rate with confidence level and trend indicator." },
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
      <section className="fade-section py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)] text-center">
            <div className="bg-orange-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Ready to Transform Your Freight?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">Join India&apos;s intelligent freight network. Sign up as a shipper or trucker and start optimizing today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register?type=shipper">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                  <Package className="mr-2 h-5 w-5" /> I Want to Ship Goods
                </Button>
              </Link>
              <Link to="/register?type=trucker">
                <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg border-border text-foreground hover:bg-accent">
                  <Truck className="mr-2 h-5 w-5" /> I Have Truck Space
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Features;
