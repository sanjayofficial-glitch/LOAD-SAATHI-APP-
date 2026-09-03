
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Star, CheckCircle, UserCheck, FileText, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";

const colorMap: Record<"orange" | "blue" | "green" | "purple" | "teal" | "red", { border: string; bg: string; icon: string }> = {
  orange: { border: "border-orange-500/20 hover:border-orange-500/40", bg: "bg-orange-600/10 dark:bg-orange-500/10", icon: "text-orange-600 dark:text-orange-400" },
  blue: { border: "border-blue-500/20 hover:border-blue-500/40", bg: "bg-blue-600/10 dark:bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400" },
  green: { border: "border-green-500/20 hover:border-green-500/40", bg: "bg-green-600/10 dark:bg-green-500/10", icon: "text-green-600 dark:text-green-400" },
  purple: { border: "border-purple-500/20 hover:border-purple-500/40", bg: "bg-purple-600/10 dark:bg-purple-500/10", icon: "text-purple-600 dark:text-purple-400" },
  teal: { border: "border-cyan-500/20 hover:border-cyan-500/40", bg: "bg-cyan-600/10 dark:bg-cyan-500/10", icon: "text-cyan-600 dark:text-cyan-400" },
  red: { border: "border-red-500/20 hover:border-red-500/40", bg: "bg-red-600/10 dark:bg-red-500/10", icon: "text-red-600 dark:text-red-400" },
};

type ColorKey = keyof typeof colorMap;

const trustComponents = [
  {
    icon: Award,
    title: "Digital Freight Credit Score",
    subtitle: "300 - 900 Scale",
    color: "orange",
    description: "Every participant on LoadSaathi has a dynamic credit score reflecting their reliability, performance history, and trustworthiness. Higher scores unlock better opportunities and lower fees.",
    items: [
      { label: "300-499: Building", color: "bg-red-500", width: "w-1/4" },
      { label: "500-649: Standard", color: "bg-yellow-500", width: "w-2/4" },
      { label: "650-799: Trusted", color: "bg-green-500", width: "w-3/4" },
      { label: "800-900: Elite", color: "bg-orange-500", width: "w-full" },
    ],
  },
  {
    icon: Star,
    title: "Bidirectional Reviews",
    subtitle: "1 - 5 Star Rating",
    color: "blue",
    description: "After every completed transaction, both shippers and truckers rate each other. This two-way accountability system ensures fair treatment and helps the community make informed decisions.",
    features: [
      "Both parties rate after each transaction",
      "Reviews include detailed written feedback",
      "Historical ratings visible on every profile",
      "Helps build reputation over time",
      "Fraudulent reviews flagged by AI",
    ],
  },
  {
    icon: UserCheck,
    title: "Multi-Level Verification",
    subtitle: "Identity & Credentials",
    color: "green",
    description: "Every user undergoes rigorous verification before they can transact on the platform. Multiple document layers ensure you're dealing with real, accountable businesses.",
    features: [
      "Government ID verification (Aadhaar, PAN, DL)",
      "Business registration & GST validation",
      "Vehicle documentation & permits",
      "Address verification",
      "Periodic reverification",
    ],
  },
  {
    icon: Shield,
    title: "Escrow Payment Protection",
    subtitle: "Secure Transactions",
    color: "purple",
    description: "Funds are held securely in escrow until both parties confirm successful delivery. This eliminates payment risk and ensures fair treatment for shippers and truckers alike.",
    features: [
      "Funds held in secure escrow account",
      "Milestone-based release options",
      "Dispute resolution for both parties",
      "Transparent fee structure",
      "Fast settlement post-delivery",
    ],
  },
  {
    icon: FileText,
    title: "Documented Compliance",
    subtitle: "Paper Trail Digital",
    color: "teal",
    description: "All transactions, communications, and documents are securely stored and accessible. Complete audit trail for every shipment from posting to payment.",
    features: [
      "E-way bill integration",
      "Digital proof of delivery",
      "GPS-tracked trip logs",
      "Communication history preserved",
      "Export-ready reports",
    ],
  },
  {
    icon: CheckCircle,
    title: "AI Fraud Detection",
    subtitle: "24/7 Monitoring",
    color: "red",
    description: "Our AI continuously monitors platform activity for suspicious patterns, identity fraud, and abnormal behavior — keeping the network safe for everyone.",
    features: [
      "Real-time behavioral analysis",
      "Anomaly detection algorithms",
      "Automated flagging & review",
      "Pattern-based risk scoring",
      "Continuous model improvement",
    ],
  },
];

const SafetyTrust = () => {
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
          <h1>Safety &amp; Trust — LoadSaathi Verified Freight Network</h1>
          <p>LoadSaathi ensures safe, verified, and trusted freight operations through KYC verification, freight credit scoring, secure payments, real-time tracking, and AI fraud detection.</p>
          <h2>Multi-Layered Verification System</h2>
          <h3>For Transporters</h3>
          <ul>
            <li><strong>KYC Verification:</strong> Aadhaar and PAN verification with database checks.</li>
            <li><strong>Transport License:</strong> Commercial driving license and permit verification.</li>
            <li><strong>Vehicle Documentation:</strong> RC, insurance, and fitness certificate validation.</li>
            <li><strong>Background Checks:</strong> Criminal records and fraud history screening.</li>
          </ul>
          <h3>For Shippers</h3>
          <ul>
            <li><strong>Business Verification:</strong> GST registration and business PAN validation.</li>
            <li><strong>Company Registration:</strong> ROC and Ministry of Corporate Affairs verification.</li>
            <li><strong>Trade License:</strong> State and local trade license confirmation.</li>
            <li><strong>Payment History:</strong> Credit history and payment reliability assessment.</li>
          </ul>
          <h2>Digital Freight Credit Score</h2>
          <p>A 300-900 score evaluating completion rate (30%), on-time delivery (25%), review ratings (20%), communication quality (15%), and account tenure (10%). Higher scores unlock better loads, lower fees, and priority support.</p>
          <h2>Payment Protection</h2>
          <ul>
            <li>Escrow-backed transactions</li>
            <li>Milestone-based payments</li>
            <li>Instant payment release after delivery confirmation</li>
            <li>UPI, net banking, cards, NEFT, RTGS supported</li>
          </ul>
          <h2>Real-Time Monitoring</h2>
          <ul>
            <li>GPS tracking with geofencing</li>
            <li>Route deviation detection</li>
            <li>Speed monitoring and harsh braking alerts</li>
            <li>Automated delay notifications</li>
          </ul>
          <h2>Dispute Resolution</h2>
          <ul>
            <li>AI-powered anomaly detection</li>
            <li>Evidence submission portal</li>
            <li>24-48 hour resolution</li>
            <li>Mediation by LoadSaathi team</li>
          </ul>
          <h2>Insurance Coverage</h2>
          <ul>
            <li>Goods insurance up to ₹50,00,000</li>
            <li>Vehicle damage coverage</li>
            <li>Third-party liability insurance</li>
          </ul>
          <h2>Trusted by Leading Companies</h2>
          <p>Tata Steel, JSW, Adani Ports, Amazon India, Flipkart, Reliance Retail, ITC, Dabur, HUL, Maruti Suzuki, Mahindra Logistics, Delhivery — among others.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Safety & Trust — Verified Freight Network"
        description="LoadSaathi's multi-layer trust system: ID verification, escrow payments, GPS tracking, bidirectional reviews, and fraud detection. Safe freight for everyone."
        keywords="freight safety India, trucking trust system, verified shippers truckers, secure freight payments"
        canonical="/safety-trust"
        breadcrumbs={[{ name: "Safety & Trust", url: "/safety-trust" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How does LoadSaathi verify transporters?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Every transporter undergoes KYC verification (Aadhaar + PAN), transport license verification, vehicle documentation validation (RC, insurance, fitness certificate), and background checks including criminal records and fraud history screening.",
              },
            },
            {
              "@type": "Question",
              name: "What is the Digital Freight Credit Score?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "A 300-900 score evaluating completion rate (30%), on-time delivery (25%), review ratings (20%), communication quality (15%), and account tenure (10%). Higher scores unlock better loads, lower fees, and priority support.",
              },
            },
            {
              "@type": "Question",
              name: "How are payments protected?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "All transactions are escrow-backed with milestone-based payments. Payment is released instantly after GPS + ePOD delivery confirmation. Supports UPI, net banking, cards, NEFT, and RTGS.",
              },
            },
            {
              "@type": "Question",
              name: "What happens in case of a dispute?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "LoadSaathi provides AI-powered anomaly detection, an evidence submission portal, 24-48 hour resolution, and mediation by the LoadSaathi team. Escrow protection ensures fair handling.",
              },
            },
            {
              "@type": "Question",
              name: "Is cargo insurance available?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. LoadSaathi offers goods insurance up to ₹50,00,000, vehicle damage coverage, and third-party liability insurance for all shipments on the platform.",
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
                Trust & Safety
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Built on <span className="text-gradient-orange-blue">trust</span>,<br />
              secured by intelligence.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              LoadSaathi combines digital credit scoring, bidirectional reviews, multi-level verification, and AI-powered fraud detection to create the most trusted freight network in India.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST COMPONENTS */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trustComponents.map((component, i) => {
              const colors = colorMap[component.color as ColorKey] ?? colorMap.orange;
              const Icon = component.icon;
              return (
                <div key={i} className={`glass-card p-8 sm:p-10 rounded-xl border ${colors.border} transition-all duration-300`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`h-7 w-7 ${colors.icon}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{component.title}</h3>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{component.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{component.description}</p>

                  {/* Progress bars for credit score */}
                  {component.items && (
                    <div className="space-y-3 mb-4">
                      {component.items.map((item, j) => (
                        <div key={j}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted dark:bg-white/5 overflow-hidden">
                            <div className={`h-full rounded-full ${item.color} ${item.width}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Feature list */}
                  {component.features && (
                    <ul className="space-y-2">
                      {component.features.map((feat, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle className={`h-4 w-4 ${colors.icon} mt-0.5 shrink-0`} />
                          <span className="text-muted-foreground">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW SCORING WORKS */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">How Your Credit Score Is Calculated</h2>
            <p className="text-lg text-muted-foreground">Your Digital Freight Credit Score reflects your reliability across five key dimensions.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Trip Completion", pct: "30%", desc: "History of completing accepted loads" },
              { label: "On-Time Performance", pct: "25%", desc: "Pickup & delivery timeliness" },
              { label: "Customer Reviews", pct: "20%", desc: "Average star rating & feedback" },
              { label: "Profile Completeness", pct: "15%", desc: "Verification & documentation" },
              { label: "Payment History", pct: "10%", desc: "Transaction reliability" },
            ].map((item, i) => (
              <div key={i} className="glass-card p-5 rounded-xl border-border dark:border-white/[0.08] text-center">
                <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mb-2">{item.pct}</div>
                <div className="text-sm font-bold text-foreground mb-1">{item.label}</div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
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
            <Shield className="h-12 w-12 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Join a Trusted Network</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">Every member is verified, rated, and accountable. Start building your reputation today.</p>
            <Link to="/register">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default SafetyTrust;