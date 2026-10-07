/**
 * City landing-page content, keyed by slug. Lives here rather than in
 * LocationPage.tsx so non-page consumers (e.g. the HTML sitemap) can read it
 * without importing a component module.
 */

export const cityData: Record<string, {
  name: string;
  state: string;
  description: string;
  industries: string[];
  heroGradient: string;
  commodities: string[];
  hubDistances: { city: string; km: number }[];
  rateRanges: { type: string; range: string }[];
  localFaq: { q: string; a: string }[];
}> = {
  rourkela: {
    name: "Rourkela",
    state: "Odisha",
    description: "Rourkela is a major industrial hub in western Odisha, anchored by the Rourkela Steel Plant (SAIL). It serves as a key transit point for steel, cement, and forest products moving across East India. The city handles 8–12 million tonnes of freight annually through its industrial corridor.",
    industries: ["Steel & Metals", "Cement", "Forest Products", "Engineering Goods"],
    heroGradient: "from-orange-600 to-red-600",
    commodities: ["Hot-rolled steel coils", "Cement (ultra-tech, Ambuja)", "Plywood & timber", "Heavy engineering parts", "Aluminium ingots"],
    hubDistances: [
      { city: "Bhubaneswar", km: 310 },
      { city: "Kolkata", km: 530 },
      { city: "Jamshedpur", km: 280 },
      { city: "Cuttack", km: 350 },
    ],
    rateRanges: [
      { type: "FTL (Steel)", range: "₹38–55/kg" },
      { type: "PTL", range: "₹6–9/kg" },
      { type: "LTL", range: "₹10–14/kg" },
    ],
    localFaq: [
      { q: "What is the average truck freight rate from Rourkela to Bhubaneswar?", a: "FTL truck rates from Rourkela to Bhubaneswar range from ₹38,000 to ₹55,000 depending on truck type (Open, Container, Trailer) and cargo weight. PTL shipments cost ₹6–9 per kg. Use LoadSaathi's freight rate calculator for a precise quote." },
      { q: "Which industries drive freight demand in Rourkela?", a: "The Rourkela Steel Plant (SAIL) is the single largest freight generator. Cement plants, aluminium smelters, and forest product exporters also contribute significantly to outbound freight. Inbound freight includes FMCG, food grains, and construction materials." },
      { q: "What is the fastest route from Rourkela to Kolkata for trucking?", a: "The fastest trucking route from Rourkela to Kolkata is via NH-49 and NH-16, covering approximately 530 km in 12–14 hours. LoadSaathi's OSRM-based route planner provides real-time distance and transit time calculations." },
    ],
  },
  ranchi: {
    name: "Ranchi",
    state: "Jharkhand",
    description: "Ranchi, the capital of Jharkhand, is a growing logistics hub at the crossroads of multiple state highways. It handles coal, heavy machinery, and consumer goods distribution for the Chota Nagpur Plateau region. The city's freight volume grows 12–15% annually.",
    industries: ["Coal & Mining", "Heavy Machinery", "Consumer Goods", "Agriculture"],
    heroGradient: "from-blue-600 to-indigo-600",
    commodities: ["Coal & lignite", "Heavy mining equipment", "Agricultural produce (rice, wheat)", "Automobile parts", "Cement & building materials"],
    hubDistances: [
      { city: "Kolkata", km: 390 },
      { city: "Jamshedpur", km: 155 },
      { city: "Rourkela", km: 280 },
      { city: "Patna", km: 330 },
    ],
    rateRanges: [
      { type: "FTL (Coal)", range: "₹35–50/kg" },
      { type: "PTL", range: "₹7–10/kg" },
      { type: "LTL", range: "₹11–15/kg" },
    ],
    localFaq: [
      { q: "What freight rates apply for coal transport from Ranchi?", a: "Coal transport from Ranchi to nearby industrial centres ranges from ₹35–50 per kg for FTL loads. The rate varies by distance, truck type, and seasonal demand. LoadSaathi offers real-time price predictions based on your specific route and cargo." },
      { q: "How do I book a truck from Ranchi to Kolkata?", a: "Post your shipment on LoadSaathi with origin Ranchi, destination Kolkata, weight, and goods type. Our AI matching engine connects you with verified truckers heading that route. You can compare rates, check trucker ratings, and book in minutes." },
      { q: "Which truck types are available from Ranchi?", a: "Open trucks (9MT, 16MT), containers (20ft, 32ft), flatbed trailers, and tankers are commonly available from Ranchi. LoadSaathi's fleet covers all major truck types for the Chota Nagpur Plateau region." },
    ],
  },
  kolkata: {
    name: "Kolkata",
    state: "West Bengal",
    description: "Kolkata is the commercial capital of East India and a major port city. It serves as the primary distribution hub for goods moving between East India and the rest of the country. The Kolkata dock handles 70+ million tonnes of cargo annually, making it the anchor of the region's freight network.",
    industries: ["Jute & Textiles", "Steel Trading", "Electronics", "FMCG Distribution"],
    heroGradient: "from-emerald-600 to-teal-600",
    commodities: ["Jute products", "Steel & iron ore", "Leather goods", "Electronics", "Tea & food products"],
    hubDistances: [
      { city: "Rourkela", km: 530 },
      { city: "Ranchi", km: 390 },
      { city: "Jamshedpur", km: 290 },
      { city: "Bhubaneswar", km: 470 },
    ],
    rateRanges: [
      { type: "FTL (General)", range: "₹42–60/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–12/kg" },
    ],
    localFaq: [
      { q: "What are the truck freight rates from Kolkata to Bhubaneswar?", a: "FTL rates from Kolkata to Bhubaneswar range from ₹42,000 to ₹60,000 for a full truck load. PTL shipments cost ₹5–8 per kg. Rates vary by truck type, cargo nature, and pickup location within Kolkata." },
      { q: "How does LoadSaathi handle Kolkata port logistics?", a: "LoadSaathi connects port-bound and port-origin freight with available trucks. If you're moving goods from Kolkata Port (Haldia/DP World) to inland destinations, post your shipment and get matched with truckers who specialise in port pickup and documentation." },
      { q: "What is the best route from Kolkata to Rourkela for heavy cargo?", a: "The recommended route for heavy cargo is Kolkata → Kharagpur → Rourkela via NH-16 and NH-49 (530 km). This route has good road infrastructure and weighbridges. LoadSaathi's route planner confirms current conditions." },
    ],
  },
  bhubaneswar: {
    name: "Bhubaneswar",
    state: "Odisha",
    description: "Bhubaneswar, the capital of Odisha, is a rapidly growing IT and industrial hub. It connects coastal Odisha with inland markets and serves as a gateway to Paradip and Gopalpur ports. The city handles increasing e-commerce and consumer goods freight volumes alongside traditional industrial cargo.",
    industries: ["IT & Technology", "Ports & Logistics", "Food Processing", "Textiles"],
    heroGradient: "from-violet-600 to-purple-600",
    commodities: ["Port cargo (Paradip, Gopalpur)", "IT hardware", "Food grains & pulses", "Textiles & garments", "Pharmaceuticals"],
    hubDistances: [
      { city: "Rourkela", km: 310 },
      { city: "Cuttack", km: 25 },
      { city: "Kolkata", km: 470 },
      { city: "Sambalpur", km: 300 },
    ],
    rateRanges: [
      { type: "FTL (Port)", range: "₹40–58/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–13/kg" },
    ],
    localFaq: [
      { q: "What are the freight rates from Bhubaneswar to Rourkela?", a: "FTL truck rates from Bhubaneswar to Rourkela range from ₹40,000 to ₹58,000. PTL rates are ₹5–8 per kg. LoadSaathi's freight rate calculator provides instant estimates based on your cargo type and weight." },
      { q: "How does LoadSaathi support port logistics from Bhubaneswar?", a: "LoadSaathi connects Paradip Port and Gopalpur Port cargo with available trucks. If you're importing or exporting through these ports, post your container or bulk cargo requirements and get matched with experienced port truckers." },
      { q: "What truck types are suitable for Bhubaneswar to Rourkela?", a: "Container trucks (20ft, 32ft), open trucks (9MT, 16MT), and flatbed trailers are suitable. For steel and heavy cargo, high-bed trailers are recommended. LoadSaathi's matching engine suggests the best truck type for your cargo." },
    ],
  },
  jamshedpur: {
    name: "Jamshedpur",
    state: "Jharkhand",
    description: "Jamshedpur is India's first planned industrial city, home to Tata Steel. It is a critical node in the East India freight network for steel, automotive, and manufactured goods. The city's Tatanagar junction and industrial sidings handle dedicated freight movements for the Tata group.",
    industries: ["Steel Manufacturing", "Automotive Parts", "Heavy Engineering", "Cement"],
    heroGradient: "from-amber-600 to-orange-600",
    commodities: ["Finished steel products", "Automobile components", "Heavy engineering parts", "Clinker & cement", "Wire & cable"],
    hubDistances: [
      { city: "Kolkata", km: 290 },
      { city: "Ranchi", km: 155 },
      { city: "Rourkela", km: 280 },
      { city: "Bhubaneswar", km: 430 },
    ],
    rateRanges: [
      { type: "FTL (Steel)", range: "₹36–52/kg" },
      { type: "PTL", range: "₹6–9/kg" },
      { type: "LTL", range: "₹10–14/kg" },
    ],
    localFaq: [
      { q: "What freight rates apply for steel transport from Jamshedpur?", a: "Steel transport from Jamshedpur ranges from ₹36–52 per kg for FTL loads depending on destination. Kolkata is the cheapest corridor (₹36–42/kg) while Bhubaneswar costs ₹40–52/kg. LoadSaathi provides real-time rates for your specific route." },
      { q: "How do I book a truck for Tata Steel cargo from Jamshedpur?", a: "Post your shipment on LoadSaathi with origin Jamshedpur, destination, weight, and cargo type (steel coils, bars, sheets). Our AI matching connects you with truckers experienced in steel handling. All truckers are verified with insurance and KYC." },
      { q: "What is the fastest route from Jamshedpur to Kolkata for trucking?", a: "The fastest route is via NH-33 and NH-16 (290 km, 6–7 hours). This is one of the busiest freight corridors in East India. LoadSaathi's route planner confirms current road conditions and suggests optimal departure times." },
    ],
  },
  cuttack: {
    name: "Cuttack",
    state: "Odisha",
    description: "Cuttack, the former capital of Odisha, is a major commercial and trading hub. It connects coastal Odisha with inland markets and handles textiles, food grains, and engineering goods. The city's proximity to Paradip Port (100 km) makes it a key logistics node for port-related freight.",
    industries: ["Textiles & Handicrafts", "Food Processing", "Engineering Goods", "Trading"],
    heroGradient: "from-rose-600 to-pink-600",
    commodities: ["Silver filigree & handicrafts", "Rice & food grains", "Textiles & yarn", "Engineering components", "Spices & condiments"],
    hubDistances: [
      { city: "Bhubaneswar", km: 25 },
      { city: "Rourkela", km: 350 },
      { city: "Kolkata", km: 460 },
      { city: "Sambalpur", km: 280 },
    ],
    rateRanges: [
      { type: "FTL (General)", range: "₹32–48/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–12/kg" },
    ],
    localFaq: [
      { q: "What are the freight rates from Cuttack to Rourkela?", a: "FTL rates from Cuttack to Rourkela range from ₹32,000 to ₹48,000 depending on truck type and cargo. PTL shipments cost ₹5–8 per kg. LoadSaathi's freight calculator gives you an instant estimate for this corridor." },
      { q: "How does Cuttack's proximity to Paradip Port affect freight rates?", a: "Cuttack is 100 km from Paradip Port, making it a cost-effective origin for port-bound cargo. Rates from Cuttack to Paradip are ₹8–12 per kg (PTL). LoadSaathi connects Cuttack traders with trucks heading to and from Paradip." },
      { q: "What truck types are available from Cuttack?", a: "Open trucks (9MT, 16MT), containers, flatbed trucks, and mini-trucks (for smaller loads) are available. For textile and handicraft cargo, covered trucks are recommended. LoadSaathi's matching engine suggests the best option for your cargo." },
    ],
  },
  sambalpur: {
    name: "Sambalpur",
    state: "Odisha",
    description: "Sambalpur is a key industrial and agricultural hub in western Odisha. Known for its textile and metal works, it connects the Hirakud Dam region with coastal markets. The city is a major transit point for aluminium, paper, and agricultural produce moving to coastal ports.",
    industries: ["Textiles & Handloom", "Aluminium & Metals", "Agriculture", "Paper & Pulp"],
    heroGradient: "from-teal-600 to-cyan-600",
    commodities: ["Aluminium ingots & rolled products", "Handloom textiles (Sambalpuri sarees)", "Paper & pulp", "Paddy & wheat", "Iron ore"],
    hubDistances: [
      { city: "Bhubaneswar", km: 300 },
      { city: "Rourkela", km: 220 },
      { city: "Cuttack", km: 280 },
      { city: "Jharsuguda", km: 80 },
    ],
    rateRanges: [
      { type: "FTL (Aluminium)", range: "₹34–50/kg" },
      { type: "PTL", range: "₹6–9/kg" },
      { type: "LTL", range: "₹10–13/kg" },
    ],
    localFaq: [
      { q: "What freight rates apply for aluminium transport from Sambalpur?", a: "Aluminium transport from Sambalpur ranges from ₹34–50 per kg for FTL loads. Bhubaneswar corridor costs ₹34–42/kg while Kolkata costs ₹40–50/kg. LoadSaathi's AI pricing considers aluminium's specific handling requirements." },
      { q: "How do I book a truck from Sambalpur to Bhubaneswar?", a: "Post your shipment on LoadSaathi with origin Sambalpur, destination Bhubaneswar, weight, and cargo type. Our AI matches you with verified truckers. Sambalpur to Bhubaneswar is a high-demand corridor with frequent truck availability." },
      { q: "What is the fastest route from Sambalpur to Jharsuguda?", a: "The fastest route from Sambalpur to Jharsuguda is via NH-53 (80 km, 1.5–2 hours). This is a short-haul corridor with high truck frequency. LoadSaathi offers instant booking for this route." },
    ],
  },
  angul: {
    name: "Angul",
    state: "Odisha",
    description: "Angul is an industrial powerhouse in Odisha, home to major power plants and aluminium smelters. It handles heavy industrial cargo including coal, alumina, and power equipment. The Talcher coalfield nearby makes Angul one of the highest-tonnage freight origins in the state.",
    industries: ["Power Generation", "Aluminium Smelting", "Coal Mining", "Heavy Industry"],
    heroGradient: "from-slate-600 to-zinc-600",
    commodities: ["Coal & lignite", "Alumina & aluminium", "Power equipment", "Fertilisers", "Heavy machinery"],
    hubDistances: [
      { city: "Bhubaneswar", km: 170 },
      { city: "Sambalpur", km: 120 },
      { city: "Rourkela", km: 240 },
      { city: "Cuttack", km: 155 },
    ],
    rateRanges: [
      { type: "FTL (Coal)", range: "₹30–45/kg" },
      { type: "PTL", range: "₹6–9/kg" },
      { type: "LTL", range: "₹10–13/kg" },
    ],
    localFaq: [
      { q: "What freight rates apply for coal transport from Angul?", a: "Coal transport from Angul ranges from ₹30–45 per kg for FTL loads. Bhubaneswar corridor costs ₹30–38/kg while Rourkela costs ₹35–45/kg. LoadSaathi's pricing accounts for coal's weight-to-value ratio and seasonal demand spikes." },
      { q: "How does LoadSaathi handle coal and power cargo from Angul?", a: "LoadSaathi connects Angul's power plants and aluminium smelters with specialised coal carriers. We match bulk coal shipments with high-capacity trucks (16MT, 25MT) and ensure drivers have experience with mining area roads." },
      { q: "What truck types are best for Angul's industrial cargo?", a: "High-bed trailers (for heavy machinery), tipper trucks (for coal), container trucks (for alumina), and open trucks (for general cargo) are available. LoadSaathi's matching engine recommends the right truck type based on your cargo specifications." },
    ],
  },
  jharsuguda: {
    name: "Jharsuguda",
    state: "Odisha",
    description: "Jharsuguda is a growing industrial town in western Odisha with aluminium plants, power stations, and a domestic airport. It is a key node on the Rourkela–Sambalpur industrial corridor and handles significant aluminium and power sector freight.",
    industries: ["Aluminium", "Power Plants", "Cement", "Mining Equipment"],
    heroGradient: "from-indigo-600 to-blue-600",
    commodities: ["Aluminium rolled products", "Cement & clinker", "Power plant spares", "Coal", "Transformer oil"],
    hubDistances: [
      { city: "Sambalpur", km: 80 },
      { city: "Rourkela", km: 170 },
      { city: "Bhubaneswar", km: 380 },
      { city: "Cuttack", km: 360 },
    ],
    rateRanges: [
      { type: "FTL (Aluminium)", range: "₹32–48/kg" },
      { type: "PTL", range: "₹6–8/kg" },
      { type: "LTL", range: "₹9–12/kg" },
    ],
    localFaq: [
      { q: "What freight rates apply for aluminium transport from Jharsuguda?", a: "Aluminium transport from Jharsuguda ranges from ₹32–48 per kg for FTL loads. Sambalpur corridor (80 km) is the cheapest at ₹32–36/kg. Bhubaneswar corridor costs ₹38–48/kg. LoadSaathi provides instant quotes for your specific route." },
      { q: "How do I book a truck from Jharsuguda to Sambalpur?", a: "Post your shipment on LoadSaathi with origin Jharsuguda, destination Sambalpur, weight, and cargo type. This 80 km corridor has very high truck frequency with multiple daily departures. LoadSaathi matches you with the best available trucker." },
      { q: "What is the fastest route from Jharsuguda to Bhubaneswar?", a: "The fastest route is via NH-53 and NH-16 (380 km, 8–9 hours). This route passes through Sambalpur and Cuttack. LoadSaathi's route planner provides real-time distance and transit calculations." },
    ],
  },
  burdwan: {
    name: "Burdwan",
    state: "West Bengal",
    description: "Burdwan is an industrial and coal distribution hub in West Bengal, strategically located on the Delhi–Kolkata corridor. It handles significant freight volumes for steel processing, agricultural goods, and engineering components moving between Chota Nagpur and the Gangetic plains. The city's proximity to Raniganj coalfields makes it a key node for coal logistics in eastern India.",
    industries: ["Steel Processing", "Coal Distribution", "Engineering Goods", "Agriculture"],
    heroGradient: "from-yellow-600 to-amber-600",
    commodities: ["Processed steel", "Coal", "Rice & wheat", "Engineering components", "Clay products"],
    hubDistances: [
      { city: "Kolkata", km: 110 },
      { city: "Dhanbad", km: 180 },
      { city: "Ranchi", km: 280 },
      { city: "Rourkela", km: 320 },
    ],
    rateRanges: [
      { type: "FTL (General)", range: "₹32–48/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–12/kg" },
    ],
    localFaq: [
      { q: "What are the freight rates from Burdwan to Kolkata?", a: "FTL truck rates from Burdwan to Kolkata range from ₹32,000 to ₹48,000 depending on truck type and cargo weight. PTL shipments cost ₹5–8 per kg and LTL shipments cost ₹9–12 per kg. This 110 km corridor is one of the busiest in West Bengal. Use LoadSaathi's freight rate calculator for a precise quote based on your cargo type." },
      { q: "Which industries drive freight demand in Burdwan?", a: "Steel processing and coal distribution are the primary freight generators, with the Raniganj coalfield nearby fuelling significant coal movements. Agriculture (rice and wheat) and engineering goods also contribute substantially to both inbound and outbound freight. Burdwan's clay products industry generates consistent LTL demand." },
      { q: "What is the fastest trucking route from Burdwan to Kolkata?", a: "The fastest route from Burdwan to Kolkata is via NH-2 (Grand Trunk Road), covering 110 km in approximately 2.5–3 hours. This is one of India's oldest and most well-maintained highways. LoadSaathi's OSRM-based route planner provides real-time distance and transit time calculations for this corridor." },
    ],
  },
  dhanbad: {
    name: "Dhanbad",
    state: "Jharkhand",
    description: "Dhanbad is India's coal capital, home to the Bharat Coking Coal Limited (BCCL) headquarters and the Jharia coalfield. It is the single largest source of coking coal in the country, generating massive freight volumes for coal, power equipment, and mining machinery. The city handles 50+ million tonnes of coal freight annually through its mining corridors.",
    industries: ["Coal Mining", "Power Generation", "Heavy Industry", "Steel Ancillaries"],
    heroGradient: "from-gray-700 to-zinc-600",
    commodities: ["Coal & lignite", "Power plant equipment", "Mining machinery", "Coke & by-products", "Construction materials"],
    hubDistances: [
      { city: "Ranchi", km: 280 },
      { city: "Jamshedpur", km: 170 },
      { city: "Kolkata", km: 350 },
      { city: "Rourkela", km: 450 },
    ],
    rateRanges: [
      { type: "FTL (Coal)", range: "₹30–45/kg" },
      { type: "PTL", range: "₹6–9/kg" },
      { type: "LTL", range: "₹10–13/kg" },
    ],
    localFaq: [
      { q: "What are the coal freight rates from Dhanbad?", a: "Coal freight rates from Dhanbad range from ₹30–45 per kg for FTL loads depending on destination. Kolkata corridor (350 km) costs ₹35–45/kg while Jamshedpur (170 km) costs ₹30–38/kg. LoadSaathi's AI pricing accounts for coal's weight-to-value ratio, seasonal demand spikes, and tipping charges at loading points." },
      { q: "Which truck types are best suited for coal transport from Dhanbad?", a: "Tipper trucks (16MT, 25MT), open high-bed trailers, and coal-carrier special vehicles are the most commonly used. High-capacity tippers are preferred for loose coal movement from collieries to railway sidings and power plants. LoadSaathi connects you with truckers who have experience navigating Jharia's mining roads and weight restrictions." },
      { q: "What is the fastest route from Dhanbad to Kolkata for coal trucks?", a: "The fastest route from Dhanbad to Kolkata is via NH-2 (Grand Trunk Road) through Asansol and Durgapur, covering 350 km in 8–10 hours. This route has multiple weighbridges and rest stops. LoadSaathi's route planner provides real-time road conditions and suggests optimal departure times to avoid peak traffic at Durgapur." },
    ],
  },
  balasore: {
    name: "Balasore",
    state: "Odisha",
    description: "Balasore is a coastal trading hub on NH-16, strategically positioned between Kolkata and Bhubaneswar. It serves as a key transit point for rice milling, seafood processing, and defence-related freight for the Integrated Test Range (ITR) at Chandipur. The city's NH-16 corridor handles significant volumes of agricultural and processed food cargo.",
    industries: ["Rice Milling", "Seafood Processing", "Textiles", "Defence (HAL/DRDO)"],
    heroGradient: "from-sky-600 to-blue-600",
    commodities: ["Rice & paddy", "Seafood & fish", "Textiles", "Defence equipment", "Palm oil"],
    hubDistances: [
      { city: "Bhubaneswar", km: 210 },
      { city: "Kolkata", km: 300 },
      { city: "Cuttack", km: 170 },
      { city: "Rourkela", km: 420 },
    ],
    rateRanges: [
      { type: "FTL (General)", range: "₹34–48/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–12/kg" },
    ],
    localFaq: [
      { q: "What are the freight rates from Balasore to Bhubaneswar?", a: "FTL truck rates from Balasore to Bhubaneswar range from ₹34,000 to ₹48,000 depending on truck type and cargo. PTL shipments cost ₹5–8 per kg and LTL shipments cost ₹9–12 per kg. This 210 km corridor along NH-16 is well-served with frequent departures. LoadSaathi's freight calculator gives you an instant estimate for this route." },
      { q: "How does LoadSaathi handle seafood transport from Balasore?", a: "LoadSaathi connects Balasore's seafood processors with refrigerated and insulated trucks suitable for perishable cargo. Post your seafood shipment with temperature requirements and we match you with truckers who have experience with cold chain logistics. Timely delivery is critical for perishable goods on this corridor." },
      { q: "What is the NH-16 corridor freight outlook from Balasore?", a: "The NH-16 corridor (Kolkata–Chennai) is one of India's busiest freight highways, and Balasore sits at a strategic midpoint. Rates along this corridor are competitive due to high truck availability. LoadSaathi's real-time pricing reflects current demand along the full NH-16 stretch, helping you plan cost-effective shipments." },
    ],
  },
  berhampur: {
    name: "Berhampur",
    state: "Odisha",
    description: "Berhampur (also called Brahmapur) is the gateway to southern Odisha, known for its silk textiles and rice milling industry. It connects the Ganjam district with coastal and inland markets, handling significant volumes of silk, processed rice, and fish cargo. The city's proximity to the Andhra Pradesh border makes it a key cross-state freight node.",
    industries: ["Textiles & Silk", "Rice Milling", "Fisheries", "Cashew Processing"],
    heroGradient: "from-emerald-700 to-green-600",
    commodities: ["Silk textiles", "Rice", "Fish & prawns", "Cashew", "Jute products"],
    hubDistances: [
      { city: "Bhubaneswar", km: 180 },
      { city: "Vizag", km: 280 },
      { city: "Cuttack", km: 210 },
      { city: "Rourkela", km: 500 },
    ],
    rateRanges: [
      { type: "FTL (General)", range: "₹34–50/kg" },
      { type: "PTL", range: "₹6–9/kg" },
      { type: "LTL", range: "₹10–13/kg" },
    ],
    localFaq: [
      { q: "What are the freight rates from Berhampur to Bhubaneswar?", a: "FTL truck rates from Berhampur to Bhubaneswar range from ₹34,000 to ₹50,000 depending on truck type and cargo. PTL shipments cost ₹6–9 per kg and LTL shipments cost ₹10–13 per kg. This 180 km corridor along NH-16 has frequent truck departures. Use LoadSaathi's freight rate calculator for a precise quote tailored to your cargo." },
      { q: "How does LoadSaathi handle silk and textile transport from Berhampur?", a: "LoadSaathi connects Berhampur's silk weavers and textile traders with covered trucks and container vehicles suitable for high-value fabric cargo. Post your textile shipment with packaging details and we match you with verified truckers experienced in handling delicate goods. Insurance coverage is available for premium textile shipments." },
      { q: "What is the fastest route from Berhampur to Vizag?", a: "The fastest route from Berhampur to Vizag is via NH-16, covering 280 km in 6–7 hours. This coastal highway runs along the Bay of Bengal and offers smooth road conditions for most of the stretch. LoadSaathi's route planner confirms current road conditions and suggests optimal departure times." },
    ],
  },
  vizag: {
    name: "Vizag",
    state: "Andhra Pradesh",
    description: "Vizag (Visakhapatnam) is a major port city on India's eastern seaboard, home to the Vizag Steel Plant (Rashtriya Ispat Nigam Limited) and one of the country's busiest cargo ports. It handles 80+ million tonnes of port cargo annually, making it a critical node for steel, petroleum, and IT hardware freight. The city's industrial corridor extends from the steel plant to the IT SEZs.",
    industries: ["Steel (VSP)", "Ports & Shipping", "IT", "Petroleum Refining"],
    heroGradient: "from-cyan-600 to-teal-600",
    commodities: ["Finished steel", "Crude oil products", "IT hardware", "Seafood exports", "Petroleum coke"],
    hubDistances: [
      { city: "Bhubaneswar", km: 450 },
      { city: "Hyderabad", km: 625 },
      { city: "Vijayawada", km: 350 },
      { city: "Rourkela", km: 700 },
    ],
    rateRanges: [
      { type: "FTL (Steel/Port)", range: "₹40–60/kg" },
      { type: "PTL", range: "₹5–9/kg" },
      { type: "LTL", range: "₹9–14/kg" },
    ],
    localFaq: [
      { q: "What are the port freight rates from Vizag?", a: "Port freight rates from Vizag depend on cargo type and destination. FTL rates for steel and general cargo range from ₹40–60 per kg, while PTL shipments cost ₹5–9 per kg. Container and bulk cargo rates vary based on volume. LoadSaathi's AI pricing reflects real-time port congestion and truck availability at Vizag Port." },
      { q: "How does LoadSaathi support Vizag Steel Plant logistics?", a: "LoadSaathi connects VSP's outbound steel shipments with qualified carriers experienced in handling finished steel products including hot-rolled coils, cold-rolled sheets, and rebars. Post your VSP pickup or delivery requirements and we match you with truckers who have ongoing contracts with the steel plant. All carriers are verified with proper documentation." },
      { q: "What is the coastal freight corridor from Vizag to Bhubaneswar?", a: "The coastal corridor from Vizag to Bhubaneswar runs via NH-16, covering 450 km in 10–12 hours. This is a major freight artery connecting Andhra Pradesh with Odisha. Rates are competitive due to high truck availability on this corridor. LoadSaathi's route planner provides real-time distance, transit time, and current road conditions for this stretch." },
    ],
  },
};
