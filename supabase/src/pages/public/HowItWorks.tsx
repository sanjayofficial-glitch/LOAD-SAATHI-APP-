
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, ClipboardList, Route, MapPin, CheckCircle, Truck, DollarSign, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";

const shipperSteps = [
  { icon: UserPlus, step: "01", title: "Register Your Account", desc: "Create your shipper profile in minutes. Add your business details, verify your identity, and get onboarded to the LoadSaathi network." },
  { icon: ClipboardList, step: "02", title: "Post Your Shipment", desc: "Enter shipment details — origin, destination, cargo type, weight, preferred pickup time. Our intelligent form auto-suggests optimal parameters." },
  { icon: Search, step: "03", title: "Get AI Matched", desc: "Our matching engine scans thousands of active trucks and ranks the best matches by route compatibility, pricing, and reliability score — all in seconds." },
  { icon: MapPin, step: "04", title: "Track in Real Time", desc: "Follow your shipment live on the map with accurate ETAs. Get notified at every milestone — pickup, transit, and delivery confirmation." },
  { icon: CheckCircle, step: "05", title: "Complete & Review", desc: "Confirm delivery, release payment securely through our escrow system, and rate the transporter. Build your network of trusted carriers." },
];

const truckerSteps = [
  { icon: UserPlus, step: "01", title: "Register Your Fleet", desc: "Create your trucker profile with vehicle details, permits, and route preferences. Complete verification to unlock high-value shipments." },
  { icon: ClipboardList, step: "02", title: "Post Your Trip", desc: "Declare your upcoming trips — starting point, destination, available capacity, and preferred load type. Let the AI find matching shipments." },
  { icon: Search, step: "03", title: "Find Profitable Loads", desc: "Browse AI-matched shipments that align with your route and capacity. View fair market prices, distance, and shipper ratings at a glance." },
  { icon: Route, step: "04", title: "Haul & Track", desc: "Navigate optimized routes with live GPS tracking. Update shipment status at each milestone to keep shippers informed and build your reliability score." },
  { icon: DollarSign, step: "05", title: "Get Paid Securely", desc: "Receive payments promptly after successful delivery. Our escrow system protects both parties. Build your credit score with every completed trip." },
];

const HowItWorks = () => {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Ship Freight on LoadSaathi",
    "description": "A step-by-step guide to posting and shipping freight on LoadSaathi's AI-powered marketplace.",
    "step": shipperSteps.map((step) => ({
      "@type": "HowToStep",
      position: parseInt(step.step),
      name: step.title,
      text: step.desc,
    })),
  };

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
          <h1>How LoadSaathi Works — Complete Logistics Platform Guide</h1>
          <p>LoadSaathi uses AI to connect shippers and truckers for seamless freight operations.</p>
          <h2>How LoadSaathi Works for Shippers</h2>
          <h3>Step 1: Create and List Shipments</h3>
          <p>Log in, select Post Shipment, and enter pickup location, destination, cargo type, weight, and preferred pickup/delivery times.</p>
          <h3>Step 2: AI Discovers Perfect Transporters</h3>
          <p>The AI matching engine analyzes route, availability, and historical data to generate a ranked list of transporters with match scores.</p>
          <h3>Step 3: Track and Manage in Real-Time</h3>
          <p>Use the shipper dashboard to view shipments, accept bids, monitor progress with live GPS, and confirm delivery with ePOD.</p>
          <h2>How LoadSaathi Works for Truckers</h2>
          <h3>Step 1: Set Up Profile</h3>
          <p>Sign up, select Trucker, complete KYC verification, and add your truck details and routes.</p>
          <h3>Step 2: Get AI-Matched Loads</h3>
          <p>The AI continuously scans for optimal loads based on truck availability, location, and preferences. Get alerts with match scores.</p>
          <h3>Step 3: Execute and Get Paid</h3>
          <p>Accept loads, use navigation for route optimization, complete deliveries, and receive payment after confirmed delivery.</p>
          <h2>Core Features</h2>
          <ul>
            <li><strong>Smart AI Matching:</strong> 98%+ accuracy considering route, capacity, pricing, and history.</li>
            <li><strong>Real-Time GPS Tracking:</strong> Live location, ETA, and route deviation alerts.</li>
            <li><strong>Freight Credit Score:</strong> 300-900 scoring for trust and eligibility.</li>
            <li><strong>AI Price Predictor:</strong> Fair market pricing with confidence levels.</li>
            <li><strong>Secure Payments:</strong> Milestone-based escrow for safety.</li>
            <li><strong>Verified Network:</strong> KYC-verified transporters only.</li>
          </ul>
          <h2>Frequently Asked Questions</h2>
          <h3>How long does it take to get matched?</h3>
          <p>The AI matching engine runs in real-time. Shippers typically receive transporter bids within minutes.</p>
          <h3>Is the platform safe for new truckers?</h3>
          <p>Yes. Features like KYC verification, freight credit scores, secure payments, and ratings ensure a safe environment.</p>
          <h3>What happens if there is a dispute?</h3>
          <p>LoadSaathi provides a dispute resolution system with support teams and secure payment escrow for fair handling.</p>
        </div>
      </noscript>
      <SeoMeta
        title="How It Works — Ship or Haul Freight"
        description="Learn how LoadSaathi works for shippers and truckers. Post shipments, find loads, get AI-matched, track in real-time, and get paid — all on one platform."
        keywords="how LoadSaathi works, post shipment online, find truck loads India, digital freight platform guide"
        canonical="/how-it-works"
        breadcrumbs={[{ name: "How It Works", url: "/how-it-works" }]}
        jsonLd={[
          howToSchema,
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How long does it take to get matched?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The AI matching engine runs in real-time. Shippers typically receive transporter bids within minutes.",
                },
              },
              {
                "@type": "Question",
                name: "Is the platform safe for new truckers?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Features like KYC verification, freight credit scores, secure payments, and ratings ensure a safe environment.",
                },
              },
              {
                "@type": "Question",
                name: "What happens if there is a dispute?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "LoadSaathi provides a dispute resolution system with support teams and secure payment escrow for fair handling.",
                },
              },
            ],
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[450px] flex items-center overflow-hidden">
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
                Simple Process
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              How <span className="text-gradient-orange-blue">LoadSaathi</span> Works
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Whether you&apos;re shipping goods or hauling loads, the process is designed to be simple, transparent, and powered by AI every step of the way.
            </p>
          </div>
        </div>
      </section>

      {/* SHIPPERS */}
      <section className="fade-section py-24 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-8 w-8 text-orange-500" />
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white">For Shippers</h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">From posting a shipment to delivery confirmation — a seamless journey powered by intelligent matching.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {shipperSteps.map((step, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08] hover:border-orange-500/30 transition-all duration-300 group relative">
                <div className="text-5xl font-black text-orange-600/10 dark:text-orange-500/10 absolute top-3 right-4 select-none">{step.step}</div>
                <div className="w-12 h-12 rounded-full bg-orange-600/10 dark:bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">{step.step}</div>
                <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Average time from posting to match: under 2 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRUCKERS */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="h-8 w-8 text-blue-500" />
              <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white">For Truckers &amp; Fleet Owners</h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">Turn empty kilometers into profit. From declaring availability to getting paid — we handle the logistics so you can focus on the road.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {truckerSteps.map((step, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08] hover:border-blue-500/30 transition-all duration-300 group relative">
                <div className="text-5xl font-black text-blue-600/10 dark:text-blue-500/10 absolute top-3 right-4 select-none">{step.step}</div>
                <div className="w-12 h-12 rounded-full bg-blue-600/10 dark:bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">{step.step}</div>
                <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Truckers earn 25% more on average by filling empty return trips</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)] text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Ready to Get Started?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">Join thousands of businesses and truckers already transforming Indian logistics.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register?type=shipper">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                  <Package className="mr-2 h-5 w-5" /> Sign Up as Shipper
                </Button>
              </Link>
              <Link to="/register?type=trucker">
                <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg border-border text-foreground hover:bg-accent">
                  <Truck className="mr-2 h-5 w-5" /> Sign Up as Trucker
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

export default HowItWorks;
