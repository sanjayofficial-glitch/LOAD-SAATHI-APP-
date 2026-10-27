import { Link } from "react-router-dom";
import {
  Truck,
  Wallet,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Star,
  MapPin,
  FileText,
} from "lucide-react";
import SeoMeta from "../../../components/SeoMeta";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://loadsaathi.in/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Compare",
      item: "https://loadsaathi.in/compare",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "LoadSaathi vs BlackBuck",
      item: "https://loadsaathi.in/compare/loadsaathi-vs-blackbuck",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is BlackBuck commission-free like LoadSaathi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. BlackBuck monetises transactions via a commission on freight and financing margins on its truck cards and fuel cards. LoadSaathi charges ₹0 commission on freight — permanently.",
      },
    },
    {
      "@type": "Question",
      name: "Which is better for fleet owners with 10+ trucks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For multi-truck fleet owners who mostly find loads through their own networks and want a free board plus fuel and tyre savings, LoadSaathi is the better fit. BlackBuck suits fleet owners who want managed GPS tracking and prefer app-based truck card payments.",
      },
    },
    {
      "@type": "Question",
      name: "Does BlackBuck offer return loads?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "BlackBuck's core strength is outbound truck discovery and tracking. Return load discovery is limited compared to LoadSaathi, where return-load matching and AI load planning are free core features for every trucker.",
      },
    },
    {
      "@type": "Question",
      name: "How do I try LoadSaathi if I already use BlackBuck?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Download LoadSaathi (Android or web), register with your mobile number, and upload RC and insurance for KYC. It takes about 5 minutes, costs nothing, and you can keep using BlackBuck in parallel.",
      },
    },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "LoadSaathi vs BlackBuck 2026: Broker Margin vs Free Board",
  description:
    "LoadSaathi vs BlackBuck in 2026: commission, load quality, tech, payout speed & coverage compared for Indian fleet owners. See which platform pays better.",
  url: "https://loadsaathi.in/compare/loadsaathi-vs-blackbuck",
  isPartOf: {
    "@type": "WebSite",
    name: "LoadSaathi",
    url: "https://loadsaathi.in/",
  },
};

const modelRows = [
  {
    aspect: "Load cost",
    loadsaathi: { text: "₹0 commission forever", good: true },
    competitor: { text: "Commission on every load booked in app", good: false },
  },
  {
    aspect: "Loads",
    loadsaathi: { text: "Free open load board + posted loads", good: true },
    competitor: { text: "Large app-based shipper and fleet load network", good: null },
  },
  {
    aspect: "Payout cycle",
    loadsaathi: { text: "Same-day settlement option", good: true },
    competitor: { text: "Cycle-based settlement (typically weekly)", good: null },
  },
  {
    aspect: "Broker involvement",
    loadsaathi: { text: "Direct shipper–trucker contact", good: true },
    competitor: { text: "App as intermediary layer", good: null },
  },
  {
    aspect: "Technology",
    loadsaathi: {
      text: "AI route pricing, route planning, return loads",
      good: true,
    },
    competitor: {
      text: "Strong GPS tracking, truck cards, fuel & tyre financing",
      good: null,
    },
  },
  {
    aspect: "Best for",
    loadsaathi: {
      text: "Owner-operators & fleet owners wanting zero commission",
      good: true,
    },
    competitor: { text: "Fleets wanting tracking + fuel card financing", good: null },
  },
];

const CompareBlackBuck = () => {
  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <SeoMeta
        title="LoadSaathi vs BlackBuck 2026: Broker Margin vs Free Board"
        description="LoadSaathi vs BlackBuck comparison: managed freight rates vs zero-commission direct load matching. See which platform is right for your trucking business."
        keywords="loadsaathi vs blackbuck, blackbuck app review, load board comparison india, fleet owner app comparison"
        canonical="/compare/loadsaathi-vs-blackbuck"
        type="article"
        jsonLd={[breadcrumbSchema, faqSchema, webPageSchema]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-12 lg:pt-16 lg:pb-16 bg-[#0B1622] text-white">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #00E5A0 0%, transparent 70%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#00E5A0] mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> All Comparisons
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-1 rounded-md bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] text-[10px] font-bold uppercase tracking-widest">
              Head-to-head
            </span>
            <span className="text-xs text-slate-400">Updated October 2026</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-black mb-4">
            LoadSaathi vs <span className="text-[#00E5A0]">BlackBuck</span>
          </h1>
          <p className="text-slate-300 text-base lg:text-lg max-w-3xl leading-relaxed">
            BlackBuck is a well-funded, well-known fleet-tech platform built around GPS
            tracking and truck cards. LoadSaathi is a free, open load board built around
            one promise: <strong className="text-white">₹0 commission on freight</strong>.
            Here is how the two compare for Indian truck owners in 2026.
          </p>
        </div>
      </section>

      {/* Head-to-head stat strip */}
      <section className="py-6 border-b border-black/10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {[
            { label: "LoadSaathi commission", value: "₹0", sub: "on freight, permanently" },
            { label: "Typical platform margin", value: "4–10%", sub: "reported industry range" },
            { label: "LoadSaathi payout", value: "Same-day", sub: "settlement option" },
            { label: "Registration & KYC", value: "Free", sub: "Android + web" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-xl lg:text-2xl font-black text-[#00B87C]">{stat.value}</div>
              <div className="text-xs font-bold text-[#0F172A]">{stat.label}</div>
              <div className="text-[10px] text-slate-500">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Model breakdown */}
      <section className="py-14 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-black mb-3">Business model breakdown</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            BlackBuck's revenue comes from transactions and financial services. LoadSaathi's
            does not. That single structural difference changes what you keep at the end of
            every trip.
          </p>
          <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-[#F8F7F4]">
                  <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider text-slate-500">
                    Aspect
                  </th>
                  <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider text-[#00B87C]">
                    LoadSaathi
                  </th>
                  <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider text-slate-500">
                    BlackBuck
                  </th>
                </tr>
              </thead>
              <tbody>
                {modelRows.map((row) => (
                  <tr key={row.aspect} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-bold text-[#0F172A]">{row.aspect}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        {row.loadsaathi.good ? (
                          <Check size={14} className="text-[#00B87C] mt-0.5 shrink-0" />
                        ) : (
                          <X size={14} className="text-red-400 mt-0.5 shrink-0" />
                        )}
                        <span className="text-slate-700">{row.loadsaathi.text}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        {row.competitor.good === false ? (
                          <X size={14} className="text-red-400 mt-0.5 shrink-0" />
                        ) : (
                          <Check size={14} className="text-slate-400 mt-0.5 shrink-0" />
                        )}
                        <span className="text-slate-600">{row.competitor.text}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Where BlackBuck excels */}
      <section className="py-14 lg:py-16 bg-white border-y border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-black mb-8">Where BlackBuck excels</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                icon: MapPin,
                title: "GPS tracking ecosystem",
                text: "BlackBuck's hardware-based tracking and fleet dashboard is mature and widely deployed — useful if managing many vehicles remotely is your top priority.",
              },
              {
                icon: Wallet,
                title: "Fuel and tyre financing",
                text: "BlackBuck truck cards and partnerships give fleet owners access to fuel discounts and financing options that a pure load board does not offer.",
              },
              {
                icon: Star,
                title: "Brand recognition with shippers",
                text: "BlackBuck's shipper relationships and market presence give it a wide load base, especially on structured corporate freight lanes.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border border-black/10 bg-[#F8F7F4]"
              >
                <item.icon size={18} className="text-[#0F172A] mb-3" />
                <h3 className="font-bold text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why LoadSaathi */}
      <section className="py-14 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-black mb-8">
            Why fleet owners choose LoadSaathi
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Wallet,
                title: "₹0 commission, forever",
                text: "Managed platforms typically take a cut of every load booked in their app. LoadSaathi never touches your freight money. On ₹80,000/month of bookings, a 5% commission would be ₹48,000 a year you keep instead.",
              },
              {
                icon: Truck,
                title: "Same-day settlement",
                text: "Weekly payout cycles tie up working capital. LoadSaathi offers a same-day settlement option so fuel and driver wages never wait for a payment cycle.",
              },
              {
                icon: FileText,
                title: "AI load planning on top",
                text: "Route planning, return-load matching, freight rate estimation and instant e-way bills come free with your board — features that cost extra or do not exist elsewhere.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl bg-[#0B1622] text-white border border-black/10"
              >
                <item.icon size={20} className="text-[#00E5A0] mb-3" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section className="py-14 lg:py-16 bg-white border-t border-black/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-black mb-4">Verdict</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            BlackBuck is a strong platform for fleet owners who want managed GPS tracking and
            app-based fuel card payments, and who already find most of their loads through
            corporate or broker relationships. If transaction commission is acceptable to you,
            it delivers real value.
          </p>
          <p className="text-slate-700 leading-relaxed mb-6">
            But if you are an owner-operator or fleet owner who finds loads through your own
            network and wants a free board, instant settlement, and AI tools that pay for
            themselves in one trip — LoadSaathi is the clear winner. The commission you do not
            pay compounds with every load you book.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-[#00B87C] text-white font-bold text-sm hover:bg-[#009966] transition-colors"
            >
              Join LoadSaathi Free <ArrowRight size={14} className="inline ml-1" />
            </Link>
            <Link
              to="/compare/loadsaathi-vs-trucksuvidha"
              className="px-6 py-3 rounded-xl border border-black/10 font-bold text-sm hover:border-[#00B87C] hover:text-[#00B87C] transition-colors"
            >
              Compare vs TruckSuvidha
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-black mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqSchema.mainEntity.map((item) => (
              <div key={item.name} className="bg-white rounded-xl border border-black/10 p-5">
                <h3 className="font-bold text-sm mb-2">{item.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.acceptedAnswer.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 lg:py-16 bg-[#0B1622] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-black mb-3">
            Keep 100% of your freight money
          </h2>
          <p className="text-slate-300 mb-6">
            Join thousands of Indian truck owners who load smarter with a ₹0 commission load
            board.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#00E5A0] text-[#0F172A] font-black hover:bg-white transition-colors"
          >
            Download LoadSaathi <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Related */}
      <section className="py-12 border-t border-black/10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-black mb-6">Related guides</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Link
              to="/compare/loadsaathi-vs-trucksuvidha"
              className="p-5 rounded-xl border border-black/10 hover:border-[#00B87C] group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#00B87C] mb-1">Comparison</div>
                  <h3 className="font-bold text-sm">LoadSaathi vs TruckSuvidha 2026</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    The MSME favourite vs the open board
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-400 group-hover:text-[#00B87C] group-hover:translate-x-1 transition-all"
                />
              </div>
            </Link>
            <Link
              to="/blog/best-load-board-apps-india"
              className="p-5 rounded-xl border border-black/10 hover:border-[#00B87C] group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#00B87C] mb-1">Roundup</div>
                  <h3 className="font-bold text-sm">5 Best Load Board Apps in India (2026)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Free and paid platforms ranked
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-400 group-hover:text-[#00B87C] group-hover:translate-x-1 transition-all"
                />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CompareBlackBuck;
