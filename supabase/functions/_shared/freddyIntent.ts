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

Example: "I need a truck from Bhubaneswar to Kolkata"
{"origin":"Bhubaneswar","destination":"Kolkata"}

Return ONLY the JSON object:`;
}

async function geminiIntent(
  prompt: string,
  deps: FreddyIntentDeps,
): Promise<LLMProviderResult> {
  const apiKey = deps.env?.("GEMINI_API_KEY") ?? Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };
  try {
    const fetchImpl = deps.fetchImpl ?? fetch;
    const res = await fetchImpl(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
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

  // Very naive city detection: look for known Indian city names in the message
  const indianCities = [
    "rourkela", "ranchi", "bhubaneswar", "kolkata", "jamshedpur", "cuttack",
    "sambalpur", "berhampur", "balasore", "jharsuguda", "angul", "dhanbad",
    "bilaspur", "bhilai", "vizag", "visakhapatnam", "bokaro", "asansol",
    "durgapur", "raipur", "bhilwara", "bokaro", "adra", "tatanagar",
  ];
  const lower = m.toLowerCase();
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
