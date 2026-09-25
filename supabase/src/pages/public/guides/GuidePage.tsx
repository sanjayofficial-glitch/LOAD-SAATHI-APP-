import { useParams, Link } from "react-router-dom";
import { BookOpen, ArrowLeft, ArrowRight, Clock, User } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";

const guideData: Record<string, {
  title: string;
  summary: string;
  author: string;
  authorBio: string;
  readTime: string;
  content: string[];
  internalLinks: { label: string; path: string }[];
  steps: { name: string; text: string }[];
  rateTable?: { caption: string; headers: string[]; rows: string[][]; footnote?: string };
}> = {
  "ptl-vs-ftl": {
    title: "PTL vs FTL: Which Freight Option Is Right for Your Business?",
    summary: "PTL (Part Truck Load) is ideal for shipments under 3 tonnes, offering 30-40% savings by sharing truck space. FTL (Full Truck Load) is best for shipments over 7 tonnes needing exclusive vehicle use. LoadSaathi offers both options on all East India corridors.",
    author: "LoadSaathi Team",
    authorBio: "The LoadSaathi engineering and product team builds AI-powered logistics tools for India's freight industry.",
    readTime: "6 min read",
    steps: [
      { name: "Measure your shipment weight and volume", text: "Weigh your goods and measure their dimensions. Shipments under 3 tonnes are typically more cost-effective as PTL, while loads over 7 tonnes generally require FTL." },
      { name: "Set your delivery timeline", text: "If your cargo is urgent or time-sensitive, choose FTL for direct point-to-point delivery. If you have 1-2 extra days of buffer, PTL saves you 30-40%." },
      { name: "Compare costs for your route", text: "Use the LoadSaathi Fare Calculator to compare PTL and FTL pricing on your specific corridor before committing." },
      { name: "Book through LoadSaathi", text: "Post your shipment and the platform's AI automatically recommends the most cost-effective option based on weight, volume, and delivery requirements." },
    ],
    rateTable: {
      caption: "PTL vs FTL at a glance",
      headers: ["Factor", "PTL (Part Truck Load)", "FTL (Full Truck Load)"],
      rows: [
        ["Best for", "Shipments under 3 tonnes", "Shipments over 7 tonnes"],
        ["Cost", "30-40% less than booking a full truck", "Full vehicle rate"],
        ["Transit time", "Slightly longer, multiple pickups and deliveries", "Fastest, direct with no intermediate stops"],
        ["Vehicle use", "Shared truck space", "Exclusive use of the entire vehicle"],
        ["Ideal when", "Regular MSME shipments with flexible timelines", "Urgent or high-value cargo"],
      ],
      footnote: "Indicative guidance for East India corridors. Compare live prices with the LoadSaathi Fare Calculator.",
    },
    content: [
      "One of the most common questions from new shippers is whether to book PTL or FTL for their freight. The answer depends on your shipment size, budget, timeline, and the specific route you're shipping on.",
      "PTL (Part Truck Load) is a shared freight model where your goods share truck space with other shipments heading in the same direction. It's ideal for shipments under 3 tonnes and typically costs 30-40% less than booking an entire truck. The tradeoff is slightly longer transit times due to multiple pickups and deliveries.",
      "FTL (Full Truck Load) gives you exclusive use of an entire vehicle. Your goods go directly from origin to destination without intermediate stops. FTL is best for shipments over 7 tonnes, time-sensitive cargo, high-value goods requiring dedicated security, and when you need the fastest possible transit time.",
      "LoadSaathi offers both PTL and FTL options on all major East India corridors. When you post your shipment, our AI automatically recommends the most cost-effective option based on your weight, volume, and delivery requirements.",
      "Key decision factors: PTL for cost savings and flexibility, FTL for speed and exclusivity. Most MSMEs in East India find PTL to be the optimal choice for regular shipments, while FTL is reserved for urgent or high-value cargo.",
    ],
    internalLinks: [
      { label: "Browse Freight Routes", path: "/routes" },
      { label: "Post a Shipment", path: "/register" },
      { label: "Fare Calculator", path: "/tools/fare-calculator" },
    ],
  },
  "freight-rates-east-india": {
    title: "Freight Rates in East India: Complete Guide 2026",
    summary: "Freight rates across East India corridors vary by distance, cargo type, and vehicle availability. The Rourkela–Ranchi corridor averages ₹1,800-2,500/tonne for PTL, while longer routes like Rourkela–Kolkata range from ₹2,500-3,500/tonne.",
    author: "Amit Verma",
    authorBio: "Amit Verma is a supply chain consultant who helps SMEs in East India digitize their freight operations.",
    readTime: "8 min read",
    steps: [
      { name: "Identify your origin and destination corridors", text: "Rates vary by route. Short corridors like Rourkela–Ranchi (180 km) are cheaper per tonne than long-haul routes like Rourkela–Kolkata (430 km)." },
      { name: "Estimate cargo weight and type", text: "PTL rates are quoted per tonne while FTL rates are per vehicle. Steel and heavy industrial cargo typically command a premium." },
      { name: "Check current market rates", text: "Reference corridor averages such as ₹1,800-2,500/tonne for Rourkela–Ranchi PTL and ₹9,000-12,000 for a 7-ton FTL on the same route." },
      { name: "Use LoadSaathi's AI Price Predictor", text: "Post your shipment and the AI analyzes live market conditions, fuel, and truck availability to recommend fair pricing." },
    ],
    rateTable: {
      caption: "East India corridor freight rate snapshot",
      headers: ["Corridor", "Distance", "PTL rate (per tonne)", "FTL rate (per vehicle)"],
      rows: [
        ["Rourkela–Ranchi", "180 km", "₹1,800–2,500", "₹9,000–12,000 (7-ton) / ₹22,000–28,000 (25-ton)"],
        ["Rourkela–Bhubaneswar", "340 km", "₹2,200–3,000", "—"],
        ["Rourkela–Kolkata", "430 km", "₹2,500–3,500", "—"],
      ],
      footnote: "Indicative 2026 corridor averages from this guide. FTL is quoted per vehicle — check the Fare Calculator for current pricing.",
    },
    content: [
      "Understanding freight rates across East India's industrial corridors is essential for MSMEs looking to optimize their logistics budgets. Rates vary significantly based on distance, cargo type, vehicle availability, and seasonal demand.",
      "The Rourkela–Ranchi corridor (180 km) is one of the busiest, with PTL rates averaging ₹1,800-2,500 per tonne. Full truckload rates range from ₹9,000-12,000 for a 7-ton truck to ₹22,000-28,000 for a 25-ton trailer.",
      "For the Rourkela–Bhubaneswar route (340 km), expect PTL rates of ₹2,200-3,000 per tonne. The Rourkela–Kolkata corridor (430 km) commands ₹2,500-3,500 per tonne for PTL shipments.",
      "Several factors influence pricing: fuel costs, toll charges, seasonal demand during festivals, truck availability in both cities, and the type of cargo being shipped. Steel products from Rourkela's mills often command slightly higher rates.",
      "LoadSaathi's AI Price Predictor analyzes current market conditions, historical data, and available truck capacity to recommend fair pricing for any corridor. Post your shipment and receive competitive bids from verified truckers within minutes.",
    ],
    internalLinks: [
      { label: "Browse All Routes", path: "/routes" },
      { label: "Rourkela Logistics Guide", path: "/blog/rourkela-logistics-guide" },
      { label: "AI Price Predictor", path: "/features" },
    ],
  },
  "shipping-steel": {
    title: "How to Ship Steel in India: A Complete Guide for Manufacturers",
    summary: "Shipping steel requires specialized handling: covered trucks to prevent rust, proper load distribution, and secure tie-downs. Major corridors include Rourkela–Jamshedpur, Jamshedpur–Kolkata, and Bhubaneswar–Vizag.",
    author: "Rajesh Kumar",
    authorBio: "Rajesh Kumar is a logistics operations specialist with 12 years of experience in Indian trucking corridors.",
    readTime: "7 min read",
    steps: [
      { name: "Choose the right truck type", text: "Use covered or waterproofed trucks to prevent rust on TMT bars, HR coils, CR sheets, and structural steel, especially during monsoon months." },
      { name: "Distribute weight evenly", text: "Balance the load across axles to avoid overloading penalties and comply with RTO regulations." },
      { name: "Secure all loads properly", text: "Use steel straps or chains rated for the cargo weight so the load does not shift during transit." },
      { name: "Post exact specs on LoadSaathi", text: "Include the steel grade, dimensions, and weight when posting so the AI matches you with trucks that have the right equipment." },
    ],
    content: [
      "India is the world's second-largest steel producer, and moving steel products from mills to customers is a massive logistical operation. Whether you're shipping TMT bars, HR coils, CR sheets, or structural steel, proper transport practices protect both your cargo and the carriers.",
      "The key steel shipping corridors in East India include Rourkela–Jamshedpur (connecting two of India's largest steel plants), Jamshedpur–Kolkata (steel to port and consumer markets), and Bhubaneswar–Vizag (coastal corridor).",
      "Essential safety practices for steel transport: use covered or waterproofed trucks to prevent rust during monsoon months, distribute weight evenly to avoid axle overloading and comply with RTO regulations, secure all loads with steel straps or chains rated for the cargo weight.",
      "LoadSaathi connects steel manufacturers with experienced truckers who specialize in heavy and oversize cargo. When posting a steel shipment, include the exact grade, dimensions, and weight so our AI matches you with trucks that have the right equipment.",
    ],
    internalLinks: [
      { label: "Rourkela–Jamshedpur Route", path: "/routes/rourkela-to-jamshedpur" },
      { label: "Jamshedpur–Kolkata Route", path: "/routes/jamshedpur-to-kolkata" },
      { label: "Post a Steel Shipment", path: "/register" },
    ],
  },
};

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? guideData[slug.toLowerCase()] : null;

  if (!guide) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#050816] flex items-center justify-center">
        <SeoMeta title="Guide Not Found" description="The guide you are looking for does not exist." robots="noindex, nofollow" />
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-4xl font-black text-foreground mb-4">Guide Not Found</h1>
          <p className="text-muted-foreground mb-8">The guide you're looking for doesn't exist yet.</p>
          <Link to="/blog">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold">
              Browse Blog
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.summary.substring(0, 160),
        datePublished: "2026-06-01",
        dateModified: "2026-08-08",
        image: "https://loadsaathi.in/og-image.png",
        author: {
          "@type": "Person",
          name: guide.author,
          description: guide.authorBio,
        },
        publisher: {
          "@type": "Organization",
          name: "LoadSaathi",
          url: "https://loadsaathi.in",
          logo: { "@type": "ImageObject", url: "https://loadsaathi.in/logo-512.png" },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": `https://loadsaathi.in/guide/${slug}` },
        wordCount: guide.content.join(" ").split(/\s+/).length,
      },
      {
        "@type": "HowTo",
        name: guide.title,
        description: guide.summary.substring(0, 160),
        datePublished: "2026-06-01",
        dateModified: "2026-08-08",
        image: "https://loadsaathi.in/og-image.png",
        author: {
          "@type": "Person",
          name: guide.author,
        },
        publisher: {
          "@type": "Organization",
          name: "LoadSaathi",
          url: "https://loadsaathi.in",
          logo: { "@type": "ImageObject", url: "https://loadsaathi.in/logo-512.png" },
        },
        totalTime: guide.readTime,
        step: guide.steps.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.name,
          text: step.text,
        })),
      },
    ],
  };

  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h1>{guide.title}</h1>
          <p>{guide.summary}</p>
          <p><strong>Author:</strong> {guide.author} | <strong>Read Time:</strong> {guide.readTime}</p>
          <h2>Guide Content</h2>
          {guide.content.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          {guide.rateTable && (
            <table border={1} style={{borderCollapse:'collapse',width:'100%',margin:'16px 0'}}>
              <caption style={{textAlign:'left',fontWeight:700,padding:'8px 0'}}>{guide.rateTable.caption}</caption>
              <thead>
                <tr>
                  {guide.rateTable.headers.map((h, i) => (
                    <th key={i} style={{padding:'6px 8px',textAlign:'left',background:'#f4f4f5'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.rateTable.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{padding:'6px 8px'}}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {guide.rateTable?.footnote && <p style={{fontSize:'12px'}}>{guide.rateTable.footnote}</p>}
        </div>
      </noscript>
      <SeoMeta
        title={guide.title}
        description={guide.summary.substring(0, 160)}
        canonical={`/guide/${slug}`}
        jsonLd={schema}
        breadcrumbs={[
          { name: "Guides", url: "/blog" },
          { name: guide.title, url: `/guide/${slug}` },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-40" />
          <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16 relative z-10">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
            <div className="mb-4">
              <span className="text-xs font-semibold px-2 py-1 rounded-full border bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/30">
                Guide
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6 text-foreground dark:text-white">
              {guide.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
              <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {guide.author}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {guide.readTime}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Guide</span>
            </div>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-6 sm:px-12 pb-24">
          <div className="glass-card p-6 rounded-xl border border-orange-500/20 dark:border-orange-500/10 mb-10">
            <p className="text-sm sm:text-base text-foreground leading-relaxed font-medium">
              {guide.summary}
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            {guide.content.map((paragraph, i) => (
              <p key={i} className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                {paragraph}
              </p>
            ))}
          </div>

          {guide.rateTable && (
            <div className="mt-10 overflow-x-auto">
              <table className="w-full text-left text-sm border border-border rounded-xl overflow-hidden">
                <caption className="text-left font-bold text-foreground mb-3 caption-top">
                  {guide.rateTable.caption}
                </caption>
                <thead>
                  <tr className="bg-orange-100 dark:bg-orange-900/20">
                    {guide.rateTable.headers.map((h) => (
                      <th key={h} className="px-4 py-3 font-bold whitespace-nowrap text-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.rateTable.rows.map((row) => (
                    <tr key={row[0]} className="border-t border-border">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={
                            ci === 0
                              ? "px-4 py-3 font-semibold text-foreground"
                              : "px-4 py-3 text-muted-foreground"
                          }
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {guide.rateTable.footnote && (
                <p className="text-xs text-muted-foreground mt-3">{guide.rateTable.footnote}</p>
              )}
            </div>
          )}

          {/* Internal Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Related Resources</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guide.internalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="glass-card p-3 rounded-xl border border-border hover:border-orange-500/30 transition-all group flex items-center justify-between"
                >
                  <span className="text-sm font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {link.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-orange-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Author Bio */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="glass-card p-6 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">About the Author</p>
                <p className="font-bold text-foreground">{guide.author}</p>
                <p className="text-sm text-muted-foreground mt-1">{guide.authorBio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
