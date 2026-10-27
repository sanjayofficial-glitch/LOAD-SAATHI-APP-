
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Brain, Route, BarChart3, Shield, Clock, MapPin } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";

const aiFeatures = [
  { icon: Brain, title: "AI Match Score", desc: "Every shipper-trucker pair gets a 0–100% match score based on route, capacity, price, timing, and past performance." },
  { icon: BarChart3, title: "Price Prediction", desc: "AI analyses historical freight data, seasonal trends, and route demand to suggest fair market rates." },
  { icon: Route, title: "Smart Routing", desc: "AI recommends the fastest and most cost-effective route based on road conditions, tolls, and traffic." },
  { icon: Shield, title: "Trust Scoring", desc: "Credit score algorithm evaluates completion rate, on-time delivery, reviews, and communication quality." },
  { icon: Clock, title: "Real-Time Matching", desc: "When a trucker posts an empty return trip, AI instantly matches with nearby shipper requests." },
  { icon: MapPin, title: "Geofence Alerts", desc: "AI triggers notifications when a shipment is within 50 km of its destination." },
];

export default function AiLogistics() {
  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>AI in Truck Transportation — LoadSaathi</h2>
          <p>LoadSaathi uses artificial intelligence for freight matching, price prediction, smart routing, and credit scoring — reducing empty trucks, fair pricing, and faster delivery across India.</p>
        </div>
      </noscript>
      <SeoMeta
        title="AI Load Matching India – Smarter Than Load Board Apps"
        description="LoadSaathi's AI matches your truck to the right load automatically — no scrolling endless listings like other apps. See how AI freight matching works."
        keywords="AI logistics India, AI truck matching, AI freight matching, AI route optimization, AI freight pricing, logistics automation India, AI-powered freight marketplace"
        canonical="/ai-logistics"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "AI Logistics", url: "/ai-logistics" },
        ]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "AI in Truck Transportation — LoadSaathi",
            "description": "How LoadSaathi uses artificial intelligence for freight matching, price prediction, and smart routing to reduce empty trucks in India.",
            "url": "https://loadsaathi.in/ai-logistics",
          },
          {
            "@context": "https://schema.org",
            "@type": "QAPage",
            "mainEntity": {
              "@type": "Question",
              "name": "How is AI used in truck transportation in India?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "AI is used in Indian truck transportation for freight matching (pairing shippers with the best-fit truckers), price prediction (estimating fair market rates using historical data), smart routing (optimising delivery paths for cost and time), and credit scoring (evaluating trucker reliability). LoadSaathi applies all four AI capabilities to reduce empty miles, ensure fair pricing, and improve delivery reliability.",
              },
            },
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Logistics</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4">
              AI in Truck Transportation
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-[700px] mb-8">
              LoadSaathi uses artificial intelligence to match shippers with the best truckers, predict fair prices, and reduce India's empty-mile problem. Here's how AI is changing freight logistics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/screens/matching" className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors">
                See AI Matching in Action <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/blog/ai-freight-matching" className="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors">
                Read Full Article
              </Link>
            </div>
          </div>
        </section>

        {/* The problem */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">The Empty-Mile Problem</h2>
            <p className="text-muted-foreground max-w-[800px] mb-8">
              India's trucking industry loses an estimated ₹50,000 crore annually to empty return trips. After delivering cargo, 30–40% of trucks drive back empty — burning fuel, adding congestion, and earning nothing. AI solves this by predicting which trucks have capacity on which routes and matching them instantly with nearby shipper demand.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { stat: "30–40%", label: "of Indian trucks return empty after delivery" },
                { stat: "₹50,000 Cr", label: "estimated annual loss from empty miles" },
                { stat: "4–6 hrs", label: "average daily idle time per truck" },
              ].map((s, i) => (
                <div key={i} className="text-center p-6 rounded-xl glass-card border border-border">
                  <p className="text-3xl font-black text-orange-400 mb-2">{s.stat}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI features */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2">How LoadSaathi Uses AI</h2>
            <p className="text-muted-foreground mb-8">Six AI capabilities powering smarter freight logistics across India.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiFeatures.map((f) => (
                <div key={f.title} className="glass-card p-6 rounded-xl border border-border space-y-3">
                  <f.icon className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How matching works */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-8">How AI Matching Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Trucker Posts Trip", desc: "Origin, destination, capacity, departure date" },
                { step: "2", title: "Shipper Posts Cargo", desc: "Route, weight, budget, goods type" },
                { step: "3", title: "AI Scores Each Pair", desc: "Route match, proximity, price, timing, rating" },
                { step: "4", title: "Best Matches Shown", desc: "Top matches sorted by score — request & chat" },
              ].map((s) => (
                <div key={s.step} className="text-center space-y-3 p-4 rounded-xl glass-card border border-border">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center mx-auto">{s.step}</div>
                  <h3 className="text-sm font-bold text-foreground">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[800px] mx-auto text-center space-y-6">
            <h2 className="text-3xl font-black text-foreground">Try AI-Powered Freight Matching</h2>
            <p className="text-muted-foreground">Post a shipment or trip and see how LoadSaathi's AI finds the best matches for you.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register?role=shipper" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                Ship Cargo
              </Link>
              <Link to="/register?role=trucker" className="border border-border hover:border-orange-500/30 text-foreground px-8 py-3 rounded-lg font-semibold transition-colors">
                Find Return Loads
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
