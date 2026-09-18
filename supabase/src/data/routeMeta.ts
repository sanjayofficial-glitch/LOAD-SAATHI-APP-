export interface RouteMeta {
  slug?: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  keywordsHi: string;
  startingPriceINR: number;
  popularGoods: string[];
}

export const routeMeta: Record<string, RouteMeta> = {
  "rourkela-to-ranchi": {
    title: "PTL Freight Rourkela to Ranchi | Book Trucks Online",
    titleHi: "Rourkela se Ranchi Bhejna Hai? PTL Truck Book Karo",
    description:
      "Book PTL/LTL freight from Rourkela to Ranchi. Save up to 40% with LoadSaathi's shared truck network. GPS tracking, AI matching, and transparent pricing on the Rourkela-Ranchi corridor.",
    descriptionHi:
      "Rourkela se Ranchi ke liye sasta truck kaise milega? LoadSaathi par AI se truck match hota hai. GPS tracking aur transparent pricing ke saath. Steel products, cement, FMCG goods — sab bhejo!",
    keywordsHi:
      "rourkela se ranchi truck, rourkela ranchi bhada, odisha jharkhand transport, rourkela ranchi cargo",
    startingPriceINR: 15300,
    popularGoods: ["Steel products", "Industrial machinery", "Cement", "FMCG goods"],
  },
  "ranchi-to-rourkela": {
    title: "PTL Freight Ranchi to Rourkela | Affordable Truck Booking",
    titleHi: "Ranchi se Rourkela Maal Bhejo — LoadSaathi Se Book Karo",
    description:
      "Find affordable PTL/LTL freight from Ranchi to Rourkela. Book trucks on the Ranchi-Rourkela corridor with LoadSaathi's AI matching and live GPS tracking.",
    descriptionHi:
      "Ranchi se Rourkela ke liye sasta freight chahiye? LoadSaathi par returning trucks milte hain. AI matching aur live GPS tracking ke saath. Compare rates aur best price mein book karo!",
    keywordsHi:
      "ranchi se rourkela truck, ranchi rourkela bhada, jharkhand odisha transport, ranchi rourkela cargo",
    startingPriceINR: 15300,
    popularGoods: ["Agricultural products", "Machinery parts", "Packaged food", "Textiles"],
  },
  "rourkela-to-jamshedpur": {
    title: "PTL Freight Rourkela to Jamshedpur | Steel Corridor Shipping",
    titleHi: "Rourkela se Jamshedpur Maal Bhejo — Steel Corridor Ka Best Rate",
    description:
      "Book PTL/LTL freight from Rourkela to Jamshedpur. Save on steel corridor shipping with LoadSaathi — AI matching, GPS tracking, transparent pricing.",
    descriptionHi:
      "Rourkela se Jamshedpur ke liye sasta truck chahiye? Steel corridor ka best rate LoadSaathi par. AI se truck match hota hai, GPS tracking milti hai. Steel products, raw materials sab bhejo!",
    keywordsHi:
      "rourkela se jamshedpur truck, rourkela jamshedpur bhada, steel corridor freight, rourkela jamshedpur cargo",
    startingPriceINR: 18700,
    popularGoods: ["Steel coils", "Iron ore", "Industrial equipment", "Automobile parts"],
  },
  "jamshedpur-to-rourkela": {
    title: "PTL Freight Jamshedpur to Rourkela | Book Trucks Online",
    titleHi: "Jamshedpur se Rourkela Maal Bhejo — LoadSaathi Par Book Karo",
    description:
      "Book cost-effective PTL freight from Jamshedpur to Rourkela. LoadSaathi offers AI-matched trucks, real-time tracking, and fair pricing on the Jamshedpur-Rourkela route.",
    descriptionHi:
      "Jamshedpur se Rourkela ke liye freight chahiye? LoadSaathi par returning trucks milte hain. AI matching aur fair pricing ke sath. Steel products, machinery sab bhejo!",
    keywordsHi:
      "jamshedpur se rourkela truck, jamshedpur rourkela bhada, jharkhand odisha transport",
    startingPriceINR: 18700,
    popularGoods: ["Steel products", "Automobile components", "Machinery", "Chemicals"],
  },
  "rourkela-to-bhubaneswar": {
    title: "PTL Freight Rourkela to Bhubaneswar | Intra-Odisha Shipping",
    titleHi: "Rourkela se Bhubaneswar Truck Book Karo — LoadSaathi Se",
    description:
      "Book PTL/LTL freight from Rourkela to Bhubaneswar. Save up to 40% on shipping within Odisha. AI truck matching, GPS tracking, and digital credit scores on LoadSaathi.",
    descriptionHi:
      "Rourkela se Bhubaneswar ke liye sasta truck kaise milega? LoadSaathi par Odisha ke andar shipping karo. AI matching, GPS tracking aur credit score system. Sabse sasti freight!",
    keywordsHi:
      "rourkela se bhubaneswar truck, rourkela bhubaneswar bhada, odisha freight, intra-odisha shipping",
    startingPriceINR: 28900,
    popularGoods: ["Steel products", "Consumer electronics", "Textiles", "Packaged goods"],
  },
  "rourkela-to-burdwan": {
    title: "PTL Freight Rourkela to Burdwan | Cross-State Shipping",
    titleHi: "Rourkela se Burdwan Maal Bhejo — Odisha se West Bengal",
    description:
      "Book PTL freight from Rourkela to Burdwan. Cross-border trucking made easy with LoadSaathi — AI matching, live GPS tracking, and fair rates on the Odisha-West Bengal route.",
    descriptionHi:
      "Rourkela se Burdwan ke liye truck chahiye? Odisha se West Bengal cross-state shipping karo LoadSaathi par. AI matching aur GPS tracking ke sath. Best rates milega!",
    keywordsHi:
      "rourkela se burdwan truck, odisha west Bengal freight, cross-state PTL shipping",
    startingPriceINR: 27200,
    popularGoods: ["Steel products", "Industrial goods", "Agricultural produce", "Chemicals"],
  },
  "rourkela-to-kolkata": {
    title: "PTL Freight Rourkela to Kolkata | East India's Busiest Corridor",
    titleHi: "Rourkela se Kolkata Truck Book Karo — Best Freight Rates",
    description:
      "Find PTL/LTL freight from Rourkela to Kolkata. Save on East India's busiest freight corridor with LoadSaathi — AI matching, GPS tracking, transparent pricing.",
    descriptionHi:
      "Rourkela se Kolkata ke liye sasta freight chahiye? East India ki sabse busy corridor par LoadSaathi se book karo. AI matching, GPS tracking, transparent pricing. Steel, FMCG sab bhejo!",
    keywordsHi:
      "rourkela se kolkata truck, rourkela kolkata bhada, odisha west Bengal freight corridor",
    startingPriceINR: 36500,
    popularGoods: ["Steel products", "Minerals", "FMCG goods", "Industrial machinery"],
  },
  "ranchi-to-jamshedpur": {
    title: "PTL Freight Ranchi to Jamshedpur | Intra-Jharkhand Shipping",
    titleHi: "Ranchi se Jamshedpur Truck Book Karo — LoadSaathi Se",
    description:
      "Book PTL/LTL freight from Ranchi to Jamshedpur. Intra-Jharkhand shipping made easy with LoadSaathi's AI matching and transparent pricing.",
    descriptionHi:
      "Ranchi se Jamshedpur ke liye sasta truck chahiye? Jharkhand ke andar shipping karo LoadSaathi par. AI matching aur GPS tracking ke sath. Best rates milte hain!",
    keywordsHi:
      "ranchi se jamshedpur truck, ranchi jamshedpur bhada, jharkhand freight, intra-jharkhand transport",
    startingPriceINR: 11050,
    popularGoods: ["Consumer goods", "Automobile parts", "Electronics", "Textiles"],
  },
  "jamshedpur-to-ranchi": {
    title: "PTL Freight Jamshedpur to Ranchi | Affordable Shipping",
    titleHi: "Jamshedpur se Ranchi Maal Bhejo — LoadSaathi Se Sasta",
    description:
      "Book PTL freight from Jamshedpur to Ranchi. Cost-effective intra-Jharkhand shipping with LoadSaathi's AI truck matching and live tracking.",
    descriptionHi:
      "Jamshedpur se Ranchi ke liye freight chahiye? LoadSaathi par saste rates mein book karo. AI matching aur live GPS tracking. Jharkhand ke andar sabse sasta!",
    keywordsHi:
      "jamshedpur se ranchi truck, jamshedpur ranchi bhada, jharkhand freight, intra-jharkhand shipping",
    startingPriceINR: 11050,
    popularGoods: ["Steel products", "Machinery", "Packaged food", "Construction materials"],
  },
  "ranchi-to-bhubaneswar": {
    title: "PTL Freight Ranchi to Bhubaneswar | Cross-State Shipping",
    titleHi: "Ranchi se Bhubaneswar Maal Bhejo — Jharkhand se Odisha",
    description:
      "Book PTL/LTL freight from Ranchi to Bhubaneswar. Cross-state shipping across Jharkhand-Odisha with LoadSaathi — AI matching, GPS tracking, fair pricing.",
    descriptionHi:
      "Ranchi se Bhubaneswar ke liye truck chahiye? Jharkhand se Odisha cross-state shipping karo. LoadSaathi par AI matching aur GPS tracking. Fair pricing ke sath!",
    keywordsHi:
      "ranchi se bhubaneswar truck, ranchi bhubaneswar bhada, jharkhand odisha freight, NH-20 corridor",
    startingPriceINR: 38250,
    popularGoods: ["Industrial goods", "Machinery", "Agricultural produce", "Consumer electronics"],
  },
  "ranchi-to-kolkata": {
    title: "PTL Freight Ranchi to Kolkata | Book Trucks Online",
    titleHi: "Ranchi se Kolkata Truck Book Karo — LoadSaathi Se",
    description:
      "Find PTL/LTL freight from Ranchi to Kolkata. Book trucks on the Ranchi-Kolkata corridor with LoadSaathi — AI matching, live tracking, transparent pricing.",
    descriptionHi:
      "Ranchi se Kolkata ke liye sasta truck chahiye? LoadSaathi par AI se truck match hota hai. GPS tracking aur transparent pricing. Jharkhand se West Bengal ka best rate!",
    keywordsHi:
      "ranchi se kolkata truck, ranchi kolkata bhada, jharkhand west bengal freight",
    startingPriceINR: 35700,
    popularGoods: ["Minerals", "Steel products", "FMCG goods", "Agricultural products"],
  },
  "jamshedpur-to-bhubaneswar": {
    title: "PTL Freight Jamshedpur to Bhubaneswar | 2026 Rates",
    titleHi: "Jamshedpur se Bhubaneswar Truck Book Karo — 2026 Ka Best Rate",
    description:
      "Get live 2026 freight rates for Jamshedpur to Bhubaneswar. Book verified PTL and FTL trucks, track your cargo via GPS, and save up to 30% on shared loads.",
    descriptionHi:
      "Jamshedpur se Bhubaneswar ke liye 2026 ka best freight rate chahiye? LoadSaathi par verified trucks book karo. GPS tracking aur 30% tak bachao shared loads se!",
    keywordsHi:
      "jamshedpur se bhubaneswar truck, jamshedpur bhubaneswar bhada, 2026 freight rates, jharkhand odisha transport",
    startingPriceINR: 28900,
    popularGoods: ["Steel products", "Iron ore", "Machinery", "Chemicals"],
  },
  "jamshedpur-to-burdwan": {
    title: "PTL Freight Jamshedpur to Burdwan | Cross-State Shipping",
    titleHi: "Jamshedpur se Burdwan Maal Bhejo — Jharkhand se Bengal",
    description:
      "Book PTL freight from Jamshedpur to Burdwan. Cross-border Jharkhand-West Bengal shipping with LoadSaathi's AI truck matching and real-time GPS tracking.",
    descriptionHi:
      "Jamshedpur se Burdwan ke liye truck chahiye? Jharkhand se West Bengal cross-border shipping karo. LoadSaathi par AI matching aur GPS tracking. Best rates!",
    keywordsHi:
      "jamshedpur se burdwan truck, jamshedpur burdwan bhada, jharkhand west bengal freight",
    startingPriceINR: 17000,
    popularGoods: ["Steel products", "Agricultural produce", "Machinery", "Consumer goods"],
  },
  "jamshedpur-to-kolkata": {
    title: "PTL Freight Jamshedpur to Kolkata | Industrial Corridor",
    titleHi: "Jamshedpur se Kolkata Maal Bhejo — Industrial Corridor Ka Best Rate",
    description:
      "Find PTL/LTL freight from Jamshedpur to Kolkata. Save on Jamshedpur-Kolkata shipping with LoadSaathi — AI matching, GPS tracking, transparent pricing.",
    descriptionHi:
      "Jamshedpur se Kolkata ke liye sasta freight chahiye? Industrial corridor par LoadSaathi se book karo. AI matching aur GPS tracking ke sath. Steel, FMCG sab bhejo!",
    keywordsHi:
      "jamshedpur se kolkata truck, jamshedpur kolkata bhada, industrial corridor freight",
    startingPriceINR: 23800,
    popularGoods: ["Steel products", "Automobile parts", "FMCG goods", "Industrial machinery"],
  },
  "bhubaneswar-to-kolkata": {
    title: "PTL Freight Bhubaneswar to Kolkata | East India Corridor",
    titleHi: "Bhubaneswar se Kolkata Truck Book Karo — East India Ka Best Rate",
    description:
      "Book PTL/LTL freight from Bhubaneswar to Kolkata. Odisha to West Bengal shipping with LoadSaathi — AI-matched trucks, live GPS tracking, and competitive pricing.",
    descriptionHi:
      "Bhubaneswar se Kolkata ke liye sasta truck chahiye? Odisha se West Bengal shipping karo LoadSaathi par. AI matching aur GPS tracking. Competitive rates!",
    keywordsHi:
      "bhubaneswar se kolkata truck, bhubaneswar kolkata bhada, odisha west bengal freight, east india corridor",
    startingPriceINR: 37400,
    popularGoods: ["Minerals", "Agricultural products", "Consumer electronics", "Textiles"],
  },
  "bhubaneswar-to-burdwan": {
    title: "PTL Freight Bhubaneswar to Burdwan | Cross-State Shipping",
    titleHi: "Bhubaneswar se Burdwan Maal Bhejo — Odisha se Bengal",
    description:
      "Book PTL/LTL freight from Bhubaneswar to Burdwan. Cross-state Odisha-West Bengal shipping with LoadSaathi — AI matching, GPS tracking, fair rates.",
    descriptionHi:
      "Bhubaneswar se Burdwan ke liye truck chahiye? Odisha se West Bengal cross-state shipping karo. LoadSaathi par AI matching aur fair rates ke sath!",
    keywordsHi:
      "bhubaneswar se burdwan truck, bhubaneswar burdwan bhada, odisha west bengal freight",
    startingPriceINR: 35700,
    popularGoods: ["Minerals", "Agricultural produce", "Industrial goods", "Consumer products"],
  },
  "rourkela-to-sambalpur": {
    title: "PTL Freight Rourkela to Sambalpur | Intra-Odisha Shipping",
    titleHi: "Rourkela se Sambalpur Truck Book Karo — Odisha Andar Ka Best Rate",
    description:
      "Book PTL/LTL freight from Rourkela to Sambalpur. Intra-Odisha shipping made simple with LoadSaathi — AI matching, GPS tracking, transparent pricing.",
    descriptionHi:
      "Rourkela se Sambalpur ke liye sasta truck chahiye? Odisha ke andar LoadSaathi se book karo. AI matching aur GPS tracking ke sath. Sabse sasti freight!",
    keywordsHi:
      "rourkela se sambalpur truck, rourkela sambalpur bhada, intra-odisha freight",
    startingPriceINR: 10200,
    popularGoods: ["Steel products", "Cement", "Industrial goods", "FMCG"],
  },
  "ranchi-to-dhanbad": {
    title: "PTL Freight Ranchi to Dhanbad | Coal Corridor Shipping",
    titleHi: "Ranchi se Dhanbad Maal Bhejo — Coal Corridor Ka Best Rate",
    description:
      "Book PTL/LTL freight from Ranchi to Dhanbad. Intra-Jharkhand shipping with LoadSaathi — AI matching, live GPS tracking, competitive rates on the Ranchi-Dhanbad route.",
    descriptionHi:
      "Ranchi se Dhanbad ke liye freight chahiye? Coal corridor par LoadSaathi se book karo. AI matching aur live GPS tracking. Intra-Jharkhand ka best rate!",
    keywordsHi:
      "ranchi se dhanbad truck, ranchi dhanbad bhada, jharkhand freight, coal corridor logistics",
    startingPriceINR: 23800,
    popularGoods: ["Mining equipment", "Industrial machinery", "Consumer goods", "Construction materials"],
  },
  "bhubaneswar-to-vizag": {
    title: "PTL Freight Bhubaneswar to Visakhapatnam | Coastal Corridor",
    titleHi: "Bhubaneswar se Vizag Truck Book Karo — Coastal Corridor Ka Best Rate",
    description:
      "Book PTL/LTL freight from Bhubaneswar to Visakhapatnam. Coastal corridor shipping with LoadSaathi — AI matching, GPS tracking, transparent rates on the Odisha-AP route.",
    descriptionHi:
      "Bhubaneswar se Vizag ke liye truck chahiye? Coastal corridor par LoadSaathi se book karo. Odisha se Andhra Pradesh shipping karo AI matching ke sath!",
    keywordsHi:
      "bhubaneswar se vizag truck, bhubaneswar visakhapatnam bhada, odisha andhra pradesh freight",
    startingPriceINR: 38250,
    popularGoods: ["Minerals", "Steel products", "Agricultural produce", "Consumer goods"],
  },
  "balasore-to-bhubaneswar": {
    title: "PTL Freight Balasore to Bhubaneswar | NH-16 Corridor",
    titleHi: "Balasore se Bhubaneswar Truck Book Karo — NH-16 Par Best Rate",
    description:
      "Book PTL/LTL freight from Balasore to Bhubaneswar. Intra-Odisha shipping with LoadSaathi — AI truck matching, GPS tracking, and competitive pricing.",
    descriptionHi:
      "Balasore se Bhubaneswar ke liye sasta truck chahiye? NH-16 corridor par LoadSaathi se book karo. AI matching aur GPS tracking ke sath. Odisha ke andar best rate!",
    keywordsHi:
      "balasore se bhubaneswar truck, balasore bhubaneswar bhada, odisha freight, NH-16 logistics",
    startingPriceINR: 17850,
    popularGoods: ["Agricultural produce", "Fish products", "Textiles", "Consumer goods"],
  },
  "berhampur-to-bhubaneswar": {
    title: "PTL Freight Berhampur to Bhubaneswar | Southern Odisha",
    titleHi: "Berhampur se Bhubaneswar Truck Book Karo — LoadSaathi Se",
    description:
      "Book PTL/LTL freight from Berhampur to Bhubaneswar. Southern Odisha to capital shipping with LoadSaathi — AI matching, GPS tracking, fair pricing.",
    descriptionHi:
      "Berhampur se Bhubaneswar ke liye truck chahiye? Southern Odisha se capital tak LoadSaathi par book karo. AI matching aur GPS tracking. Fair pricing!",
    keywordsHi:
      "berhampur se bhubaneswar truck, berhampur bhubaneswar bhada, southern odisha freight",
    startingPriceINR: 15300,
    popularGoods: ["Agricultural products", "Fish", "Textiles", "Handicrafts"],
  },
  "dhanbad-to-jamshedpur": {
    title: "PTL Freight Dhanbad to Jamshedpur | Coal-Steel Corridor",
    titleHi: "Dhanbad se Jamshedpur Maal Bhejo — Coal se Steel Tak",
    description:
      "Book PTL/LTL freight from Dhanbad to Jamshedpur. Intra-Jharkhand shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    descriptionHi:
      "Dhanbad se Jamshedpur ke liye freight chahiye? Coal se steel corridor par LoadSaathi se book karo. AI matching aur GPS tracking ke sath!",
    keywordsHi:
      "dhanbad se jamshedpur truck, dhanbad jamshedpur bhada, jharkhand freight, coal steel corridor",
    startingPriceINR: 14450,
    popularGoods: ["Coal", "Mining equipment", "Steel products", "Industrial machinery"],
  },
  "kolkata-to-burdwan": {
    title: "PTL Freight Kolkata to Burdwan | Intra-West Bengal",
    titleHi: "Kolkata se Burdwan Truck Book Karo — West Bengal Andar Ka Best Rate",
    description:
      "Book PTL/LTL freight from Kolkata to Burdwan. Intra-West Bengal shipping with LoadSaathi — AI matching, GPS tracking, best rates on the Kolkata-Burdwan route.",
    descriptionHi:
      "Kolkata se Burdwan ke liye sasta truck chahiye? West Bengal ke andar LoadSaathi par book karo. AI matching aur GPS tracking. Best rates milega!",
    keywordsHi:
      "kolkata se burdwan truck, kolkata burdwan bhada, west bengal freight, intra-west bengal",
    startingPriceINR: 9350,
    popularGoods: ["Consumer goods", "Textiles", "Agricultural produce", "Electronics"],
  },
  "sambalpur-to-jharsuguda": {
    title: "PTL Freight Sambalpur to Jharsuguda | Western Odisha",
    titleHi: "Sambalpur se Jharsuguda Truck Book Karo — Western Odisha Ka Best Rate",
    description:
      "Book PTL/LTL freight from Sambalpur to Jharsuguda. Quick intrastate Odisha shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    descriptionHi:
      "Sambalpur se Jharsuguda ke liye truck chahiye? Western Odisha ke andar LoadSaathi se book karo. AI matching aur GPS tracking ke sath. Quick aur sasta!",
    keywordsHi:
      "sambalpur se jharsuguda truck, sambalpur jharsuguda bhada, western odisha freight",
    startingPriceINR: 8500,
    popularGoods: ["Mining equipment", "Industrial goods", "Agricultural produce", "Cement"],
  },
  "cuttack-to-bhubaneswar": {
    title: "PTL Freight Cuttack to Bhubaneswar | Twin City Corridor",
    titleHi: "Cuttack se Bhubaneswar Truck Book Karo — Twin City Ka Best Rate",
    description:
      "Book PTL/LTL freight from Cuttack to Bhubaneswar. Intrastate Odisha shipping on the twin-city corridor with LoadSaathi — AI matching and GPS tracking.",
    descriptionHi:
      "Cuttack se Bhubaneswar ke liye truck chahiye? Twin city corridor par LoadSaathi se book karo. AI matching aur GPS tracking ke sath. Sabse sasta!",
    keywordsHi:
      "cuttack se bhubaneswar truck, cuttack bhubaneswar bhada, odisha intrastate freight",
    startingPriceINR: 2550,
    popularGoods: ["Consumer goods", "Textiles", "Food products", "Electronics"],
  },
  "cuttack-to-rourkela": {
    title: "PTL Freight Cuttack to Rourkela | Coastal to Steel City",
    titleHi: "Cuttack se Rourkela Truck Book Karo — Coastal se Steel City",
    description:
      "Book PTL/LTL freight from Cuttack to Rourkela. Odisha intrastate shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    descriptionHi:
      "Cuttack se Rourkela ke liye truck chahiye? Coastal se Steel City tak LoadSaathi par book karo. AI matching aur GPS tracking ke sath. Best rate!",
    keywordsHi:
      "cuttack se rourkela truck, cuttack rourkela bhada, odisha freight, coastal to western odisha",
    startingPriceINR: 27200,
    popularGoods: ["Textiles", "Consumer goods", "Food products", "Industrial materials"],
  },
  "sambalpur-to-bhubaneswar": {
    title: "PTL Freight Sambalpur to Bhubaneswar | Western to Capital",
    titleHi: "Sambalpur se Bhubaneswar Truck Book Karo — LoadSaathi Se",
    description:
      "Book PTL/LTL freight from Sambalpur to Bhubaneswar. Odisha intrastate shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    descriptionHi:
      "Sambalpur se Bhubaneswar ke liye truck chahiye? Western Odisha se capital tak LoadSaathi par book karo. AI matching aur GPS tracking. Competitive rates!",
    keywordsHi:
      "sambalpur se bhubaneswar truck, sambalpur bhubaneswar bhada, odisha freight",
    startingPriceINR: 29750,
    popularGoods: ["Industrial goods", "Machinery", "Agricultural produce", "Consumer goods"],
  },
  "rourkela-to-cuttack": {
    title: "PTL Freight Rourkela to Cuttack | Steel City to Coastal Hub",
    titleHi: "Rourkela se Cuttack Truck Book Karo — Steel City se Coastal Hub",
    description:
      "Book PTL/LTL freight from Rourkela to Cuttack. Odisha intrastate shipping with LoadSaathi — AI matching, GPS tracking, and competitive rates.",
    descriptionHi:
      "Rourkela se Cuttack ke liye truck chahiye? Steel City se Coastal Hub tak LoadSaathi par book karo. AI matching aur GPS tracking ke sath. Best rate!",
    keywordsHi:
      "rourkela se cuttack truck, rourkela cuttack bhada, odisha freight, steel city to coastal odisha",
    startingPriceINR: 34000,
    popularGoods: ["Steel products", "Industrial machinery", "Textiles", "Consumer goods"],
  },
};
