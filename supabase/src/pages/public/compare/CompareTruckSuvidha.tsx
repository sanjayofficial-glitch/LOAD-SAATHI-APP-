
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, ArrowRight, Shield, Truck, IndianRupee, Sparkles } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";

const featureRows: { feature: string; loadsaathi: string; loadsaathiGood: boolean; competitor: string; competitorGood: boolean }[] = [
  { feature: "Subscription Cost", loadsaathi: "₹0 (Free)", loadsaathiGood: true, competitor: "Paid membership tiers (monthly/annual plans)", competitorGood: false },
  { feature: "Commission on Booking", loadsaathi: "0% (direct deal)", loadsaathiGood: true, competitor: "Reported 0% — access is sold via subscriptions", competitorGood: true },
  { feature: "Load Matching", loadsaathi: "Instant AI matching by route & truck", loadsaathiGood: true, competitor: "Directory search / manual contact listings", competitorGood: false },
  { feature: "East India Density", loadsaathi: "Focused: Jharkhand, Odisha, Bengal corridors", loadsaathiGood: true, competitor: "Broad pan-India directory model", competitorGood: true },
  { feature: "Built-in Calculators", loadsaathi: "Fare, return-load and PTL vs FTL calculators", loadsaathiGood: true, competitor: "Basic tools / directory focus", competitorGood: false },
  { feature: "Return Load Tool", loadsaathi: "Dedicated return-trip calculator & matching", loadsaathiGood: true, competitor: "Search filter inside a directory", competitorGood: false },
  { feature: "Registration Barrier", loadsaathi: "Instant mobile access (about 2 minutes)", loadsaathiGood: true, competitor: "Verification & sales-call onboarding", competitorGood: false },
];

const faqItems = [
  {
    question: "Is TruckSuvidha free to use?",
    answer: "TruckSuvidha offers limited basic access, but viewing contact numbers and premium features generally requires paid membership packages.",
  },
  {
    question: "Why is LoadSaathi free?",
    answer: "LoadSaathi connects shippers and truck owners directly with no intermediary margin. Our goal is to reduce empty kilometres through technology, not charge subscription fees for contact information.",
  },
  {
    question: "Which is better for small truck owners?",
    answer: "If you own 1–5 trucks and want instant load leads without paying thousands of rupees in upfront fees, LoadSaathi is built for you.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function CompareTruckSuvidha() {
  return (
    <>
      <SeoMeta
        title="LoadSaathi vs TruckSuvidha 2026: Cost, Loads & Features"
        description="Compare LoadSaathi vs TruckSuvidha: upfront subscription fees vs 100% free load board. See which truck load platform works best for Indian transporters."
        keywords="TruckSuvidha charges, TruckSuvidha alternative, load board India, free load app for truckers"
        canonical="/compare/loadsaathi-vs-trucksuvidha"
        type="article"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Compare", url: "/compare" },
          { name: "LoadSaathi vs TruckSuvidha", url: "/compare/loadsaathi-vs-trucksuvidha" },
        ]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "LoadSaathi vs TruckSuvidha 2026: Cost, Loads & Features",
            description: "Honest feature-by-feature comparison of LoadSaathi and TruckSuvidha for Indian transporters and truckers.",
            url: "https://loadsaathi.in/compare/loadsaathi-vs-trucksuvidha",
          },
          faqSchema,
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        {/* Hero */}
        <section className="bg-gradient-to-br from-orange-600 to-red-700 text-white py-16 px-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Honest Platform Comparison</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
              LoadSaathi vs TruckSuvidha: Honest Comparison for Transporters & Truckers (2026)
            </h1>
            <p className="text-lg text-white/90 max-w-[760px]">
              TruckSuvidha is an established transport directory that requires paid monthly or yearly subscription plans for verified contact leads and full features. LoadSaathi is a modern, 100% free load-matching platform with zero upfront subscriptions, zero commission, and AI matching tailored for East India corridors. Here is an honest feature-by-feature comparison.
            </p>
          </div>
        </section>

        {/* Feature comparison */}
        <section className="py-14 px-6">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black mb-6">Feature Comparison</h2>
            <div className="overflow-x-auto rounded-xl border border-border glass-card">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50 dark:bg-white/[0.03] text-left">
                    <th className="p-4 font-bold">Feature</th>
                    <th className="p-4 font-bold text-orange-600 dark:text-orange-400">LoadSaathi</th>
                    <th className="p-4 font-bold">TruckSuvidha</th>
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map((row) => (
                    <tr key={row.feature} className="border-b border-border last:border-b-0">
                      <td className="p-4 font-semibold">{row.feature}</td>
                      <td className="p-4">
                        <span className="flex items-start gap-2">
                          {row.loadsaathiGood ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          )}
                          <span>{row.loadsaathi}</span>
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <span className="flex items-start gap-2">
                          {row.competitorGood ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          )}
                          <span>{row.competitor}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Where TruckSuvidha is strong */}
        <section className="py-14 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black mb-4">Where TruckSuvidha Is Strong</h2>
            <ul className="space-y-3 text-muted-foreground max-w-[800px]">
              <li className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Established industry presence:</strong> reportedly operating for over a decade with a large database of registered transporters across India.</span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                <span><strong className="text-foreground">Directory search:</strong> useful if you want contact numbers for fleet owners in North and West India.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Why LoadSaathi */}
        <section className="py-14 px-6">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black mb-6">Why Truckers & MSMEs Choose LoadSaathi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: IndianRupee, title: "No Pay-Before-You-Earn", text: "TruckSuvidha often requires paid packages before you can access high-value shipper phone numbers. On LoadSaathi, browsing, posting and connecting are completely free." },
                { icon: Sparkles, title: "AI Load Matching", text: "Instead of scrolling a directory, LoadSaathi's matching engine notifies you when a shipper posts a load that fits your exact truck and destination." },
                { icon: Truck, title: "Optimized for East India", text: "Deepest load liquidity for steel, coal and manufacturing corridors across Ranchi, Jamshedpur, Rourkela, Bhubaneswar and Kolkata." },
                { icon: CheckCircle, title: "Calculators Included", text: "Use the Truck Fare Calculator and the Return Load Calculator without paying for a subscription." },
              ].map((item) => (
                <div key={item.title} className="glass-card border border-border rounded-xl p-6 space-y-3">
                  <item.icon className="h-6 w-6 text-orange-500" />
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                Post a Load Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/tools/fare-calculator" className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-lg font-bold hover:bg-accent transition-colors">
                Try the Fare Calculator
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6 max-w-[800px]">
              {faqItems.map((item) => (
                <div key={item.question} className="glass-card border border-border rounded-xl p-6">
                  <h3 className="font-bold mb-2">{item.question}</h3>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              Also read: <Link to="/compare/loadsaathi-vs-blackbuck" className="text-orange-600 dark:text-orange-400 underline underline-offset-2">LoadSaathi vs BlackBuck</Link> and the <Link to="/blog/best-load-board-apps-india" className="text-orange-600 dark:text-orange-400 underline underline-offset-2">best load board apps in India round-up</Link>.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
