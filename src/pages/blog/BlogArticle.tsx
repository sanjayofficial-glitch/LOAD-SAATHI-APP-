
import { Link, useParams } from "react-router-dom";
import { Calendar, Clock, User, ArrowLeft, ArrowRight, Share2, BookOpen, FileText, Shield, TrendingUp, CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SeoMeta from "@/components/SeoMeta";
import { articles, parseDate } from "@/data/blog";
import { routes } from "@/data/routes";

const headingPrefixes = [
  "What Changed:",
  "Rule 1:",
  "Rule 2:",
  "How the GST Department",
  "Impact on MSMEs:",
  "Macro Trends Reshaping",
  "Action Checklist:",
  "Key Takeaways",
  "Frequently Asked Questions",
  "Problem Statement:",
  "Detailed Breakdown:",
  "Impact on MSME Shared Freight",
  "Step-by-Step Guide:",
  "Indian Case Studies:",
  "Statistical Overview",
  "Conclusion & Call to Action",
  "What Is a Return Load",
  "Top Return Load Corridors",
  "How LoadSaathi Finds Return Loads",
  "5 Ways to Price Return Loads",
  "What Is PTL Transport",
  "2026 PTL Freight Rates",
  "How to Book PTL Transport",
  "Why LoadSaathi Is the Best PTL Platform",
  "Why Steel Transport from Rourkela",
  "Choosing the Right Truck",
  "2026 Steel Freight Rates",
  "Steel Transport Compliance",
  "How LoadSaathi Connects Steel Shippers",
  "What Do Truckers Actually Earn",
  "Detailed Profit-and-Loss",
  "Running Costs Per Kilometre",
  "Why Return Loads Are the Key",
  "New Truck Buyers",
  "Transporter Obligations Under 2026",
  "Step-by-Step Guide for Transporters",
  "Indian Case Study: How One Fleet",
  "Call to Action: Stay Compliant",
  "Why East India freight corridors matter",
  "Important East India freight corridors",
  "What freight moves through these corridors?",
  "How to choose between PTL, LTL, and FTL on an East India route",
  "How return-load planning affects corridor economics",
  "How to request a useful route quote",
  "What should a corridor guide contain?",
  "How are truck transport charges calculated in India?",
  "The main factors behind the rate",
  "What information should you provide for an accurate estimate?",
  "Example calculation",
  "Questions to ask before accepting a freight quote",
  "What is a return load or backhaul?",
  "Why do trucks return empty?",
  "Five practical ways to find return loads",
  "Backhaul KPIs every fleet should track",
  "How to verify a return load before accepting it",
  "A simple return-load decision rule",
  "What is digital freight matching?",
  "Traditional freight matching versus digital matching",
  "How AI-assisted freight matching works",
  "Benefits for shippers",
  "Benefits for truckers and fleet owners",
  "What makes a freight-matching platform trustworthy?",
  "What are PTL freight rates?",
  "How PTL pricing is usually assessed",
  "A simple PTL rate framework",
  "Example: what information changes a PTL quote?",
  "PTL versus FTL: which is more economical?",
  "How shippers can improve PTL pricing",
  "Questions to ask before booking PTL",
];

const sectionImages: Record<number, { icon: React.ReactNode; label: string }> = {
  3: { icon: <FileText className="h-10 w-10 text-orange-500/40" />, label: "e-Way Bill Rule Changes" },
  6: { icon: <Shield className="h-10 w-10 text-blue-500/40" />, label: "Real-Time GST Analytics" },
  7: { icon: <FileText className="h-10 w-10 text-orange-500/40" />, label: "e-Way Bill Rule Status" },
  9: { icon: <TrendingUp className="h-10 w-10 text-green-500/40" />, label: "Industry Trends" },
  14: { icon: <CheckCircle className="h-10 w-10 text-purple-500/40" />, label: "Compliance Checklist" },
  20: { icon: <Shield className="h-10 w-10 text-blue-500/40" />, label: "Real-Time GST Analytics" },
  23: { icon: <TrendingUp className="h-10 w-10 text-green-500/40" />, label: "Sourced Market Statistics" },
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#050816] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-4xl font-black text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or may have been removed.</p>
          <Link to="/blog">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const isoDate = parseDate(article.date);
  const isoLastUpdated = article.lastUpdated ? parseDate(article.lastUpdated) : isoDate;
  const coverImage = article.coverImage
    ? `https://loadsaathi.in${article.coverImage}`
    : "https://loadsaathi.in/logo-512.png";

  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: article.title,
        description: article.summary.substring(0, 160),
        author: {
          "@type": "Person",
          name: article.author,
          description: article.authorBio,
        },
        datePublished: isoDate,
        dateModified: isoLastUpdated,
        publisher: {
          "@type": "Organization",
          name: "LoadSaathi",
          url: "https://loadsaathi.in",
          logo: {
            "@type": "ImageObject",
            url: "https://loadsaathi.in/logo-512.png",
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://loadsaathi.in/blog/${slug}`,
        },
        articleSection: article.category,
        wordCount: article.content.join(" ").split(/\s+/).length,
        image: coverImage,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://loadsaathi.in" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://loadsaathi.in/blog" },
          { "@type": "ListItem", position: 3, name: article.title, item: `https://loadsaathi.in/blog/${slug}` },
        ],
      },
    ],
  };

  const faqSchemas: Record<string, Record<string, unknown>> = {
    "indian-logistics-eway-bill-gst-2026": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the current status of the Ship-To GSTIN requirement in 2026?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The mandatory Ship-To GSTIN rule is on hold under GSTN Advisory 668 (August 5, 2026). No system or process changes are required until GSTN re-notifies it. The Ship-To field remains optional, and the existing single-GSTIN workflow continues to work.",
          },
        },
        {
          "@type": "Question",
          name: "Can I still use a single GSTIN for multi-location shipments?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Because the Ship-To GSTIN requirement is on hold, using a single GSTIN for invoicing remains valid. When the rule is eventually implemented, the actual destination entity's GSTIN (or URP for unregistered recipients) will need to be recorded.",
          },
        },
        {
          "@type": "Question",
          name: "What happens if my e-Way Bill data doesn't match my GSTR-3B filing?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Standard e-Way Bill matching rules continue to apply. Discrepancies between e-Way Bill data and GSTR-3B filings can still trigger scrutiny and, where goods move without a valid e-Way Bill, penalties of up to 200% of the tax amount under existing provisions.",
          },
        },
        {
          "@type": "Question",
          name: "Is voluntary e-Way Bill closure available now?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Voluntary e-Way Bill closure is also on hold under GSTN Advisory 668. e-Way Bills continue to close automatically on expiry as before; no workflow change is required until GSTN re-notifies the feature.",
          },
        },
        {
          "@type": "Question",
          name: "What is the penalty for non-compliance with e-Way Bill rules?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Penalties for moving goods without a valid e-Way Bill or with invoice-to-cargo mismatches can reach up to 200% of the tax amount. Existing rules and penalties are unchanged by Advisory 668.",
          },
        },
      ],
    },
    "gst-advisory-668-eway-bill-ship-to-gstin-hold-msme-logistics-2026": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Does GST Advisory 668 mean e-Way Bills are no longer required for goods transport?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No! E-Way Bills remain strictly mandatory for all movement of goods exceeding ₹50,000 in consignment value. Advisory 668 only puts on hold the new proposed enhancements (mandatory 'Ship-To' GSTIN field and voluntary online closure). Standard e-Way Bill rules continue as before.",
          },
        },
        {
          "@type": "Question",
          name: "Should our business update its ERP software for 'Ship-To' GSTIN fields now?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. GSTN explicitly advises that taxpayers and ERP vendors do not need to make changes to their production environments at this time. All previous advisories regarding mandatory 'Ship-To' fields have been withdrawn.",
          },
        },
        {
          "@type": "Question",
          name: "How does LoadSaathi protect MSMEs from transport compliance penalties?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LoadSaathi works with verified carriers and automatically links your e-Way Bill Part-A with the carrier's valid Transporter ID (TRANS ID) for Part-B compliance. Combined with real-time FASTag tracking, your cargo moves seamlessly without check-post delays.",
          },
        },
        {
          "@type": "Question",
          name: "Can an MSME save money on freight during regulatory changes?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! By booking Part Truckload (PTL) shared freight on LoadSaathi, MSMEs pay only for the exact volume or weight they use. This eliminates the financial waste of booking full truckloads (FTL) for small shipments.",
          },
        },
      ],
    },
    "return-loads-rourkela": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a return load?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A return load is cargo booked for the return leg of a truck trip. Instead of driving back empty after a delivery, the truck carries goods back toward its origin, generating revenue on both legs of the journey.",
          },
        },
        {
          "@type": "Question",
          name: "Which corridors have the best return loads from Rourkela?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The busiest return-load corridors from Rourkela are Rourkela-Kolkata (430 km, ₹28,000-35,000 FTL), Rourkela-Ranchi (180 km, ₹12,000-16,000 FTL), and Rourkela-Bhubaneswar (310 km, ₹20,000-26,000 FTL). Steel, cement, FMCG, and auto parts are the most common return cargo types.",
          },
        },
        {
          "@type": "Question",
          name: "How does LoadSaathi help truckers find return loads?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LoadSaathi's AI matching engine identifies return-load opportunities before the outbound trip concludes, pushing verified offers to truckers as they approach their destination. The platform filters by route, vehicle type, and capacity to ensure every offer is relevant.",
          },
        },
        {
          "@type": "Question",
          name: "How much can truckers save by filling return loads?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Filling return loads can add ₹28,000-35,000 per round trip. Over 8 trips per month, that's ₹2,24,000-2,56,000 in additional revenue. The marginal cost of a loaded return leg is minimal — primarily the additional diesel for the loaded weight (5-10% increase).",
          },
        },
        {
          "@type": "Question",
          name: "How should I price a return load?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Price return loads above your marginal cost (diesel + toll). Anchor your rate to the corridor average — for Rourkela-Kolkata PTL, the 2026 average is ₹1,800-2,500 per tonne. Prioritise verified shippers with high credit scores over the highest rate offered.",
          },
        },
      ],
    },
    "ptl-transport-odisha-jharkhand-2026": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is PTL transport?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PTL (Partial Truckload) is a freight method where shippers pay only for the portion of truck space their cargo occupies. Multiple shippers share a single truck heading the same direction, reducing costs by 30-40% compared to booking a full truck.",
          },
        },
        {
          "@type": "Question",
          name: "How much cheaper is PTL compared to FTL?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PTL rates are typically 30-40% lower than FTL rates. For example, a 2-tonne PTL shipment from Rourkela to Kolkata costs ₹9,000-12,000, while a full 9-tonne FTL booking costs ₹55,000-70,000 — a saving of ₹46,000-58,000.",
          },
        },
        {
          "@type": "Question",
          name: "Which corridors are best for PTL in Odisha and Jharkhand?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The highest-volume PTL corridors are Rourkela-Kolkata (430 km, ₹1,800-2,500/tonne), Rourkela-Ranchi (180 km, ₹800-1,200/tonne), Rourkela-Bhubaneswar (310 km, ₹1,200-1,800/tonne), Bhubaneswar-Kolkata (470 km, ₹1,500-2,200/tonne), and Ranchi-Kolkata (350 km, ₹1,300-1,900/tonne).",
          },
        },
        {
          "@type": "Question",
          name: "How do I book PTL transport online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter your shipment details on LoadSaathi — origin, destination, weight, and departure date. The AI matches you with verified carriers within minutes. Compare offers, book, track via GPS, and pay through escrow. The entire process takes minutes, not hours.",
          },
        },
        {
          "@type": "Question",
          name: "What is the minimum weight for PTL shipping?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most PTL carriers accept shipments from 100 kg upwards. There is no strict minimum, but rates are most competitive for shipments between 500 kg and 5 tonnes.",
          },
        },
      ],
    },
    "steel-transport-rourkela-2026": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What truck type is best for transporting steel?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hot-rolled coils and cold-rolled sheets require open-body trucks with lashing points. TMT bars and structural steel need side-panel trucks with reinforced panels. Pipe and tube products require trailer trucks with extended beds. 9-tonne open-body trucks (10-wheelers) are the standard for most steel products from Rourkela.",
          },
        },
        {
          "@type": "Question",
          name: "What are the 2026 steel freight rates from Rourkela?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Rourkela to Kolkata (430 km): ₹28,000-35,000 FTL, ₹2,000-2,800/tonne PTL. Rourkela to Bhubaneswar (310 km): ₹20,000-26,000 FTL. Rourkela to Ranchi (180 km): ₹12,000-16,000 FTL. Rourkela to Jamshedpur (120 km): ₹8,000-11,000 FTL.",
          },
        },
        {
          "@type": "Question",
          name: "What compliance is required for steel transport?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Steel shipments exceeding ₹50,000 in value require a valid e-Way Bill with Part-B populated before departure. Weight limits are enforced at NHAI weighbridges — overloading attracts ₹200/tonne penalties. Cargo must be properly lashed and secured per Motor Vehicles Act requirements.",
          },
        },
        {
          "@type": "Question",
          name: "How does LoadSaathi help steel shippers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LoadSaathi's AI matching engine connects steel shippers with carriers experienced in heavy and industrial cargo. Every carrier is verified with vehicle documentation, insurance, and safety ratings. Real-time GPS tracking and escrow payments ensure safe, timely delivery.",
          },
        },
      ],
    },
    "trucker-earnings-odisha-2026": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How much do truck drivers earn in Odisha in 2026?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LCV drivers earn ₹12,000-18,000/month, 10-wheeler drivers ₹18,000-25,000, and multi-axle drivers ₹25,000-35,000. Owner-operators can earn ₹35,000-80,000+ per month depending on vehicle class and return-load utilisation.",
          },
        },
        {
          "@type": "Question",
          name: "What is the profit per round trip on Rourkela-Kolkata?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A loaded round trip (Rourkela-Kolkata-Rourkela) generates ₹58,000-67,000 in revenue with ₹22,000-26,000 in total costs, yielding ₹31,650-44,950 net profit per trip. Over 8 trips per month, that's ₹2,53,000-3,59,600 in monthly profit.",
          },
        },
        {
          "@type": "Question",
          name: "How much does it cost to run a truck per kilometre?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "All-in running costs for 10-wheelers are ₹25-35 per km and multi-axle trucks ₹35-50 per km. Diesel accounts for 45-55%, tolls 15-20%, maintenance 12-15%, insurance/permits 8-12%, and EMI 15-20% of total costs.",
          },
        },
        {
          "@type": "Question",
          name: "How do return loads affect trucker earnings?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A loaded return leg adds ₹28,000-35,000 per trip. Over 8 trips per month, consistent return-load booking adds ₹2,24,000-2,56,000 in monthly revenue. Truckers using LoadSaathi report 40-60% reduction in empty kilometres.",
          },
        },
        {
          "@type": "Question",
          name: "What is the payback period for a new truck?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A new 10-wheeler (₹25-35 lakh) has a payback period of 18-24 months at 8 trips/month. Truckers who consistently book return loads achieve payback in 14-18 months, while those running empty returns take 24-30 months.",
          },
        },
      ],
    },
    "truck-transport-charges-per-km-india": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the average truck transport cost per km in India?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "There is no single reliable national average. The cost depends on vehicle class, route, cargo, distance, fuel, tolls, seasonality, loading time, and return-load availability. Use a current route-specific estimate rather than relying on a generic number.",
          },
        },
        {
          "@type": "Question",
          name: "Is PTL priced per kilometre or per kilogram?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PTL may be quoted using a combination of shipment weight, volume, route, used capacity, and service conditions. Some providers communicate a per-kilogram or per-tonne estimate, while others provide a route quote. Ask what is included before comparing providers.",
          },
        },
        {
          "@type": "Question",
          name: "Why can the same truck cost different amounts on two routes?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Route distance, tolls, road conditions, demand, truck availability, cargo requirements, loading time, and the probability of a paid return trip can all differ. The same vehicle does not have the same operating economics on every corridor.",
          },
        },
        {
          "@type": "Question",
          name: "How can a shipper reduce freight cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Provide accurate shipment details, compare PTL with FTL, improve packaging, reduce loading delays, plan flexible pickup windows, consolidate compatible orders, and consider routes where shared or return capacity is available. Do not reduce cost by compromising safe loading or legal payload limits.",
          },
        },
      ],
    },
    "how-to-find-return-loads-india": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Where can truckers find return loads in India?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Truckers can use digital load boards, freight marketplaces, direct shipper relationships, transport associations, local networks, and fleet-management systems. Digital platforms are useful when they provide verified shipment information and route-compatible matching rather than only a large list of unfiltered loads.",
          },
        },
        {
          "@type": "Question",
          name: "Is every backhaul better than returning empty?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. A backhaul can be unprofitable if it requires a long detour, excessive waiting, unsuitable cargo handling, or unreliable payment. Evaluate the complete trip economics before accepting it.",
          },
        },
        {
          "@type": "Question",
          name: "How do return loads reduce truck operating costs?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A paid return leg can spread the cost of the vehicle, driver, fuel, and trip cycle across more revenue-generating kilometres. The actual benefit depends on the load price and additional operating costs.",
          },
        },
        {
          "@type": "Question",
          name: "How can LoadSaathi help truckers find suitable loads?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LoadSaathi connects truckers with shipper freight and uses route, capacity, timing, pricing, and profile information to support matching. Availability depends on the live network and the trucker's vehicle and service area.",
          },
        },
      ],
    },
    "digital-freight-matching-india": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is digital freight matching the same as a load board?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Not always. A basic load board may display available loads and trucks. Digital freight matching can go further by comparing route, timing, capacity, cargo, pricing, and reliability signals to suggest more relevant options.",
          },
        },
        {
          "@type": "Question",
          name: "Can AI eliminate empty truck kilometres completely?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No platform should promise that every empty kilometre will disappear. Demand is often unbalanced between locations, and operational constraints remain. Better matching can improve the probability of finding suitable paid capacity, but the result depends on live demand, route, timing, and truck availability.",
          },
        },
        {
          "@type": "Question",
          name: "Is digital freight matching useful for small shippers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Small shippers may benefit from shared capacity, structured quotes, shipment visibility, and access to a wider network. They should provide accurate shipment details and compare service conditions before booking.",
          },
        },
        {
          "@type": "Question",
          name: "How does LoadSaathi use digital matching?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LoadSaathi connects shippers and truckers for PTL and LTL freight across East India. Its matching approach considers shipment and vehicle details such as route, capacity, timing, price, and reliability. The live result depends on current network availability.",
          },
        },
      ],
    },
    "ptl-freight-rates-india": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Are PTL rates quoted per kg in India?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Some providers may communicate a per-kilogram or per-tonne estimate, but PTL pricing can also depend on volume, used space, route, cargo, handling, and timing. Ask for the complete quote basis.",
          },
        },
        {
          "@type": "Question",
          name: "Is PTL cheaper than booking a full truck?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It can be, when the shipment does not need dedicated capacity and suitable shared capacity is available. The result depends on the route and service conditions.",
          },
        },
        {
          "@type": "Question",
          name: "Is PTL safe for industrial cargo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PTL can be suitable when the vehicle, loading plan, cargo compatibility, securing, packaging, and handling process are appropriate. Heavy or sensitive cargo should be assessed before booking.",
          },
        },
        {
          "@type": "Question",
          name: "Can LoadSaathi provide a fixed PTL rate?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LoadSaathi can provide an indicative estimate based on the shipment and route information available. The final quote depends on live capacity, cargo details, timing, and confirmed service conditions.",
          },
        },
      ],
    },
    "east-india-freight-corridors": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Which are the main freight cities in East India?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "For LoadSaathi's initial network, important locations include Rourkela, Ranchi, Jamshedpur, Bhubaneswar, Kolkata, Burdwan, Dhanbad, Sambalpur, and nearby industrial or commercial centres. Coverage and live truck availability change, so confirm the route before booking.",
          },
        },
        {
          "@type": "Question",
          name: "Is PTL available between Odisha and Jharkhand?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PTL availability depends on live shipper demand, truck capacity, cargo compatibility, pickup timing, and route direction. Submit the shipment details through LoadSaathi to check current options.",
          },
        },
        {
          "@type": "Question",
          name: "How can I reduce freight costs on an East India corridor?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Compare PTL with FTL, provide accurate shipment details, reduce loading delays, plan flexible windows, use suitable packaging, and check whether compatible shared or return capacity is available. Do not compromise safe loading or legal payload limits.",
          },
        },
        {
          "@type": "Question",
          name: "Can truckers find return loads on East India routes?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Return-load availability depends on current demand and the truck's location, vehicle, capacity, and timing. Digital matching can make suitable opportunities easier to discover, but no platform can guarantee a return load on every trip.",
          },
        },
      ],
    },
  };
  const faqSchema = slug ? faqSchemas[slug] ?? null : null;

  const relatedRoutes = article.relatedRoutes
    ? routes.filter((r) => article.relatedRoutes?.includes(r.slug))
    : [];

  const otherArticles = Object.entries(articles)
    .filter(([s]) => s !== slug)
    .slice(0, 3);

  return (
    <>
    <SeoMeta
      title={article.title}
      description={article.summary.substring(0, 160)}
      canonical={`${article.canonicalUrl ?? `/blog/${slug}`}`}
      type="article"
      image={coverImage}
      publishedTime={isoDate}
      author={article.author}
      jsonLd={faqSchema ? [articleSchema, faqSchema] : articleSchema}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: article.title, url: `/blog/${slug}` },
      ]}
    />
    <div className="min-h-screen bg-background dark:bg-[#050816]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16 relative z-10">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <div className="mb-6">
            <span className="text-xs font-semibold px-2 py-1 rounded-full border bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30">
              {article.category}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6 text-foreground dark:text-white">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {article.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {article.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {article.readTime}</span>
            {article.lastUpdated && (
              <span className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400">
                <BookOpen className="h-4 w-4" /> Last updated: {article.lastUpdated}
              </span>
            )}
          </div>
        </div>
      </div>

      {article.coverImage && (
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 -mt-4 mb-8">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-64 sm:h-80 object-cover rounded-xl border border-border"
            loading="eager"
          />
        </div>
      )}

      <div className="max-w-[800px] mx-auto px-6 sm:px-12 pb-24">
        <div className="glass-card p-6 rounded-xl border border-orange-500/20 dark:border-orange-500/10 mb-10">
          <p className="text-sm sm:text-base text-foreground leading-relaxed font-medium">
            {article.summary}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {article.content.map((paragraph, i) => {
            const isHeading = headingPrefixes.some((p) => paragraph.startsWith(p));
            const image = sectionImages[i];

            return (
              <div key={i}>
                {image && (
                  <div className="my-10 rounded-xl bg-gradient-to-br from-orange-500/5 via-blue-500/5 to-transparent dark:from-orange-900/10 dark:via-blue-900/5 border border-orange-500/10 dark:border-orange-500/5 p-8 flex items-center justify-center gap-4">
                    {image.icon}
                    <span className="text-sm font-medium text-muted-foreground">{image.label}</span>
                  </div>
                )}
                {isHeading ? (
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-12 mb-4 leading-tight">
                    {paragraph}
                  </h2>
                ) : (
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                    {paragraph}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Related Routes */}
        {relatedRoutes.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">
              <MapPin className="h-4 w-4 inline mr-1.5 text-orange-400" />
              Freight Routes Mentioned in This Article
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedRoutes.map((r) => (
                <Link
                  key={r.slug}
                  to={`/routes/${r.slug}`}
                  className="glass-card p-3 rounded-xl border border-border hover:border-orange-500/30 transition-all group flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {r.from} → {r.to}
                    </span>
                    <p className="text-xs text-muted-foreground">{r.distanceKm} km · ~{r.transitTime} hrs</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-orange-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="glass-card p-6 rounded-xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">About the Author</p>
              <p className="font-bold text-foreground">{article.author}</p>
              <p className="text-sm text-muted-foreground mt-1">{article.authorBio}</p>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-foreground mb-4">More Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherArticles.map(([s, a]) => (
              <Link key={s} to={`/blog/${s}`} className="glass-card p-4 rounded-xl border border-border hover:border-orange-500/30 transition-all group">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30">{a.category}</span>
                <h4 className="text-sm font-bold text-foreground mt-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">{a.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{a.readTime}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="glass-card p-6 sm:p-8 rounded-xl text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Enjoyed this article?</h3>
            <p className="text-sm text-muted-foreground mb-6">Share it with your network and help spread the word about smarter freight.</p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={handleShare} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Share2 className="mr-2 h-4 w-4" /> Share Article
              </Button>
              <Link to="/blog">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" /> More Articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
