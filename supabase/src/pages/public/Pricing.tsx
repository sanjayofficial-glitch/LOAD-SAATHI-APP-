
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, X, HelpCircle, Truck, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";

const plans = [
  {
    id: "shipper",
    title: "For Shippers",
    icon: Package,
    subtitle: "Ship smarter, pay less",
    price: "Free to join",
    description: "Pay only when you ship. Transparent pricing, no hidden fees.",
    features: [
      "Free account registration & profile setup",
      "AI-powered transporter matching",
      "Real-time shipment tracking",
      "Digital documentation & e-way bill integration",
      "Access to verified transporter network",
      "Escrow-backed payment protection",
      "Analytics dashboard & reports",
    ],
    cta: "Start Shipping",
    link: "/register?type=shipper",
  },
  {
    id: "trucker",
    title: "For Truckers & Fleet Owners",
    icon: Truck,
    subtitle: "Fill every kilometer with profit",
    price: "Free to join",
    description: "Zero subscription fees. Keep more of what you earn.",
    popular: true,
    features: [
      "Free account & fleet registration",
      "AI-matched load discovery",
      "Route optimization & planning",
      "Live GPS tracking integration",
      "Milestone-based payment releases",
      "Digital Freight Credit Score building",
      "Earnings dashboard & trip history",
    ],
    cta: "Start Hauling",
    link: "/register?type=trucker",
  },
];

const transactionFee = {
  title: "Transaction Fee",
  desc: "A small service fee is charged on each completed transaction to cover platform operations, payment processing, and AI matching infrastructure.",
  items: [
    { label: "Shippers", value: "3-5% of shipment value", detail: "Varies by shipment size and route complexity" },
    { label: "Truckers", value: "2-4% of trip value", detail: "Reduced rates for repeat performers with high credit scores" },
  ],
};

const faqItems = [
  {
    q: "Is it really free to join?",
    a: "Absolutely. There are no registration fees, subscription charges, or monthly minimums. You only pay when you complete a transaction through the platform.",
  },
  {
    q: "How are transaction fees calculated?",
    a: "Fees are a small percentage of the total shipment value, calculated transparently before you confirm a match. You'll always see the exact fee before committing to a transaction.",
  },
  {
    q: "Are there any hidden charges?",
    a: "None. We believe in radical transparency. Every fee, charge, or deduction is clearly displayed before any transaction is confirmed. What you see is what you pay.",
  },
  {
    q: "Do truckers pay to bid on loads?",
    a: "No. Truckers can browse and bid on available loads for free. Platform fees are only applied when a load is successfully completed and payment is processed.",
  },
  {
    q: "Is there a volume discount for high-volume shippers?",
    a: "Yes. Enterprise shippers shipping 50+ loads per month qualify for reduced transaction fees. Contact our sales team for custom pricing.",
  },
];

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "LoadSaathi Freight Marketplace",
  "description": "AI-powered shared freight marketplace for PTL/LTL loads across East India. Free to join, pay 2-5% per completed transaction.",
  "url": "https://loadsaathi.in/pricing",
  "brand": {
    "@type": "Organization",
    "name": "LoadSaathi",
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Shipper Plan",
      "price": "0",
      "priceCurrency": "INR",
      "description": "Free to join. 3-5% transaction fee per completed shipment.",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "LoadSaathi" },
    },
    {
      "@type": "Offer",
      "name": "Trucker Plan",
      "price": "0",
      "priceCurrency": "INR",
      "description": "Free to join. 2-4% transaction fee per completed trip. Reduced rates for high credit scores.",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "LoadSaathi" },
    },
    {
      "@type": "Offer",
      "name": "Enterprise Plan",
      "price": "0",
      "priceCurrency": "INR",
      "description": "Custom pricing for 50+ loads per month. Reduced transaction fees, priority support, API access.",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "LoadSaathi" },
    },
  ],
};

const pricingFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

const Pricing = () => {
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
          <h1>LoadSaathi Pricing — Simple, Transparent, No Hidden Fees</h1>
          <p>LoadSaathi offers a free platform for shippers and truckers to connect. No subscription fees, no registration costs, no minimum commitments. You only pay when you complete a transaction through the platform.</p>
          <h2>For Shippers</h2>
          <p>Free to join. Ship smarter, pay less. Includes free account registration and profile setup, AI-powered transporter matching, real-time shipment tracking, digital documentation and e-way bill integration, access to a verified transporter network, escrow-backed payment protection, and an analytics dashboard with reports.</p>
          <h2>For Truckers &amp; Fleet Owners</h2>
          <p>Free to join. Fill every kilometer with profit. Includes free account and fleet registration, AI-matched load discovery, route optimization and planning, live GPS tracking integration, milestone-based payment releases, digital freight credit score building, and an earnings dashboard with trip history.</p>
          <h2>Transaction Fee Breakdown</h2>
          <p>A small service fee is charged on each completed transaction to cover platform operations, payment processing, and AI matching infrastructure.</p>
          <ul>
            <li>Shippers: 3-5% of shipment value, varies by shipment size and route complexity</li>
            <li>Truckers: 2-4% of trip value, reduced for repeat performers with high credit scores</li>
          </ul>
          <h2>LoadSaathi vs Traditional Brokers</h2>
          <p>LoadSaathi charges a 2-5% transaction fee per completed shipment, compared to 10-20% broker margins from traditional intermediaries.</p>
          <h2>Frequently Asked Questions</h2>
          <h3>Is it really free to join?</h3>
          <p>Absolutely. There are no registration fees, subscription charges, or monthly minimums. You only pay when you complete a transaction through the platform.</p>
          <h3>How are transaction fees calculated?</h3>
          <p>Fees are a small percentage of the total shipment value, calculated transparently before you confirm a match. You'll always see the exact fee before committing to a transaction.</p>
          <h3>Are there any hidden charges?</h3>
          <p>None. We believe in radical transparency. Every fee, charge, or deduction is clearly displayed before any transaction is confirmed. What you see is what you pay.</p>
          <h3>Do truckers pay to bid on loads?</h3>
          <p>No. Truckers can browse and bid on available loads for free. Platform fees are only applied when a load is successfully completed and payment is processed.</p>
          <h3>Is there a volume discount for high-volume shippers?</h3>
          <p>Yes. Enterprise shippers shipping 50+ loads per month qualify for reduced transaction fees. Contact our sales team for custom pricing.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Pricing — Transparent Freight Rates"
        description="LoadSaathi's transparent pricing: free registration, pay only 2-5% on completed shipments. No hidden fees, no subscriptions. Compare plans for shippers and truckers."
        keywords="LoadSaathi pricing, freight platform fees, logistics commission rates, trucking platform pricing India"
        canonical="/pricing"
        jsonLd={[pricingSchema, pricingFaqSchema]}
        breadcrumbs={[{ name: "Pricing", url: "/pricing" }]}
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
                Simple Pricing
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Free to join.<br />
              <span className="text-gradient-orange-blue">Pay only when you move.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              No subscriptions. No hidden fees. No minimum commitments. Just transparent, pay-per-transaction pricing that aligns with your success.
            </p>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="fade-section py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`glass-card p-8 sm:p-10 rounded-xl border transition-all duration-300 relative ${
                    plan.popular
                      ? "border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.1)]"
                      : "border-border dark:border-white/[0.08] hover:border-orange-500/30"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-xs font-bold tracking-widest uppercase px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.popular ? "bg-orange-600/20" : "bg-muted"}`}>
                      <Icon className={`h-6 w-6 ${plan.popular ? "text-orange-500" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{plan.title}</h3>
                      <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mb-1">{plan.price}</div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">
                          {feat}
                          {feat === "Escrow-backed payment protection" && (
                            <span className="ml-2 inline-block align-middle text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Coming soon
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.link}>
                    <Button
                      className={`w-full text-sm font-bold tracking-wider uppercase py-4 h-auto rounded-lg ${
                        plan.popular
                          ? "bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                          : "bg-muted hover:bg-accent text-foreground"
                      }`}
                    >
                      {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRANSACTION FEE BREAKDOWN */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Transaction Fee Breakdown</h2>
            <p className="text-lg text-muted-foreground">{transactionFee.desc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {transactionFee.items.map((item, i) => (
              <div key={i} className="glass-card p-8 rounded-xl border-border dark:border-white/[0.08]">
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{item.label}</div>
                <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mb-2">{item.value}</div>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Why a transaction fee?</strong> Unlike traditional brokers who take undisclosed margins, we charge a transparent fee on completed transactions. This aligns our success with yours — we only earn when you successfully move freight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="fade-section py-24 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">LoadSaathi vs Traditional Brokers</h2>
            <p className="text-lg text-muted-foreground">See how we compare to the old way of doing logistics.</p>
          </div>
          <p className="text-sm text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
            LoadSaathi charges a 2-5% transaction fee per completed shipment, compared to 10-20% broker margins from traditional intermediaries. The platform offers AI-powered matching in seconds, escrow-backed payments, live GPS tracking, and a digital credit score system — all features absent from the broker model.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 pr-6 font-bold text-foreground">Feature</th>
                  <th className="text-center py-4 px-6 font-bold text-orange-500">LoadSaathi</th>
                  <th className="text-center py-4 pl-6 font-bold text-muted-foreground">Traditional Broker</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Registration Cost", us: "Free", them: "Often free but hidden fees" },
                  { feature: "Pricing Transparency", us: "AI-powered fair pricing", them: "Opaque, negotiable margins" },
                  { feature: "Matching Speed", us: "AI match in seconds", them: "Hours of phone calls" },
                  { feature: "Payment Protection", us: "Escrow-backed", them: "Cash/credit dependent" },
                  { feature: "Real-Time Tracking", us: "Live GPS tracking", them: "Phone call updates" },
                  { feature: "Credit Scoring", us: "Digital 300-900 score", them: "No standardized system" },
                  { feature: "Reviews & Ratings", us: "Bidirectional reviews", them: "Word of mouth" },
                  { feature: "Platform Fee", us: "2-5% per transaction", them: "10-20% broker margin" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pr-6 text-foreground font-medium">{row.feature}</td>
                    <td className="text-center py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-green-500">
                        <CheckCircle className="h-4 w-4" /> {row.us}
                      </span>
                    </td>
                    <td className="text-center py-4 pl-6">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <X className="h-4 w-4" /> {row.them}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-3xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Pricing FAQ</h2>
            <p className="text-lg text-muted-foreground">Got questions about pricing? We&apos;ve got answers.</p>
          </div>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
                <h3 className="font-bold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground">
              Still have questions? <Link to="/contact" className="text-orange-500 hover:text-orange-400 underline underline-offset-2">Contact our team</Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)] text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Start Free Today</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">No credit card required. No commitment. Just smarter freight.</p>
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

export default Pricing;
