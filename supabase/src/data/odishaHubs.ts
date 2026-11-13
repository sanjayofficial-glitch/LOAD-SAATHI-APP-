/**
 * Odisha industrial-hub landing-page content, keyed by slug.
 *
 * Lives here (not in OdishaHubDetail.tsx) so non-page consumers — the HTML
 * sitemap scripts, llms.txt generators, smoke tests — can read it without
 * importing a component module.
 *
 * Rate bands are NOT hardcoded: they are derived from the same canonical
 * rateBand() model (supabase/src/data/routes.ts) the fare calculator uses,
 * so a hub page can never contradict the calculator or the corridor guide.
 */

import { rateBand, formatINR } from "@/data/routes";

export interface OdishaCorridorRow {
  /** Drop / hub city for this corridor from the hub. */
  destination: string;
  highway: string;
  distanceKm: number;
  /** Human transit window, e.g. "4–6 hrs". */
  transit: string;
  truckTypes: string[];
}

export interface OdishaHub {
  slug: string;
  name: string;
  state: string;
  tagline: string;
  intro: string;
  heroGradient: string;
  industries: string[];
  commodities: string[];
  corridors: OdishaCorridorRow[];
  /** Slugs of existing /routes/* pages relevant to this belt. */
  relatedRoutes: string[];
  localFaq: { q: string; a: string }[];
}

/** FTL + PTL band strings for a lane distance, from the canonical rate model. */
export function hubBandText(distanceKm: number): { ftl: string; ptl: string } {
  const b = rateBand({ distanceKm });
  return {
    ftl: `₹${formatINR(b.perTruckMin)}–₹${formatINR(b.perTruckMax)}`,
    ptl: `₹${formatINR(b.perTonneMin)}–₹${formatINR(b.perTonneMax)}/tonne`,
  };
}

export const odishaHubs: Record<string, OdishaHub> = {
  "kalinganagar-jajpur": {
    slug: "kalinganagar-jajpur",
    name: "Kalinganagar & Jajpur",
    state: "Odisha",
    tagline: "Steel, TMT & ferro-alloy freight belt",
    intro:
      "Dispatch steel coils, TMT bars, ferro-alloys, sponge iron, and industrial machinery from Kalinganagar Industrial Complex, Duburi, and Jajpur Road with KYC-verified Odisha fleet owners. LoadSaathi's AI route matching pairs outbound cargo with returning heavy trucks on NH-16 and NH-53, cutting freight cost by up to 40% with zero broker markups.",
    heroGradient: "from-slate-700 to-orange-700",
    industries: ["Steel & TMT", "Ferro-Alloys", "Sponge Iron", "Industrial Machinery"],
    commodities: ["Steel coils", "TMT bars", "Sponge iron", "Pig iron", "Ferro-chrome", "Heavy machinery"],
    corridors: [
      { destination: "Paradeep Port", highway: "NH-53", distanceKm: 115, transit: "4–6 hrs", truckTypes: ["12-Wheeler Taurus", "Trailer"] },
      { destination: "Bhubaneswar / Cuttack", highway: "NH-16", distanceKm: 105, transit: "3–5 hrs", truckTypes: ["14ft", "19ft", "Taurus"] },
      { destination: "Kolkata / Haldia", highway: "NH-16", distanceKm: 355, transit: "10–14 hrs", truckTypes: ["22ft", "32ft MXL", "Trailer"] },
      { destination: "Rourkela", highway: "NH-53 / NH-143", distanceKm: 340, transit: "10–13 hrs", truckTypes: ["12-Wheeler Taurus", "32ft MXL"] },
      { destination: "Jamshedpur", highway: "NH-16 / NH-18", distanceKm: 245, transit: "7–9 hrs", truckTypes: ["19ft", "Taurus", "Trailer"] },
      { destination: "Visakhapatnam", highway: "NH-16", distanceKm: 535, transit: "15–18 hrs", truckTypes: ["32ft MXL", "40ft Trailer"] },
    ],
    relatedRoutes: [
      "bhubaneswar-to-kolkata",
      "kolkata-to-bhubaneswar",
      "jamshedpur-to-bhubaneswar",
      "bhubaneswar-to-jamshedpur",
      "rourkela-to-bhubaneswar",
      "bhubaneswar-to-rourkela",
      "rourkela-to-kolkata",
      "bhubaneswar-to-vizag",
    ],
    localFaq: [
      { q: "What trucks are available at Kalinganagar / Duburi for steel transport?", a: "14ft Eicher, 19ft/22ft open and container trucks, 32ft MXL containers, 12-Wheeler Taurus (21T–25T), and 40ft flatbed trailers are available at Duburi and Jajpur Road for steel coils, TMT bars, and sponge iron." },
      { q: "How do I book a return load from Kalinganagar to Paradeep or Kolkata?", a: "Message +91-83289-98031 on WhatsApp or enter your route on loadsaathi.in/tools/fare-calculator. Trucks unloading raw material at Duburi steel plants are matched with outbound finished steel immediately." },
      { q: "What is the Kalinganagar to Paradeep truck rate?", a: "Indicative FTL rates for Kalinganagar → Paradeep (≈115 km, NH-53) run around ₹9,800–₹13,800 for a full truck; PTL shipments cost about ₹1,955–₹2,760 per tonne. Confirm exact rates on the fare calculator." },
    ],
  },
  paradeep: {
    slug: "paradeep",
    name: "Paradeep",
    state: "Odisha",
    tagline: "Port & bulk-cargo gateway",
    intro:
      "Paradeep Port is Odisha's largest deep-water port, moving coal, iron ore, fertilizers, and container cargo. LoadSaathi connects port-bound and port-origin freight with verified trucks of NH-53 and NH-16 — E-Way Bill-ready, with digital LR/bilty and live tracking for import/export dispatches.",
    heroGradient: "from-blue-700 to-cyan-700",
    industries: ["Ports & Bulk Cargo", "Chemicals & Fertilizers", "Coal Handling", "Fisheries & Cold Chain"],
    commodities: ["Coal & coke", "Iron ore fines", "Fertilizers", "Edible oil", "Seafood cold chain", "Container cargo"],
    corridors: [
      { destination: "Bhubaneswar", highway: "NH-53", distanceKm: 90, transit: "2–3 hrs", truckTypes: ["14ft", "19ft", "Taurus"] },
      { destination: "Cuttack", highway: "NH-53", distanceKm: 100, transit: "2–3 hrs", truckTypes: ["14ft", "19ft"] },
      { destination: "Kolkata", highway: "NH-53 / NH-16", distanceKm: 400, transit: "11–14 hrs", truckTypes: ["22ft", "32ft MXL", "Trailer"] },
      { destination: "Rourkela", highway: "NH-53 / NH-143", distanceKm: 420, transit: "12–15 hrs", truckTypes: ["12-Wheeler Taurus", "Trailer"] },
      { destination: "Visakhapatnam", highway: "NH-16", distanceKm: 380, transit: "11–14 hrs", truckTypes: ["32ft MXL", "40ft Trailer"] },
    ],
    relatedRoutes: [
      "bhubaneswar-to-kolkata",
      "kolkata-to-bhubaneswar",
      "bhubaneswar-to-vizag",
      "visakhapatnam-to-bhubaneswar",
      "balasore-to-bhubaneswar",
      "berhampur-to-bhubaneswar",
      "rourkela-to-kolkata",
    ],
    localFaq: [
      { q: "Can LoadSaathi handle Paradeep Port container and bulk cargo?", a: "Yes. Paradeep port-bound and port-origin container, coal, ore, and fertilizer cargo is matched with verified port-experienced truckers; documentation, E-Way Bill, and digital LR/bilty are included." },
      { q: "What is the Paradeep to Bhubaneswar truck rate?", a: "Indicative FTL for Paradeep → Bhubaneswar (≈90 km, NH-53) is about ₹7,650–₹10,800 per full truck; PTL around ₹1,530–₹2,160 per tonne. Use the fare calculator for a live quote." },
      { q: "Which truck types are available at Paradeep port?", a: "14ft and 19ft trucks for port town distribution, 22ft and 32ft MXL containers for containerized cargo, and 12-Wheeler Taurus / trailers for bulk coal, ore, and project cargo." },
    ],
  },
  "keonjhar-barbil": {
    slug: "keonjhar-barbil",
    name: "Keonjhar & Barbil",
    state: "Odisha",
    tagline: "Iron-ore & minerals belt",
    intro:
      "Barbil and Keonjhar are the heart of Odisha's iron-ore mining belt. LoadSaathi connects mine operators, crusher plants, and pellet units with heavy haulage — 12-Wheeler Taurus, trailers, and 32ft MXL — for ore, fines, and pellet movement toward Jharsuguda, Rourkela, Angul, and Paradeep Port.",
    heroGradient: "from-stone-700 to-yellow-700",
    industries: ["Iron Ore Mining", "Pellets", "Sponge Iron", "Forest Products"],
    commodities: ["Iron ore lump & fines", "Pellets", "Sponge iron", "Manganese ore", "Timber & bamboo"],
    corridors: [
      { destination: "Jharsuguda", highway: "NH-49", distanceKm: 110, transit: "3–4 hrs", truckTypes: ["12-Wheeler Taurus", "Trailer"] },
      { destination: "Sambalpur", highway: "NH-49", distanceKm: 140, transit: "3–5 hrs", truckTypes: ["19ft", "Taurus"] },
      { destination: "Rourkela", highway: "NH-215 / NH-143", distanceKm: 130, transit: "3–5 hrs", truckTypes: ["Taurus", "Trailer"] },
      { destination: "Angul / Talcher", highway: "NH-215", distanceKm: 150, transit: "4–5 hrs", truckTypes: ["Taurus", "Trailer"] },
      { destination: "Paradeep Port", highway: "NH-215 / NH-53", distanceKm: 260, transit: "7–9 hrs", truckTypes: ["Trailer", "40ft Flatbed"] },
    ],
    relatedRoutes: [
      "sambalpur-to-jharsuguda",
      "jharsuguda-to-sambalpur",
      "rourkela-to-sambalpur",
      "sambalpur-to-rourkela",
      "rourkela-to-bhubaneswar",
      "sambalpur-to-bhubaneswar",
    ],
    localFaq: [
      { q: "Which trucks move iron ore from Barbil?", a: "Heavy haulage is standard on this belt: 12-Wheeler Taurus (21T–25T), 40ft flatbed trailers, and 32ft MXL containers. LoadSaathi verifies RC and driver KYC before dispatch." },
      { q: "What is the Barbil to Jharsuguda truck rate?", a: "Indicative FTL for Barbil → Jharsuguda (≈110 km, NH-49) is about ₹9,350–₹13,200 per full truck; PTL around ₹1,870–₹2,640 per tonne. Get a live quote on the fare calculator." },
      { q: "How do mine operators find return loads from Keonjhar?", a: "Register vehicle RC and route preference on LoadSaathi to receive direct return-load alerts toward Jharsuguda, Rourkela, Angul, and Paradeep with zero broker commission." },
    ],
  },
  "talcher-angul": {
    slug: "talcher-angul",
    name: "Talcher & Angul",
    state: "Odisha",
    tagline: "Coal, aluminium & power hub",
    intro:
      "Talcher–Angul is Odisha's energy and heavy-industry pivot — thermal power, coal mining, and NALCO's aluminium smelter. LoadSaathi provides dedicated and return-load haulage for coal, fly ash, aluminium ingots, and project cargo across NH-53, NH-23, and NH-55.",
    heroGradient: "from-amber-700 to-orange-700",
    industries: ["Coal & Thermal Power", "Aluminium Smelting", "Heavy Engineering", "Cement"],
    commodities: ["Thermal coal", "Fly ash", "Aluminium ingots", "Cement", "Power-plant equipment"],
    corridors: [
      { destination: "Paradeep Port", highway: "NH-53", distanceKm: 180, transit: "4–6 hrs", truckTypes: ["12-Wheeler Taurus", "Trailer"] },
      { destination: "Sambalpur", highway: "NH-23", distanceKm: 120, transit: "3–4 hrs", truckTypes: ["19ft", "Taurus"] },
      { destination: "Bhubaneswar", highway: "NH-53", distanceKm: 140, transit: "3–5 hrs", truckTypes: ["14ft", "19ft", "Taurus"] },
      { destination: "Rourkela", highway: "NH-23 / NH-143", distanceKm: 260, transit: "7–9 hrs", truckTypes: ["Taurus", "Trailer"] },
      { destination: "Cuttack", highway: "NH-53", distanceKm: 110, transit: "3–4 hrs", truckTypes: ["14ft", "19ft"] },
    ],
    relatedRoutes: [
      "sambalpur-to-bhubaneswar",
      "bhubaneswar-to-sambalpur",
      "rourkela-to-sambalpur",
      "sambalpur-to-rourkela",
      "cuttack-to-bhubaneswar",
      "rourkela-to-cuttack",
      "cuttack-to-rourkela",
    ],
    localFaq: [
      { q: "What truck types serve Talcher coal and power plants?", a: "12-Wheeler Taurus and trailers dominate for coal and fly ash; 14ft/19ft trucks handle local plant consumables. All fleet is KYC-verified and E-Way Bill ready." },
      { q: "What is the Angul to Paradeep truck rate?", a: "Indicative FTL for Angul → Paradeep (≈180 km, NH-53) is about ₹15,300–₹21,600 per full truck; PTL around ₹3,060–₹4,320 per tonne. Confirm live rates on the fare calculator." },
      { q: "Can LoadSaathi move aluminium ingots from NALCO Angul?", a: "Yes — dedicated trailers and Taurus trucks with proper lashing handle ingot freight to Bhubaneswar, Kolkata, and Paradeep, with digital LR/bilty and live tracking." },
    ],
  },
  dhenkanal: {
    slug: "dhenkanal",
    name: "Dhenkanal",
    state: "Odisha",
    tagline: "Agro, cement & ceramic corridor",
    intro:
      "Dhenkanal sits on NH-55 between Bhubaneswar and Angul — a fast-growing corridor for agro processing, cement, ceramics, and foundry goods. LoadSaathi matches these mid-sized loads with 14ft–22ft trucks plus return loads headed back to coastal Odisha.",
    heroGradient: "from-green-700 to-emerald-700",
    industries: ["Agro & Food Processing", "Cement & Ceramics", "Foundry & Engineering", "Bamboo & Forest"],
    commodities: ["Rice & paddy", "Cement", "Ceramic tiles", "Cast-iron castings", "Bamboo products"],
    corridors: [
      { destination: "Bhubaneswar", highway: "NH-55", distanceKm: 70, transit: "2 hrs", truckTypes: ["14ft", "19ft"] },
      { destination: "Cuttack", highway: "NH-55", distanceKm: 55, transit: "1.5–2 hrs", truckTypes: ["14ft", "19ft"] },
      { destination: "Angul / Talcher", highway: "NH-55", distanceKm: 45, transit: "1–1.5 hrs", truckTypes: ["14ft", "19ft"] },
      { destination: "Rourkela", highway: "NH-53 / NH-143", distanceKm: 250, transit: "6–8 hrs", truckTypes: ["19ft", "Taurus"] },
      { destination: "Paradeep Port", highway: "NH-55 / NH-53", distanceKm: 160, transit: "4–5 hrs", truckTypes: ["19ft", "22ft"] },
    ],
    relatedRoutes: [
      "cuttack-to-bhubaneswar",
      "bhubaneswar-to-cuttack",
      "sambalpur-to-bhubaneswar",
      "rourkela-to-cuttack",
      "cuttack-to-rourkela",
      "bhubaneswar-to-kolkata",
    ],
    localFaq: [
      { q: "What trucks are available in Dhenkanal for agro freight?", a: "14ft and 19ft trucks are the workhorses for rice, paddy, and FMCG; 22ft open/container trucks handle cement and ceramic loads to Bhubaneswar, Cuttack, and Angul." },
      { q: "What is the Dhenkanal to Bhubaneswar truck rate?", a: "Indicative FTL for Dhenkanal → Bhubaneswar (≈70 km, NH-55) is about ₹5,950–₹8,400 per full truck; PTL around ₹1,200–₹1,680 per tonne. Get a live quote on the fare calculator." },
      { q: "How do Dhenkanal shippers save on return freight?", a: "LoadSaathi pairs outbound agro/cement cargo with trucks returning empty from coastal Odisha, cutting freight cost by up to 40% with verified fleet only." },
    ],
  },
  "rayagada-koraput": {
    slug: "rayagada-koraput",
    name: "Rayagada & Koraput",
    state: "Odisha",
    tagline: "Bauxite & agro-industrial South",
    intro:
      "Rayagada and Koraput anchor South Odisha's bauxite, aluminium, and agro economy. LoadSaathi connects NALCO-linked and maize/agro shippers with verified trucks to Berhampur, Bhubaneswar, and Visakhapatnam over NH-326, NH-26, and NH-16.",
    heroGradient: "from-purple-700 to-indigo-700",
    industries: ["Bauxite & Aluminium", "Maize & Agro", "Mining", "Handloom & Tribal Produce"],
    commodities: ["Bauxite", "Aluminium products", "Maize", "Cotton", "Tribal forest produce"],
    corridors: [
      { destination: "Berhampur / Ganjam", highway: "NH-326", distanceKm: 120, transit: "3–4 hrs", truckTypes: ["14ft", "19ft", "Taurus"] },
      { destination: "Visakhapatnam", highway: "NH-26", distanceKm: 160, transit: "4–5 hrs", truckTypes: ["19ft", "Taurus"] },
      { destination: "Koraput", highway: "NH-326", distanceKm: 110, transit: "3–4 hrs", truckTypes: ["14ft", "19ft"] },
      { destination: "Bhubaneswar", highway: "NH-326 / NH-16", distanceKm: 370, transit: "9–12 hrs", truckTypes: ["22ft", "32ft MXL"] },
      { destination: "Paradeep Port", highway: "NH-326 / NH-16", distanceKm: 430, transit: "11–14 hrs", truckTypes: ["Taurus", "Trailer"] },
    ],
    relatedRoutes: [
      "berhampur-to-bhubaneswar",
      "bhubaneswar-to-berhampur",
      "bhubaneswar-to-vizag",
      "visakhapatnam-to-bhubaneswar",
      "bhubaneswar-to-kolkata",
    ],
    localFaq: [
      { q: "What trucks are available in Rayagada for bauxite and agro loads?", a: "14ft/19ft trucks cover agro and local distribution; 12-Wheeler Taurus and trailers handle bauxite, ore, and project loads toward Visakhapatnam and Paradeep." },
      { q: "What is the Rayagada to Visakhapatnam truck rate?", a: "Indicative FTL for Rayagada → Visakhapatnam (≈160 km, NH-26) is about ₹13,600–₹19,200 per full truck; PTL around ₹2,720–₹3,840 per tonne. Confirm live rates on the fare calculator." },
      { q: "Does LoadSaathi cover Koraput's mining and agro freight?", a: "Yes — verified fleet and multi-load matching are available for bauxite, maize, and forest produce across NH-326 and NH-26, with E-Way Bill-ready documentation." },
    ],
  },
};

/** All 30 Odisha districts for hub-page entity coverage. */
export const odishaDistricts: { name: string; industry: string }[] = [
  { name: "Angul", industry: "Coal, aluminium & power" },
  { name: "Balangir", industry: "Agro & paddy" },
  { name: "Balasore", industry: "NH-16 industrial & seafood" },
  { name: "Bargarh", industry: "Rice & agro processing" },
  { name: "Bhadrak", industry: "Cement & agro" },
  { name: "Boudh", industry: "Agro & forest" },
  { name: "Cuttack", industry: "Commercial & industrial hub" },
  { name: "Debagarh", industry: "Forest & agro" },
  { name: "Dhenkanal", industry: "Agro, cement & ceramics" },
  { name: "Gajapati", industry: "Agro & handloom" },
  { name: "Ganjam", industry: "Berhampur & Gopalpur trade" },
  { name: "Jagatsinghpur", industry: "Paradeep Port & seafood" },
  { name: "Jajpur", industry: "Kalinganagar steel & ferro-alloys" },
  { name: "Jharsuguda", industry: "Aluminium, power & mining" },
  { name: "Kalahandi", industry: "Agro & forest produce" },
  { name: "Kandhamal", industry: "Turmeric & forest" },
  { name: "Kendrapara", industry: "Fisheries & paddy" },
  { name: "Keonjhar", industry: "Iron ore & mining" },
  { name: "Khordha", industry: "Bhubaneswar distribution hub" },
  { name: "Koraput", industry: "Bauxite & agro" },
  { name: "Malkangiri", industry: "Agro & tribal produce" },
  { name: "Mayurbhanj", industry: "Mining & agro" },
  { name: "Nabarangpur", industry: "Maize & agro" },
  { name: "Nayagarh", industry: "Agro & small industry" },
  { name: "Nuapada", industry: "Agro & transit corridor" },
  { name: "Puri", industry: "Tourism supply chain" },
  { name: "Rayagada", industry: "Bauxite, aluminium & maize" },
  { name: "Sambalpur", industry: "Hirakud & western logistics" },
  { name: "Subarnapur (Sonepur)", industry: "Agro & bullion trade" },
  { name: "Sundargarh", industry: "Rourkela steel & sponge iron" },
];

/** 30-district + key-hub options for the OdishaLeadWidget pickup dropdown. */
export const odishaCityOptions: string[] = [
  // Key industrial hubs first — highest search intent for freight leads
  "Rourkela",
  "Bhubaneswar",
  "Cuttack",
  "Jharsuguda",
  "Sambalpur",
  "Angul",
  "Talcher",
  "Balasore",
  "Berhampur",
  "Paradeep",
  "Kalinganagar",
  "Jajpur Road",
  "Barbil",
  "Keonjhar",
  "Dhenkanal",
  "Rayagada",
  "Koraput",
  // Remaining district headquarters
  "Bargarh",
  "Bhadrak",
  "Bolangir",
  "Boudh",
  "Debagarh",
  "Ganjam",
  "Jagatsinghpur",
  "Kalahandi",
  "Kandhamal",
  "Kendrapara",
  "Khordha",
  "Malkangiri",
  "Mayurbhanj",
  "Nabarangpur",
  "Nayagarh",
  "Nuapada",
  "Puri",
  "Subarnapur",
  "Sundargarh",
];
