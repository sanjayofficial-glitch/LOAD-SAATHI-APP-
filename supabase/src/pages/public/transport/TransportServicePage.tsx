import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowRight, Truck, Clock, Package, ArrowLeftRight, Calculator } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";
import { routes } from "@/data/routes";

interface TransportService {
  name: string;
  state: string;
  lead: string;
  answer: string;
  industries: string[];
  commodities: string[];
  hubDistances: { city: string; km: number }[];
  rateRanges: { type: string; range: string }[];
  serviceFaq: { q: string; a: string }[];
  serviceBlurbs: { ptl: string; ftl: string; returnLoad: string; quote: string };
  locationSlug: string | null;
  heroGradient: string;
}

const TRANSPORT_SERVICES: Record<string, TransportService> = {
  ranchi: {
    name: "Ranchi",
    state: "Jharkhand",
    lead: "Part load and full truck booking for Ranchi's Hatia, Kokar, Morabadi, Doranda and Namkum belts, moving coal, machinery spares, agriculture produce and retail stock across Jharkhand, West Bengal and Bihar.",
    answer:
      "Part load transport in Ranchi connects pickups across Hatia, Kokar, Morabadi, Doranda and Namkum to Kolkata, Jamshedpur, Patna and Rourkela. PTL booking in Ranchi lets a shipper book space in a shared truck for a consignment that does not fill a full vehicle, so you pay only for the weight and volume you occupy instead of hiring an entire truck. Coal and lignite, mining equipment spares, rice and wheat, cement and automobile parts move most often out of the city, while FMCG stock, retail goods and machinery move in. FTL truck booking from Ranchi suits a dedicated 16MT open truck or 32ft container when the load is heavy or the timing is fixed. LoadSaathi shows live availability, a rate range, truck type, transit time and trucker rating before you confirm, so freight service in Ranchi works the same way whether you are sending two bags of rice or a full trailer of equipment.",
    industries: ["Coal & Mining", "Heavy Machinery", "Consumer Goods", "Agriculture"],
    commodities: [
      "Coal & lignite",
      "Heavy mining equipment",
      "Agricultural produce (rice, wheat)",
      "Automobile parts",
      "Cement & building materials",
    ],
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
    serviceFaq: [
      {
        q: "Ranchi se Kolkata truck booking kaise karein aur kitna time lagta hai?",
        a: "Ranchi se Kolkata ke liye booking teen step mein hoti hai — pickup aur drop area choose karein, cargo weight aur type daalein, phir verified trucker ka rate range aur rating compare karke confirm karein. Ranchi se Kolkata tak lagbhag 390 km hai; transit time truck type, loading window aur route ke hisaab se 8–12 hours hota hai. Shared PTL load ke liye Kolkata aur Jamshedpur side daily departures milti hain, aur FTL ke liye aap apni preferred date choose kar sakte hain. Booking se pehle aap truck type, estimated arrival aur trucker rating sab app mein dekh sakte hain.",
      },
      {
        q: "Ranchi mein pickup kis area se ho sakta hai?",
        a: "LoadSaathi par Ranchi ke Hatia, Kokar, Morabadi, Doranda aur Namkum areas se pickup book ho sakta hai. Sheetal Nagar, Ratu Road aur Ring Road ke godowns aur industrial sheds se bhi loaders available hain. Aapko sirf pickup address aur loading time dena hai — trucker location confirm karke aata hai, aur aapko driver details, vehicle number aur live location booking ke andar mil jaate hain.",
      },
      {
        q: "Coal aur heavy machinery Ranchi se safely kaise load hota hai?",
        a: "Coal ke liye high-bed aur tippers suggest kiye jaate hain, aur machinery spares ke liye craned loading aur wooden packing chahiye hoti hai. Loading ke waqt tarpaulin covering, lashing straps aur weighbridge slip verify karein — in sab ko aap booking ki special instructions mein likh sakte hain. Truckers ka mining-area experience aur vehicle capacity profile par diya hota hai, aur GPS tracking pickup se delivery tak chalti rehti hai, taaki aap coal ya equipment ki position live dekh sakein.",
      },
      {
        q: "Coal ya ore bhejne par GST details aur GPS tracking milti hai?",
        a: "Har LoadSaathi booking par aap jo cargo description, weight aur shipper details daalte hain wahi GST e-way bill ke inputs hain, isliye booking banate waqt ye details sahi bharein. Coal, lignite aur ore jaise bulk loads par GPS tracking pickup se delivery tak chalti hai aur app se live position, expected arrival aur delivery confirmation dikhti hai. Tarpaulin covering aur weighbridge slip dispatch se pehle trucker se confirm kar lein — heavy machinery aur high-value consignments ke liye insurance option bhi poochha ja sakta hai.",
      },
    ],
    serviceBlurbs: {
      ptl: "Book shared truck space for coal samples, machinery spares or rice bags leaving Hatia and Namkum — pay only for the weight you load.",
      ftl: "Dedicated 16MT open truck or 32ft container for a full coal, ore or equipment movement out of Ranchi, timed to your loading window.",
      returnLoad: "Find trucks already heading back from Kolkata or Jamshedpur into Ranchi and move a load at a reduced return-trip rate.",
      quote: "Enter pickup, drop and weight to see today's freight rate range for any Ranchi lane in seconds.",
    },
    locationSlug: "ranchi",
    heroGradient: "from-blue-600 to-indigo-600",
  },

  bhubaneswar: {
    name: "Bhubaneswar",
    state: "Odisha",
    lead: "PTL and FTL freight booking for Mancheswar Industrial Estate, Patia, Khordha and Jatni — pharma, FMCG, food grains and port cargo moving to Rourkela, Cuttack, Sambalpur and Kolkata.",
    answer:
      "Part load transport in Bhubaneswar serves Mancheswar Industrial Estate, Patia, Khordha and Jatni, with corridors running to Rourkela, Cuttack, Sambalpur and Kolkata. PTL booking in Bhubaneswar is built for MSMEs moving pharmaceuticals, FMCG cartons, food grains and garments in quantities that do not justify a full truck. A shared truck splits the vehicle cost across shippers heading the same direction, which keeps freight service in Bhubaneswar cheaper per kilogram than booking an empty vehicle. FTL truck booking is the better fit when you are moving a full 16MT load of port cargo, sealed pharma pallets or bulk food grains on a fixed schedule. Every LoadSaathi listing shows the truck type, rate range, transit time and trucker profile before you book, and you can request an instant freight quote for a Bhubaneswar to Rourkela or Kolkata lane without waiting for a broker to call back.",
    industries: ["IT & Technology", "Ports & Logistics", "Food Processing", "Textiles"],
    commodities: [
      "Port cargo (Paradip, Gopalpur)",
      "IT hardware",
      "Food grains & pulses",
      "Textiles & garments",
      "Pharmaceuticals",
    ],
    hubDistances: [
      { city: "Rourkela", km: 310 },
      { city: "Cuttack", km: 25 },
      { city: "Kolkata", km: 470 },
      { city: "Sambalpur", km: 300 },
    ],
    rateRanges: [
      { type: "FTL", range: "₹40–58/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–13/kg" },
    ],
    serviceFaq: [
      {
        q: "Bhubaneswar se Rourkela part load bhejna hai — kaise book karun?",
        a: "Bhubaneswar se Rourkela ke liye PTL booking app mein teen step mein poori hoti hai — pickup area (Mancheswar, Patia ya Jatni) choose karein, weight aur goods type daalein, aur shared-truck options compare karke confirm karein. Ye lane takriban 310 km hai, aur part load me aap sirf apne occupied weight aur volume ke liye pay karte hain. Daily departures milne ki wajah se chhote consignments kaafi jaldi deliver hote hain. Agar poora 16MT load hai ya fixed delivery date chahiye, to FTL option choose karein.",
      },
      {
        q: "Bhubaneswar mein pickup kahan se hota hai?",
        a: "Mancheswar Industrial Estate, Patia, Khordha aur Jatni se regular pickups ho sakte hain. Patia aur Jaydev Vihar ke warehouses, Khordha Road ke industrial units aur Jatni ke godowns se bhi loaders available hain. Aap pickup address ke saath loading time bhi mention karein — trucker confirm karke vehicle details aur live location share karta hai, aur aap delivery tak tracking dekh sakte hain.",
      },
      {
        q: "Pharma, FMCG aur food-grade cargo Bhubaneswar se safely kaise jaata hai?",
        a: "Pharma aur FMCG cartons ke liye covered ya container trucks suggest kiye jaate hain taaki dust aur moisture se maal bacha rahe. Food grains aur pulses ke liye sealed bags aur tarpaulin covering use hoti hai. Booking mein packaging type, carton count aur handling notes likhein, aur trucker se confirm karein ki vehicle clean aur dry hai. High-value pharma shipments ke liye insurance option poochha sakte hain, aur GPS tracking se aap poora movement app se follow kar sakte hain.",
      },
      {
        q: "Sealed carton ya pharma load par GST invoice aur GPS tracking milti hai?",
        a: "Har booking par aap cargo description, weight aur shipper details daalte hain — yehi details GST e-way bill banane ke liye chahiye, isliye book karte waqt inhe sahi rakhein. Bhubaneswar se jaane wale sealed carton, pharma aur FMCG loads par GPS tracking pickup se delivery tak chalti hai, jisse aap live position aur delivery confirmation dekh sakte hain. Container number aur seal detail dispatch ke baad note kar lein, aur special handling instructions booking ke andar add karein.",
      },
    ],
    serviceBlurbs: {
      ptl: "Share truck space for pharma cartons, food grains or garments leaving Mancheswar and Patia — pay for the weight you actually load.",
      ftl: "Full 16MT or container booking for port cargo, bulk food grains and retail stock moving out of Bhubaneswar on a fixed date.",
      returnLoad: "Catch trucks returning from Rourkela, Sambalpur or Kolkata into Bhubaneswar and ship at a lower return-leg rate.",
      quote: "Get an instant freight rate range for any Bhubaneswar lane — pickup, drop and weight are all you need.",
    },
    locationSlug: "bhubaneswar",
    heroGradient: "from-violet-600 to-purple-600",
  },

  rourkela: {
    name: "Rourkela",
    state: "Odisha",
    lead: "Steel, cement, forest product and engineering freight from Chhend, Sector 19, Fertiliser Township, Jagda and Raghunathpali to Bhubaneswar, Kolkata, Jamshedpur and Cuttack.",
    answer:
      "Part load transport in Rourkela runs out of Chhend, Sector 19, Fertiliser Township, Jagda and Raghunathpali toward Bhubaneswar, Kolkata, Jamshedpur and Cuttack. PTL booking in Rourkela fits engineering parts, cement bags, plywood and aluminium ingots that do not need an entire truck. Booking shared space keeps freight service in Rourkela affordable per kilogram for small consignments of fasteners, consumables and steel accessories. FTL truck booking is the standard choice for hot-rolled coils, heavy machinery and full cement loads where a dedicated vehicle and a fixed departure matter. LoadSaathi lists the rate range by truck type, distance and transit time alongside verified trucker profiles, so you can compare options before confirming. You can also request an instant freight quote for a Rourkela to Bhubaneswar or Kolkata lane and see the current market range immediately instead of waiting on a local broker call back.",
    industries: ["Steel & Metals", "Cement", "Forest Products", "Engineering Goods"],
    commodities: [
      "Hot-rolled steel coils",
      "Cement (ultra-tech, Ambuja)",
      "Plywood & timber",
      "Heavy engineering parts",
      "Aluminium ingots",
    ],
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
    serviceFaq: [
      {
        q: "Rourkela se Bhubaneswar part load kab book karein?",
        a: "Rourkela se Bhubaneswar ke liye PTL booking aap cargo ready hone se ek din pehle kar lein, taaki shared truck ka space confirm ho. Ye lane takriban 310 km hai, aur part load me aap apne weight aur volume ke hisaab se pay karte hain — poora truck khali karne ki zaroorat nahi. Cement bags, plywood, fasteners aur engineering parts ke liye daily departures milti hain. Agar steel coil ya heavy machinery ja rahi hai ya fixed delivery date zaroori hai, to FTL option better rahega.",
      },
      {
        q: "Rourkela mein pickup kis area se hoga?",
        a: "Chhend, Sector 19, Fertiliser Township, Jagda aur Raghunathpali se regular pickups ho sakte hain. Rourkela Steel Plant ke gate areas, Ghaghra aur Tatyapara ke godowns se bhi loaders available hain. Pickup address aur loading time batate hi trucker vehicle details, driver number aur live location share karta hai, aur aap delivery tak movement app se follow kar sakte hain.",
      },
      {
        q: "Steel coils aur cement ke liye kaunsa truck type chahiye?",
        a: "Hot-rolled steel coils ke liye high-bed ya flatbed trailer chahiye taaki coil craned loading ke waqt stable rahe; coils ko lashing straps aur dunnage se secure kiya jaata hai. Cement bags ke liye covered container ya high-bed open truck suitable hai, aur tarpaulin covering mausam ke hisaab se add hoti hai. Machinery aur heavy parts ke liye crane-assisted loading confirm karein. Booking ke truck type field mein cargo weight aur dimensions zaroor daalein taaki sahi vehicle allot ho.",
      },
      {
        q: "Steel ya cement ki booking par GST details aur GPS tracking milti hai?",
        a: "Booking mein aap jo cargo description, weight aur invoice details daalte hain wahi GST e-way bill ke inputs hain, isliye steel coil ya cement ka net weight aur packaging count sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse aap Rourkela se Bhubaneswar ya Kolkata tak movement live dekh sakte hain. Lashing, covering aur weighbridge slip dispatch se pehle trucker se confirm kar lein, aur high-value engineering parts ke liye insurance option poochha lein.",
      },
    ],
    serviceBlurbs: {
      ptl: "Book shared space for cement bags, plywood or engineering parts leaving Chhend and Jagda — no need to hire a full truck.",
      ftl: "Dedicated high-bed or trailer for hot-rolled coils, heavy machinery and full cement loads from Rourkela's industrial belt.",
      returnLoad: "Use trucks returning from Kolkata, Jamshedpur or Cuttack into Rourkela and cut the cost on a back-haul leg.",
      quote: "See today's freight rate range for any Rourkela lane — enter pickup, drop and weight for an instant estimate.",
    },
    locationSlug: "rourkela",
    heroGradient: "from-orange-600 to-red-600",
  },

  jamshedpur: {
    name: "Jamshedpur",
    state: "Jharkhand",
    lead: "Automotive components, steel and engineering freight from Bistupur, Sakchi, Jugsalai, Kadma, Sonali and Gamharia to Kolkata, Ranchi, Rourkela and Bhubaneswar.",
    answer:
      "Part load transport in Jamshedpur covers Bistupur, Sakchi, Jugsalai, Kadma, Sonali and Gamharia, with freight moving to Kolkata, Ranchi, Rourkela and Bhubaneswar. PTL booking in Jamshedpur is designed for automotive components, fasteners, wire and cable, and small engineering batches that leave the plant in quantities smaller than a full truckload. Shared-truck freight service in Jamshedpur spreads the vehicle cost across shippers, which keeps per-kilogram rates predictable for MSMEs supplying the city's steel and engineering ecosystem. FTL truck booking suits finished steel products, heavy engineering parts and clinker where a dedicated vehicle and a fixed departure matter. LoadSaathi shows the rate range, truck type, transit time and trucker rating before you confirm, and you can pull an instant freight quote for a Jamshedpur to Kolkata or Ranchi lane in seconds.",
    industries: ["Steel Manufacturing", "Automotive Parts", "Heavy Engineering", "Cement"],
    commodities: [
      "Finished steel products",
      "Automobile components",
      "Heavy engineering parts",
      "Clinker & cement",
      "Wire & cable",
    ],
    hubDistances: [
      { city: "Kolkata", km: 290 },
      { city: "Ranchi", km: 155 },
      { city: "Rourkela", km: 280 },
      { city: "Bhubaneswar", km: 430 },
    ],
    rateRanges: [
      { type: "FTL", range: "₹36–52/kg" },
      { type: "PTL", range: "₹6–9/kg" },
      { type: "LTL", range: "₹10–14/kg" },
    ],
    serviceFaq: [
      {
        q: "Jamshedpur se Kolkata full truck kaise milega?",
        a: "Jamshedpur se Kolkata ke liye FTL booking app mein pickup area, weight aur preferred date daal kar hoti hai. Ye lane takriban 290 km ka hai aur truck type ke hisaab se transit time 6–8 hours rehta hai. Shared PTL option chahiye to weight chhota rakh kar bhi booking kar sakte hain — usme dusron ke consignments ke saath space share hota hai aur rate per kg kam padta hai. Har option par rate range, truck type aur trucker rating confirm karne se pehle dikh jaati hai.",
      },
      {
        q: "Jamshedpur mein pickup kahan se hota hai?",
        a: "Bistupur, Sakchi, Jugsalai, Kadma, Sonali aur Gamharia se pickups regular hote hain. Sakchi aur Bistupur ke industrial sheds, Jugsalai ke godowns aur Gamharia ke plant gates se bhi loading ho sakti hai. Pickup address ke saath loading time aur forklift/crane availability bata dein — trucker confirm karte waqt vehicle number, driver contact aur live location share karta hai.",
      },
      {
        q: "Auto components aur engineering goods ke liye kaunsa truck type sahi hai?",
        a: "Automobile components aur fasteners ke liye closed container (20ft ya 32ft) best hai taaki dust, moisture aur chori se maal bacha rahe. Wire aur cable reels ke liye high-bed open truck with lashing suitable rehta hai, aur heavy engineering parts ke liye crane-assisted loading chahiye. Finished steel products ke liye flatbed ya high-bed trailer use hota hai. Booking mein cargo dimensions aur weight zaroor daalein taaki matching engine sahi vehicle suggest kare.",
      },
      {
        q: "Steel coil ya engineering load par GST details aur GPS tracking milti hai?",
        a: "Booking ke andar aap jo cargo description, weight aur invoice inputs daalte hain wahi GST e-way bill banane ke liye chahiye, isliye coil ka number, net weight aur packaging detail sahi rakhein. LoadSaathi par GPS tracking pickup se delivery tak active rehti hai, jisse Jamshedpur se Kolkata ya Ranchi ka movement aap live dekh sakte hain. Lashing aur covering dispatch se pehle confirm karein, aur high-value engineering parts ke liye insurance option poochha lein.",
      },
    ],
    serviceBlurbs: {
      ptl: "Share truck space for fasteners, wire coils or small part batches leaving Bistupur and Sakchi — pay only for what you load.",
      ftl: "Dedicated container or high-bed trailer for finished steel, auto components and heavy engineering loads from Jamshedpur.",
      returnLoad: "Find trucks heading back from Kolkata or Ranchi into Jamshedpur and book the return leg at a lower rate.",
      quote: "Enter pickup, drop and weight to see today's freight rate range for any Jamshedpur lane instantly.",
    },
    locationSlug: "jamshedpur",
    heroGradient: "from-amber-600 to-orange-600",
  },

  balasore: {
    name: "Balasore",
    state: "Odisha",
    lead: "Rice, paddy, textile and palm oil freight from Sahadevkhunta, Fakir Mohan and Chandinichowk to Bhubaneswar, Kolkata, Cuttack and Rourkela.",
    answer:
      "Part load transport in Balasore runs from Sahadevkhunta, Fakir Mohan and Chandinichowk toward Bhubaneswar, Kolkata, Cuttack and Rourkela. PTL booking in Balasore suits rice and paddy bags, textile bales, palm oil drums and cashew cartons that do not fill a truck. Booking a shared load keeps freight service in Balasore economical for millers and traders shipping smaller consignments along the coastal corridor. FTL truck booking is the better option when a full 16MT of rice, a bulk textile order or a complete pallet run has to move on a fixed date. LoadSaathi lists rate ranges, truck availability and trucker ratings before you commit, so you can compare a Balasore to Bhubaneswar or Kolkata lane and request an instant freight quote without waiting on a local broker.",
    industries: ["Rice Milling", "Seafood Processing", "Textiles", "Defence (HAL/DRDO)"],
    commodities: ["Rice & paddy", "Seafood & fish", "Textiles", "Defence equipment", "Palm oil"],
    hubDistances: [
      { city: "Bhubaneswar", km: 210 },
      { city: "Kolkata", km: 300 },
      { city: "Cuttack", km: 170 },
      { city: "Rourkela", km: 420 },
    ],
    rateRanges: [
      { type: "FTL", range: "₹34–48/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–12/kg" },
    ],
    serviceFaq: [
      {
        q: "Balasore se Bhubaneswar chhota load kaise bhejein?",
        a: "Balasore se Bhubaneswar ke liye chhota load PTL booking se bhejein — aap sirf apne weight aur volume ke hisaab se pay karte hain, poora truck khareedne ki zaroorat nahi. Ye lane takriban 210 km hai aur shared trucks regularly nikalte hain. Pickup area (Sahadevkhunta ya Chandinichowk), weight aur goods type daalte hi options dikh jaate hain. Agar poora 16MT rice ya bulk textile ja raha hai aur date fixed hai, to FTL choose karein.",
      },
      {
        q: "Balasore mein pickup kis area se hoga?",
        a: "Sahadevkhunta, Fakir Mohan aur Chandinichowk se regular pickups ho sakte hain. Balasore town ke mill godowns, rice market ke warehouses aur buses stand area ke godowns se bhi loaders available hain. Pickup address aur loading time batate hi trucker vehicle details aur live location share karta hai, aur aap app se delivery tak movement follow kar sakte hain.",
      },
      {
        q: "Rice bags aur textile bales ke liye kaunsa truck type chahiye?",
        a: "Rice aur paddy bags ke liye covered container ya tarpaulin-covered open truck suitable hai taaki baarish aur moisture se maal bacha rahe; bags stacked aur lashed hona chahiye. Textile bales ke liye dry covered container best hai, aur palm oil drums ke liye high-bed truck with side protection use hota hai. Jute aur cotton loads me ventilation bhi zaroori ho sakti hai. Booking mein bag count, weight aur packaging type daalein taaki sahi vehicle allot ho.",
      },
      {
        q: "Rice ya textile ki booking par GST details aur GPS tracking milti hai?",
        a: "Booking par aap jo weight, cargo description aur invoice details daalte hain wahi GST e-way bill ke liye chahiye, isliye rice ka bag count aur net weight sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse Balasore se Bhubaneswar ya Kolkata ka movement live dikhta hai aur delivery confirmation milti hai. Tarpaulin covering aur weighbridge slip dispatch se pehle confirm karein, aur bulk paddy ke liye insurance option poochha lein.",
      },
    ],
    serviceBlurbs: {
      ptl: "Book shared space for rice bags, textile bales or cashew cartons leaving Sahadevkhunta and Chandinichowk.",
      ftl: "Full 16MT truck for bulk rice, paddy and textile movements out of Balasore on a fixed dispatch date.",
      returnLoad: "Use trucks returning from Bhubaneswar or Kolkata into Balasore and ship at a reduced return-leg rate.",
      quote: "Get an instant freight rate range for any Balasore lane — pickup, drop and weight are all it takes.",
    },
    locationSlug: "balasore",
    heroGradient: "from-sky-600 to-blue-600",
  },

  berhampur: {
    name: "Berhampur",
    state: "Odisha",
    lead: "Rice, cashew, silk and seafood freight from Bada Bazar, Aska Road, Palur Road and Engineering School Chowk to Bhubaneswar, Cuttack, Vizag and Rourkela.",
    answer:
      "Part load transport in Berhampur picks up from Bada Bazar, Aska Road, Palur Road and Engineering School Chowk, with lanes running to Bhubaneswar, Cuttack, Visakhapatnam and Rourkela. PTL booking in Berhampur is made for rice cartons, cashew consignments, silk textiles and small engineering batches that travel better as shared space than as a half-empty truck. Freight service in Berhampur lets millers, weavers and traders pay for the weight they actually load instead of carrying the cost of an entire vehicle. FTL truck booking is the right fit when a full 16MT of rice, a complete textile order or a bulk cashew dispatch must reach its destination on a set schedule. LoadSaathi lists rate ranges, truck types, transit times and verified trucker ratings up front, and you can request an instant freight quote for a Berhampur to Bhubaneswar or Vizag lane in under a minute.",
    industries: ["Textiles & Silk", "Rice Milling", "Fisheries", "Cashew Processing"],
    commodities: ["Silk textiles", "Rice", "Fish & prawns", "Cashew", "Jute products"],
    hubDistances: [
      { city: "Bhubaneswar", km: 180 },
      { city: "Vizag", km: 280 },
      { city: "Cuttack", km: 210 },
      { city: "Rourkela", km: 500 },
    ],
    rateRanges: [
      { type: "FTL", range: "₹34–50/kg" },
      { type: "PTL", range: "₹6–9/kg" },
      { type: "LTL", range: "₹10–13/kg" },
    ],
    serviceFaq: [
      {
        q: "Berhampur se Bhubaneswar part load booking kaise karein?",
        a: "Berhampur se Bhubaneswar ke liye PTL booking mein pickup area (Bada Bazar, Aska Road ya Palur Road), weight aur goods type daalein — shared truck options turant dikh jaate hain. Ye lane takriban 180 km hai, aur part load me sirf apne occupied weight ke liye pay karte hain. Rice cartons, cashew aur chhote textile lots ke liye daily departures milti hain. Poora 16MT load ho ya fixed date ho, to FTL option choose karein aur truck type cargo ke hisaab se confirm karein.",
      },
      {
        q: "Berhampur mein pickup kahan se hoga?",
        a: "Bada Bazar, Aska Road, Palur Road aur Engineering School Chowk se pickups ho sakte hain. Town ke mill godowns, cashew processing units aur Aska Road ke warehouses se bhi loaders available hain. Pickup address aur loading time batate hi trucker vehicle number, driver contact aur live location share karta hai, aur aap delivery tak tracking app se dekh sakte hain.",
      },
      {
        q: "Rice aur cashew consignment ke liye kaunsa truck type sahi hai?",
        a: "Rice aur paddy bags ke liye covered container ya tarpaulin-covered open truck chahiye taaki moisture se maal bacha rahe, aur bags ko stacked aur lashed rakhna chahiye. Cashew aur processed food cartons ke liye dry, clean container best hai — dust aur odour se bachaav zaroori hai. Jute products ke liye breathable covered truck suitable rehta hai. Booking mein carton count, weight aur packaging type daalein taaki sahi vehicle allot ho.",
      },
      {
        q: "Cashew ya rice ki booking par GST details aur GPS tracking milti hai?",
        a: "Booking mein aap jo cargo description, weight aur invoice inputs daalte hain wahi GST e-way bill banane ke liye chahiye, isliye carton count aur net weight sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse Berhampur se Bhubaneswar ya Vizag ka movement aap live dekh sakte hain aur delivery confirmation mil jaati hai. Tarpaulin covering aur weighbridge slip dispatch se pehle trucker se confirm karein, aur food-grade loads ke liye clean-vehicle requirement booking mein mention kar dein.",
      },
    ],
    serviceBlurbs: {
      ptl: "Share truck space for rice cartons, cashew boxes or small textile lots leaving Bada Bazar and Aska Road.",
      ftl: "Dedicated 16MT or covered container for bulk rice, cashew and textile dispatches out of Berhampur.",
      returnLoad: "Find trucks returning from Bhubaneswar, Cuttack or Vizag into Berhampur and book at a lower back-haul rate.",
      quote: "Enter pickup, drop and weight to see today's freight rate range for any Berhampur lane instantly.",
    },
    locationSlug: "berhampur",
    heroGradient: "from-emerald-700 to-green-600",
  },

  kolkata: {
    name: "Kolkata",
    state: "West Bengal",
    lead: "Part load and full truck booking across Burrabazar, Salt Lake, New Town, Taratala, Baguiati, Howrah and the Dankuni truck terminal, serving jute, steel, electronics and FMCG.",
    answer:
      "Part load transport in Kolkata serves Burrabazar, Salt Lake, New Town, Taratala, Baguiati, Howrah and the Dankuni truck terminal, with freight moving to Rourkela, Ranchi, Jamshedpur and Bhubaneswar. PTL booking in Kolkata is the practical choice for traders shipping jute products, leather goods, electronics, tea and FMCG cartons in quantities that do not justify a full vehicle. Shared-truck freight service in Kolkata keeps cost per kilogram low across East India's busiest distribution hub. FTL truck booking fits full steel consignments, containerised retail stock and bulk tea movements where a dedicated truck and fixed timing matter. LoadSaathi shows rate ranges, truck types, transit times and trucker ratings before you confirm, and you can pull an instant freight quote for any Kolkata lane to compare current market ranges immediately.",
    industries: ["Jute & Textiles", "Steel Trading", "Electronics", "FMCG Distribution"],
    commodities: [
      "Jute products",
      "Steel & iron ore",
      "Leather goods",
      "Electronics",
      "Tea & food products",
    ],
    hubDistances: [
      { city: "Rourkela", km: 530 },
      { city: "Ranchi", km: 390 },
      { city: "Jamshedpur", km: 290 },
      { city: "Bhubaneswar", km: 470 },
    ],
    rateRanges: [
      { type: "FTL", range: "₹42–60/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–12/kg" },
    ],
    serviceFaq: [
      {
        q: "Kolkata se Rourkela truck booking kaise karein?",
        a: "Kolkata se Rourkela ke liye booking mein pickup area (Howrah, Taratala, Salt Lake ya Dankuni), destination aur weight daalein — options compare karke confirm kar dein. Ye lane takriban 530 km ka hai aur truck type ke hisaab se transit time 12–14 hours rehta hai. Chhote consignments ke liye PTL shared truck better hai, poora container ya 16MT load ho to FTL choose karein. Har option par rate range, truck type aur trucker rating book karne se pehle dikh jaati hai.",
      },
      {
        q: "Kolkata mein pickup kis area se ho sakta hai?",
        a: "Burrabazar, Salt Lake, New Town, Taratala, Baguiati, Howrah aur Dankuni truck terminal se pickups regular hote hain. Shyambazar aur Tangra ke godowns, Salt Lake Sector V ke warehouses aur Howrah ke industrial sheds se bhi loaders available hain. Pickup address aur loading time ke saath dock leveler ya forklift availability bata dein — trucker confirm karte waqt vehicle details aur live location share karta hai.",
      },
      {
        q: "Part load aur container ke liye kaunsa truck type chahiye?",
        a: "Part load ke liye shared container ya covered truck best hai — aap sirf occupied space ke liye pay karte hain aur maal dust aur moisture se bacha rehta hai. Electronics, leather goods aur retail cartons ke liye 20ft ya 32ft closed container choose karein. Steel trading consignments ke liye high-bed ya flatbed trailer chahiye, aur jute products ke liye breathable covered truck suitable hai. Booking mein dimensions, weight aur fragility note daalein taaki sahi vehicle allot ho.",
      },
      {
        q: "Container ya e-way load par GST details aur GPS tracking milti hai?",
        a: "Booking par aap jo cargo description, weight aur invoice details daalte hain wahi GST e-way bill ke inputs hain, isliye container number, seal detail aur net weight sahi rakhein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse aap Kolkata se Rourkela, Ranchi ya Bhubaneswar tak movement live dekh sakte hain. Loading ke baad dock photos le lein aur weighbridge slip confirm karein — high-value electronics aur steel ke liye insurance option poochha lein.",
      },
    ],
    serviceBlurbs: {
      ptl: "Book shared truck space for jute, electronics or FMCG cartons leaving Burrabazar, Howrah and Salt Lake.",
      ftl: "Dedicated container or 16MT truck for full steel, retail stock and tea consignments out of Kolkata.",
      returnLoad: "Use trucks heading back from Rourkela, Ranchi or Jamshedpur into Kolkata and cut your freight cost.",
      quote: "See today's freight rate range for any Kolkata lane — pickup, drop and weight are all you need.",
    },
    locationSlug: "kolkata",
    heroGradient: "from-emerald-600 to-teal-600",
  },

  durgapur: {
    name: "Durgapur",
    state: "West Bengal",
    lead: "Steel, power plant spares and engineering freight from Benachity, City Centre, Steel Township and Andal to Kolkata, Asansol, Burdwan and Dhanbad.",
    answer:
      "Part load transport in Durgapur runs from Benachity, City Centre, Steel Township and Andal toward Kolkata, Asansol, Burdwan and Dhanbad. PTL booking in Durgapur is built for steel billets and rods, power plant spares, engineering components and cement moving in quantities smaller than a full truckload. Shared-truck freight service in Durgapur keeps cost per kilogram manageable for suppliers on the Grand Trunk Road industrial belt who ship small batches regularly. FTL truck booking suits full loads of steel products, coal and bulk building material when the whole vehicle is needed and timing is fixed. LoadSaathi shows rate ranges, truck types, transit times and verified trucker ratings before you confirm, and you can request an instant freight quote for a Durgapur to Kolkata or Dhanbad lane and see the current market range without calling a broker.",
    industries: ["Steel & Metals", "Power Generation", "Engineering Goods", "Agriculture"],
    commodities: [
      "Steel billets & rods",
      "Coal & power plant spares",
      "Cement & building materials",
      "Engineering components",
      "Rice & food grains",
    ],
    hubDistances: [
      { city: "Kolkata", km: 160 },
      { city: "Asansol", km: 50 },
      { city: "Burdwan", km: 60 },
      { city: "Dhanbad", km: 130 },
    ],
    rateRanges: [
      { type: "FTL", range: "₹32–48/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–12/kg" },
    ],
    serviceFaq: [
      {
        q: "Durgapur se Kolkata tempo booking kaise karein?",
        a: "Durgapur se Kolkata ke liye booking mein pickup area (Benachity, City Centre ya Steel Township), weight aur goods type daalein — chhote loads ke liye tempo aur shared truck options, bade loads ke liye 16MT aur container options dikh jaate hain. Ye lane takriban 160 km ka hai, aur transit time truck type ke hisaab se 4–6 hours rehta hai. PTL booking me sirf apne weight ke liye pay karte hain; poora load ho to FTL choose karein. Rate range, truck type aur trucker rating confirm karne se pehle app par mil jaate hain.",
      },
      {
        q: "Durgapur mein pickup kis area se hoga?",
        a: "Benachity, City Centre, Steel Township aur Andal se regular pickups ho sakte hain. GT Road ke industrial units, Andal ke godowns aur Durgapur Steel Township ke gate areas se bhi loading hoti hai. Pickup address aur loading time ke saath crane ya forklift availability bata dein — trucker confirm karte waqt vehicle number, driver contact aur live location share karta hai.",
      },
      {
        q: "Durgapur se kaunse destinations tak part load ja sakta hai?",
        a: "Durgapur se shared PTL load Kolkata, Asansol, Burdwan aur Dhanbad tak regularly nikalte hain — ye sab 50 se 160 km ke range mein hain, isliye chhote consignments ke liye bhi daily options milte hain. Ranchi, Jamshedpur aur Bhubaneswar ke lanes bhi connect hote hain, aur aap app par origin Durgapur daal kar available corridors dekh sakte hain. Jis destination ka direct corridor na ho, wo bhi request kar sakte hain — matching engine us route par trucker dhoondhta hai.",
      },
      {
        q: "Steel ya plant spares ki booking par GST details aur GPS tracking milti hai?",
        a: "Booking mein aap jo cargo description, weight aur invoice inputs daalte hain wahi GST e-way bill banane ke liye chahiye, isliye billets, rods ya spares ka net weight aur item count sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse aap Durgapur se Kolkata, Asansol ya Dhanbad tak movement live dekh sakte hain. Lashing aur covering dispatch se pehle confirm karein, aur plant spares ya high-value components ke liye insurance option poochha lein.",
      },
    ],
    serviceBlurbs: {
      ptl: "Share truck space for steel billets, plant spares or rice bags leaving Benachity, City Centre and Andal.",
      ftl: "Dedicated 16MT truck for full steel, coal and building material movements out of Durgapur's GT Road belt.",
      returnLoad: "Catch trucks returning from Kolkata or Dhanbad into Durgapur and ship the back-haul leg for less.",
      quote: "Enter pickup, drop and weight to see today's freight rate range for any Durgapur lane instantly.",
    },
    locationSlug: null,
    heroGradient: "from-rose-600 to-red-700",
  },

  burdwan: {
    name: "Burdwan",
    state: "West Bengal",
    lead: "Rice, wheat, processed steel and coal freight from G.T. Road, Curzon Gate, Bhatar and Belkuni to Kolkata, Dhanbad, Ranchi and Rourkela.",
    answer:
      "Part load transport in Burdwan picks up from G.T. Road, Curzon Gate, Bhatar and Belkuni, with freight moving to Kolkata, Dhanbad, Ranchi and Rourkela. PTL booking in Burdwan fits processed steel, coal, rice and wheat bags, engineering components and clay products that do not fill a truck. Shared-truck freight service in Burdwan lets traders and millers pay only for the space they use on a busy East India corridor. FTL truck booking is the standard option for a full 16MT of grain, a complete coal movement or a bulk steel dispatch on a fixed date. LoadSaathi lists rate ranges, truck types, transit times and trucker ratings before you confirm, along with GST-ready booking details on every trip, and you can request an instant freight quote for a Burdwan to Kolkata or Dhanbad lane to see today's market range.",
    industries: ["Steel Processing", "Coal Distribution", "Engineering Goods", "Agriculture"],
    commodities: ["Processed steel", "Coal", "Rice & wheat", "Engineering components", "Clay products"],
    hubDistances: [
      { city: "Kolkata", km: 110 },
      { city: "Dhanbad", km: 180 },
      { city: "Ranchi", km: 280 },
      { city: "Rourkela", km: 320 },
    ],
    rateRanges: [
      { type: "FTL", range: "₹32–48/kg" },
      { type: "PTL", range: "₹5–8/kg" },
      { type: "LTL", range: "₹9–12/kg" },
    ],
    serviceFaq: [
      {
        q: "Burdwan se Kolkata full truck kaise book karein?",
        a: "Burdwan se Kolkata ke liye FTL booking mein pickup area (G.T. Road, Curzon Gate, Bhatar ya Belkuni), weight aur preferred date daalein — verified trucker ke options compare karke confirm kar dein. Ye lane takriban 110 km ka hai aur truck type ke hisaab se transit time 2.5–4 hours rehta hai. Chhota load hai to PTL shared truck choose karein, jisme sirf apne weight ke liye pay karte hain. Rate range, truck type aur trucker rating dono options par book karne se pehle app par mil jaate hain.",
      },
      {
        q: "Burdwan mein pickup kahan se hota hai?",
        a: "G.T. Road, Curzon Gate, Bhatar aur Belkuni se regular pickups ho sakte hain. Burdwan town ke mill godowns, rice market ke warehouses aur GT Road ke industrial sheds se bhi loaders available hain. Pickup address aur loading time batate hi trucker vehicle details aur live location share karta hai, aur aap app se delivery tak movement follow kar sakte hain.",
      },
      {
        q: "Rice, paddy aur steel ke liye kaunsa truck type chahiye?",
        a: "Rice aur paddy bags ke liye covered container ya tarpaulin-covered open truck chahiye taaki baarish aur moisture se maal bacha rahe; bags ko stacked aur lashed rakhna chahiye. Processed steel aur engineering components ke liye high-bed ya flatbed trailer suitable hai, jahan coils aur rods ko lashing se secure kiya jaata hai. Coal ke liye tipper ya high-capacity open truck use hota hai. Booking mein bag count, weight aur packaging type daalein taaki sahi vehicle allot ho.",
      },
      {
        q: "Rice ya steel ki booking par GST details aur GPS tracking milti hai?",
        a: "Har booking par aap cargo description, weight aur invoice details daalte hain — yehi GST e-way bill banane ke inputs hain, isliye rice ka bag count aur steel ka net weight sahi bharein. LoadSaathi par GPS tracking pickup se delivery tak chalti hai, jisse Burdwan se Kolkata, Dhanbad ya Ranchi ka movement live dikhta hai. Tarpaulin covering aur weighbridge slip dispatch se pehle confirm karein, aur bulk grain ya steel ke liye insurance option poochha lein.",
      },
    ],
    serviceBlurbs: {
      ptl: "Book shared space for rice bags, coal or engineering parts leaving G.T. Road, Bhatar and Belkuni.",
      ftl: "Full 16MT or high-bed truck for bulk grain, coal and processed steel dispatches out of Burdwan.",
      returnLoad: "Use trucks returning from Kolkata, Dhanbad or Ranchi into Burdwan and ship at a lower rate.",
      quote: "Get an instant freight rate range for any Burdwan lane — enter pickup, drop and weight.",
    },
    locationSlug: "burdwan",
    heroGradient: "from-yellow-600 to-amber-600",
  },
};

const SERVICE_LINKS = [
  { key: "ptl", title: "PTL Part Load", to: "/ptl-transport", Icon: Package },
  { key: "ftl", title: "FTL Full Truck", to: "/truck-load-booking", Icon: Truck },
  { key: "returnLoad", title: "Return Load Booking", to: "/return-load", Icon: ArrowLeftRight },
  { key: "quote", title: "Instant Freight Quote", to: "/tools/freight-rate-calculator", Icon: Calculator },
] as const;

export default function TransportServicePage() {
  const { city } = useParams<{ city: string }>();
  const data = city ? TRANSPORT_SERVICES[city.toLowerCase()] : undefined;

  if (!data) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#050816] flex items-center justify-center">
        <SeoMeta
          title="Transport Service Not Found | LoadSaathi"
          description="We don't have a transport service page for this city yet. Browse LoadSaathi part load and full truck booking services across East India."
          canonical="/transport-service"
          robots="noindex, nofollow"
        />
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-4xl font-black text-foreground mb-4">City Not Found</h1>
          <p className="text-muted-foreground mb-8">We don't have a transport service page for this city yet. Check back soon!</p>
          <Link to="/routes">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold">
              Browse All Routes
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const slug = (city || "").toLowerCase();
  const canonicalUrl = `/transport-service/${slug}`;
  const title = `Part Load Transport in ${data.name} - PTL & FTL Truck Booking | LoadSaathi`;
  const description = data.answer.substring(0, 160);

  const cityRoutes = routes.filter(
    (r) =>
      r.from.toLowerCase() === data.name.toLowerCase() ||
      r.to.toLowerCase() === data.name.toLowerCase()
  );

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `https://loadsaathi.in${canonicalUrl}`,
    isPartOf: { "@type": "WebSite", name: "LoadSaathi", url: "https://loadsaathi.in" },
    about: {
      "@type": "Place",
      name: data.name,
      address: { "@type": "PostalAddress", addressRegion: data.state, addressCountry: "IN" },
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.serviceFaq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "LoadSaathi",
    url: "https://loadsaathi.in",
    description: `Part load transport, PTL booking and FTL truck booking in ${data.name}, ${data.state}.`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-83289-98031",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    areaServed: [
      { "@type": "State", name: "Jharkhand" },
      { "@type": "State", name: "Odisha" },
      { "@type": "State", name: "West Bengal" },
    ],
  };

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h1>Part Load Transport in {data.name} | PTL &amp; Goods Booking</h1>
          <p>{data.lead}</p>
          <h2>Book part load and full truck transport in {data.name}</h2>
          <p>{data.answer}</p>
          <h2>Transport services we offer in {data.name}</h2>
          <ul>
            <li><strong>PTL Part Load:</strong> {data.serviceBlurbs.ptl}</li>
            <li><strong>FTL Full Truck:</strong> {data.serviceBlurbs.ftl}</li>
            <li><strong>Return Load Booking:</strong> {data.serviceBlurbs.returnLoad}</li>
            <li><strong>Instant Freight Quote:</strong> {data.serviceBlurbs.quote}</li>
          </ul>
          <h2>Typical freight rates from {data.name}</h2>
          <ul>
            {data.rateRanges.map((rr) => (
              <li key={rr.type}><strong>{rr.type}:</strong> {rr.range}</li>
            ))}
          </ul>
          <h2>Distance from {data.name} to Major Hubs</h2>
          <ul>
            {data.hubDistances.map((h) => (
              <li key={h.city}>{h.city}: {h.km} km</li>
            ))}
          </ul>
          <h2>Frequently Asked Questions — transport services in {data.name}</h2>
          {data.serviceFaq.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
          <p>
            <a href={`https://loadsaathi.in${canonicalUrl}`}>View this page</a> |{" "}
            <a href="https://loadsaathi.in/register">Book transport on LoadSaathi</a>
          </p>
        </div>
      </noscript>
      <SeoMeta
        title={title}
        description={description}
        keywords={`part load transport ${data.name.toLowerCase()}, PTL booking ${data.name.toLowerCase()}, truck booking ${data.name.toLowerCase()}, freight service ${data.name.toLowerCase()}`}
        canonical={canonicalUrl}
        jsonLd={[webPageSchema, faqSchema, localBusinessSchema]}
        breadcrumbs={[
          { name: "Routes", url: "/routes" },
          ...(data.locationSlug
            ? [{ name: data.name, url: `/location/${data.locationSlug}` }]
            : []),
          { name: `Transport Service ${data.name}`, url: canonicalUrl },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        {/* Hero */}
        <section className={`bg-gradient-to-br ${data.heroGradient} text-white py-20 px-6`}>
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
              <MapPin className="h-4 w-4" />
              <span>{data.state}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4">
              Part Load Transport in {data.name}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-[700px] mb-8">{data.lead}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors"
              >
                Start Shipping <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/tools/freight-rate-calculator"
                className="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Get Freight Quote <Calculator className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Answer */}
        <section className="py-16 px-6">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Book part load and full truck transport in {data.name}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">{data.answer}</p>
            <p className="text-xs text-muted-foreground">Last updated: 25 September 2026</p>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Transport services we offer in {data.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVICE_LINKS.map(({ key, title: serviceTitle, to, Icon }) => (
                <Link
                  key={key}
                  to={to}
                  className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="h-9 w-9 rounded-lg bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {serviceTitle}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {data.serviceBlurbs[key]}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-600 dark:text-orange-400">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Rate Ranges */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Typical freight rates from {data.name}
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Indicative market ranges. Get a precise quote for your lane with LoadSaathi's freight
              rate calculator.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.rateRanges.map((rr) => (
                <div
                  key={rr.type}
                  className="glass-card p-5 rounded-xl border border-border text-center"
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {rr.type}
                  </p>
                  <p className="text-xl font-bold text-foreground">{rr.range}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hub Distances */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Distance from {data.name} to Major Hubs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.hubDistances.map((hub) => (
                <div
                  key={hub.city}
                  className="glass-card p-5 rounded-xl border border-border text-center"
                >
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {hub.km} km
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">to {hub.city}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Industries served in {data.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.industries.map((industry) => (
                <div
                  key={industry}
                  className="glass-card p-4 rounded-xl border border-border text-center"
                >
                  <span className="text-sm font-semibold text-foreground">{industry}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commodities */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Key commodities shipped from {data.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.commodities.map((item) => (
                <div
                  key={item}
                  className="glass-card p-4 rounded-xl border border-border flex items-center gap-3"
                >
                  <Truck className="h-4 w-4 text-orange-500 shrink-0" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Routes */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Freight routes from {data.name}
            </h2>
            <p className="text-muted-foreground mb-8">
              {cityRoutes.length > 0
                ? `${cityRoutes.length} active corridors connecting ${data.name} to major cities across East India.`
                : "Direct corridor listings for this city are being added. You can still request a load on any lane."}
            </p>
            {cityRoutes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cityRoutes.map((route) => (
                  <Link
                    key={route.slug}
                    to={`/routes/${route.slug}`}
                    className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {route.from} → {route.to}
                      </span>
                      <ArrowRight className="h-4 w-4 text-orange-400 shrink-0" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" /> {route.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> ~{route.transitTime} hrs
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Routes coming soon.{" "}
                <Link to="/tools/freight-rate-calculator" className="text-orange-600 dark:text-orange-400 underline">
                  Request a quote for this lane
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6 bg-muted/50 dark:bg-white/[0.02]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Frequently Asked Questions — transport services in {data.name}
            </h2>
            <div className="space-y-4">
              {data.serviceFaq.map((faq, i) => (
                <div key={i} className="glass-card p-6 rounded-xl border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{faq.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Book your {data.name} transport on LoadSaathi
            </h2>
            <p className="text-muted-foreground mb-8">
              Compare truck types, rate ranges and verified trucker ratings for {data.name} before
              you confirm — no broker calls, no hidden charges.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/tools/freight-rate-calculator"
                className="border border-border hover:border-orange-500/30 text-foreground px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Freight Quote
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
