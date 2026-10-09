/**
 * Freight guide content, keyed by slug. Lives here rather than in
 * GuidePage.tsx so non-page consumers (e.g. the HTML sitemap) can read it
 * without importing a component module.
 */

export const guideData: Record<string, {
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
    title: "PTL vs FTL in Logistics: Full Forms, Differences, and Which to Choose",
    summary: "PTL means Part Truck Load and FTL means Full Truck Load. PTL shares truck space for shipments under 3 tonnes at 30-40% less; FTL gives exclusive vehicle use for loads over 7 tonnes. Differences, costs and how to choose.",
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
      { label: "Cargo Volume Planner", path: "/tools/cargo-volume-planner" },
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
      { label: "Freight Quote Comparison", path: "/tools/freight-quote-comparison" },
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
      { label: "Load-Securing Checklist", path: "/tools/load-securing-checklist" },
    ],
  },
};
