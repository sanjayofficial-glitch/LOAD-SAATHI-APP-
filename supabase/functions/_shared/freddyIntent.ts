// Freddy intent parser — converts free-text user messages into
// search_market-compatible filters using an LLM, with a deterministic
// keyword fallback when no LLM provider is available.
//
// This module is pure (no side effects except the LLM fetch) so it can be
// tested network-free. All LLM output is validated through
// validateSearchMarketParams before reaching the database.

import {
  validateSearchMarketParams,
  type SearchMarketFilters,
} from "./searchMarket.ts";

// Hard cap on the LLM intent call so a hung Gemini request cannot hold the
// edge function invocation open. The deterministic keyword fallback covers
// the timeout path.
const GEMINI_FETCH_TIMEOUT_MS = 4_500;

interface LLMProviderResult {
  success: boolean;
  filters?: SearchMarketFilters;
  rateLimited?: boolean;
  raw?: string;
}

interface FreddyIntentDeps {
  fetchImpl?: typeof fetch;
  env?: (name: string) => string | undefined;
}

/** Build a strict system prompt that constrains the LLM to output only
 *  search_market-compatible JSON filters. */
function buildIntentPrompt(
  message: string,
  context?: string,
): string {
  const contextSection = context
    ? `\n\nRecent conversation context:\n${context}\n`
    : "";

  return `You convert a free-text freight search request into structured filters for an Indian trucking marketplace.

User message: "${message}"${contextSection}

Extract ONLY these fields if clearly present in the message:
- origin: city name where the truck/load starts
- destination: city name where the truck/load ends
- min_capacity_tonnes: minimum truck capacity in tonnes (number)
- max_price_per_tonne: maximum price per tonne in INR (number)
- vehicle_type: vehicle/container type if stated (e.g. "Container", "Trailer", "Tipper", "Open", "Closed")

Rules:
- Return ONLY valid JSON, no markdown, no explanation.
- Omit any field not clearly stated.
- City names: use common Indian city spellings (e.g. "Rourkela", "Ranchi", "Bhubaneswar", "Kolkata", "Jamshedpur").
- If the user says "under ₹X/tonne" or "max ₹X", set max_price_per_tonne to X.
- If the user says "at least X tonnes" or "X tonne truck", set min_capacity_tonnes to X.
- Use conversation context to resolve pronouns like "now under 3500" referring to a previous search.
- If no usable filters can be extracted, return {}.

Example: "Find trucks from Rourkela to Ranchi for 5 tonnes under 4000 per tonne"
{"origin":"Rourkela","destination":"Ranchi","min_capacity_tonnes":5,"max_price_per_tonne":4000}

Example: "I need a container truck from Bhubaneswar to Kolkata"
{"origin":"Bhubaneswar","destination":"Kolkata","vehicle_type":"Container"}

Return ONLY the JSON object:`;
}

async function geminiIntent(
  prompt: string,
  deps: FreddyIntentDeps,
): Promise<LLMProviderResult> {
  const env = deps.env ?? ((name: string) => undefined);
  const apiKey = env("GEMINI_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };
  try {
    const fetchImpl = deps.fetchImpl ?? fetch;
    const res = await fetchImpl(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(GEMINI_FETCH_TIMEOUT_MS),
      },
    );
    if (res.status === 429) return { success: false, rateLimited: true };
    if (!res.ok) return { success: false, rateLimited: res.status >= 500 };
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { success: false, rateLimited: false };
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { success: false, rateLimited: false, raw: cleaned };
    }
    return { success: true, filters: parsed as SearchMarketFilters, raw: cleaned };
  } catch {
    return { success: false, rateLimited: false };
  }
}

/** Deterministic keyword fallback — no LLM needed.
 *  Extracts city-like tokens, "under ₹N/tonne", "X tonnes" patterns. */
function keywordFallback(message: string): SearchMarketFilters {
  const filters: SearchMarketFilters = {};
  const m = message;

  // Price: "under ₹4000/tonne", "max 4000 per tonne", "below 4000"
  const priceMatch = m.match(/(?:under|max|maximum|below|≤|<)\s*₹?\s*([\d,]+)/i);
  if (priceMatch) {
    filters.max_price_per_tonne = Number(priceMatch[1].replace(/,/g, ""));
  }

  // Capacity: "5 tonnes", "5 ton", "at least 5t"
  const capMatch = m.match(/at least\s+(\d+)\s*(?:tonne|tons?|t)\b|(\d+)\s*(?:tonne|tons?|t)\b/i);
  if (capMatch) {
    const val = capMatch[1] ?? capMatch[2];
    filters.min_capacity_tonnes = Number(val);
  }

  // Vehicle / container type: "container", "trailer", "tipper", "open", "closed"
  const vehicleMatch = m.match(/\b(container|trailer|tipper|dumper|openbody|open\s+body|closed|covered)\b/i);
  if (vehicleMatch) {
    const raw = vehicleMatch[1].toLowerCase();
    if (raw.includes("container")) filters.vehicle_type = "Container";
    else if (raw.includes("trailer")) filters.vehicle_type = "Trailer";
    else if (raw.includes("tipper") || raw.includes("dumper")) filters.vehicle_type = "Tipper";
    else if (raw.includes("open")) filters.vehicle_type = "Open";
    else if (raw.includes("closed") || raw.includes("covered")) filters.vehicle_type = "Closed";
  }

  // Very naive city detection: look for known Indian city names in the message
  const indianCities = [
    "rourkela", "ranchi", "bhubaneswar", "kolkata", "jamshedpur", "cuttack",
    "sambalpur", "berhampur", "balasore", "jharsuguda", "angul", "dhanbad",
    "bilaspur", "bhilai", "vizag", "visakhapatnam", "bokaro", "asansol",
    "durgapur", "raipur", "bhilwara", "adra", "tatanagar", "cuttack",
    "hyderabad", "chennai", "bangalore", "mumbai", "delhi", "pune",
    "nagpur", "indore", "bhopal", "jaipur", "ahmedabad", "surat",
    "lucknow", "kanpur", "ghaziabad", "meerut", "patna", "muzaffarpur",
    "gaya", "bodh gaya", "varanasi", "allahabad", "coimbatore", "madurai",
    "trivandrum", "kochi", "goa", "panaji", "dehradun", "haridwar",
    "siliguri", "darjeeling", "guwahati", "shillong", "agartala",
    "imphal", "tripura", "ahmednagar", "solapur", "wardha", "yavatmal",
    "akola", "amravati", "jalgaon", "bhusawal", "jalna", "parbhani",
    "nanded", "latur", "osmanabad", "kolhapur", "sangli", "satara",
    "ratnagiri", "dhule", "nashik", "mathura", "bharatpur",
    "dholpur", "karauli", "alwar", "kishangarh", "pushkar", "beawar",
    "sikar", "tonk", "dungarpur", "banswara", "udaipur", "chittorgarh",
    "bharatpur", "dausa", "ajmer", "anand", "kheda", "vadodara",
    "bharuch", "narmada", "vapi", "navsari", "valsad", "tapi",
    "panchmahal", "mahisagar", "dahod", "sabarkantha", "aravalli",
    "gir somnath", "junagadh", "jamnagar", "morbi", "kutch", "bhuj",
    "gandhidham", "adipur", "pathankot", "hoshiarpur", "gurdaspur",
    "batala", "dhariwal", "jalandhar", "phagwara", "kapurthala",
    "ropar", "nawanshahr", "ludhiana", "srinagar", "haldwani",
    "kathgodam", "ramnagar", "nainital", "kashipur", "kichha",
    "mukteshwar", "dharchula", "pithoragarh", "bageshwar",
    "kotdwara", "rishikesh", "jhilmjhir", "hansapur", "rudrapur",
    "kotdwar", "pauri", "thakurdwar", "shakti",
    "agra", "bareilly", "lucknow", "varanasi", "kanpur", "allahabad",
    "dehradun", "haridwar", "haldwani", "kaladhungi", "nainital",
    "kashipur", "kichha", "pilibhit", "baheri", "shadipur",
    "budaun", "bisauli", "atrauliganj", "bilsi", "sadulpur",
    "kakori", "raibareli", " Sultanpur", "jhanjharpur",
    "samastipur", "muzaffarpur", "siwan", "saran", "gopalganj",
    "siwan", "bagaha", "harha", "piro", "socket", "jaltikri",
    "kaptanganj", "thawe", "barharia", "chhapra", "samastipur",
  ];
  const lower = m.toLowerCase();

  // "get help" / "i need help" / "what can you do" → no filters, handled as help
  if (lower.includes("get help") || lower.includes("i need help") ||
      lower.includes("help me") || lower.includes("how does this work") ||
      lower.includes("what can you do") || lower.includes("show me how") ||
      lower.includes("i'm new") || lower.includes("explain") ||
      lower.includes("guide me") || lower.includes("tutorial")) {
    return {};
  }

  const foundCities = indianCities.filter((c) => lower.includes(c));
  if (foundCities.length >= 1) filters.origin = foundCities[0]
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  if (foundCities.length >= 2) {
    filters.destination = foundCities[1]
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return filters;
}

/** Detect credit-score related queries. */
export function isCreditScoreQuery(message: string): boolean {
  const lower = message.toLowerCase();
  const creditKeywords = [
    "credit score", "creditscore", "my score", "score", "rating",
    "credit insight", "why is my score", "improve my score", "credit check",
  ];
  return creditKeywords.some((kw) => lower.includes(kw));
}

/**
 * Detect trucker-side shipment-search requests ("find goods/loads to haul")
 * vs. shipper-side truck/load searches. Deterministic keyword heuristic;
 * used by agent-router to choose between search_shipments and search_market
 * when no explicit filters object was supplied.
 */
export function isShipmentSearchRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const shipmentKeywords = [
    "shipment", "shipments", "load", "loads", "goods", "cargo",
    "freight", "material", "goods to carry", "something to haul",
    "haul", "transport for my truck", "find work for my truck",
    "have a truck", "my truck", "truck is empty", "empty truck",
    "earn", "income", "find work", "find something to carry",
    "pickup", "pick up goods",
  ];
  // Shipper-side signals win: if the user explicitly wants a truck/vehicle,
  // treat it as a market (trip) search, not a shipment search.
  const truckSignals = [
    "truck", "vehicle", "capacity", "lorry", "transporter",
    "transport my goods", "move my goods", "ship my goods",
  ];
  if (truckSignals.some((kw) => lower.includes(kw))) return false;
  return shipmentKeywords.some((kw) => lower.includes(kw));
}

/** Parse a free-text message into search_market filters.
 *  Tries LLM first, falls back to keyword parsing. Result is always
 *  validated through validateSearchMarketParams. */
export async function parseFreddyIntent(
  message: string,
  deps: FreddyIntentDeps = {},
  context?: string,
): Promise<{
  filters: SearchMarketFilters;
  source: "llm" | "fallback" | "empty";
  raw?: string;
}> {
  if (!message || !message.trim()) {
    return { filters: {}, source: "empty" };
  }

  const prompt = buildIntentPrompt(message.trim(), context);

  // Try LLM first
  const llmResult = await geminiIntent(prompt, deps);
  if (llmResult.success && llmResult.filters) {
    const validated = validateSearchMarketParams(llmResult.filters);
    if (validated.ok) {
      return { filters: validated.filters, source: "llm", raw: llmResult.raw };
    }
    // LLM produced invalid filters — fall through to keyword fallback
  }

  // Deterministic fallback
  const fallbackFilters = keywordFallback(message.trim());
  const validated = validateSearchMarketParams(fallbackFilters);
  if (validated.ok && (validated.filters.origin || validated.filters.destination)) {
    return { filters: validated.filters, source: "fallback" };
  }

  return { filters: {}, source: "empty" };
}
