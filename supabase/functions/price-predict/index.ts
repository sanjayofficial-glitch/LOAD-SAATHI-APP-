import {
  applyFuelSurcharge,
  getReturnFactor,
  calculatePtl,
  DEFAULT_CONFIG,
  DEFAULT_SURCHARGE_CONFIG,
  type SurchargeConfig,
  type PricingConfig,
} from "./pricing.ts";
import { getCorsHeaders, checkRateLimit, getRequestIp, extractBearerToken, verifyJwt, errorResponse, optionsResponse, generateRequestId } from "../_shared/edgeHelpers.ts";
import { fetchOsrmDistance } from "../_shared/osrm.ts";
import { getLatestFuelPrice } from "../_shared/fuel.ts";

function getEnv(name: string): string {
  return Deno.env.get(name) ?? "";
}

// ─── Types ──────────────────────────────────────────────────

interface PricePredictRequest {
  originCity: string;
  destinationCity: string;
  originState?: string;
  destinationState?: string;
  weightTonnes: number;
  vehicleType?: string;
  vehicleClass?: string;
  shipmentMode?: "ptl" | "ftl";
  dimensions?: { l: number; b: number; h: number };
  includeFuelSurcharge?: boolean;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
}

interface HistoryRow {
  price_per_tonne: number;
  weight_tonnes: number;
  created_at: string;
  median_price: number | null;
  p25_price: number | null;
  p75_price: number | null;
  iqr_price: number | null;
  record_count: number | null;
}

interface PriceResult {
  recommendedPrice: number;
  range: { min: number; max: number };
  confidence: "high" | "medium" | "low";
  trend: "rising" | "falling" | "stable";
  reasoning: string;
}

interface PriceBreakdown {
  baseFreight: number;
  fuel: number;
  toll: number;
  driver: number;
  returnAdjustment: number;
}

interface ExtendedPriceResult extends PriceResult {
  fuelSurcharge?: number;
  returnFactor?: number;
  perKmRate?: number;
  breakdown?: PriceBreakdown;
}

interface ProviderResult {
  success: boolean;
  data?: PriceResult & { provider?: string };
  rateLimited?: boolean;
}

interface PricingFlags {
  enable_ai: boolean;
  enable_history: boolean;
  enable_corridor: boolean;
  enable_config: boolean;
  enable_seasonal: boolean;
  enable_blending: boolean;
  enable_fuel_surcharge: boolean;
  enable_return_factor: boolean;
}

// ─── Defaults ───────────────────────────────────────────────

const DEFAULT_FLAGS: PricingFlags = {
  enable_ai: true,
  enable_history: true,
  enable_corridor: true,
  enable_config: true,
  enable_seasonal: true,
  enable_blending: true,
  enable_fuel_surcharge: true,
  enable_return_factor: true,
};

const SEASONAL_DEFAULTS: Record<number, number> = {
  1: 1.02, 2: 0.98, 3: 1.0, 4: 0.97, 5: 0.96, 6: 1.08,
  7: 1.1, 8: 1.07, 9: 1.03, 10: 1.05, 11: 1.04, 12: 1.06,
};

// ─── Config Loaders ─────────────────────────────────────────

async function loadFeatureFlags(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<PricingFlags> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/pricing_flags?select=flag_name,enabled`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return DEFAULT_FLAGS;
    const rows: { flag_name: string; enabled: boolean }[] = await res.json();
    const map = Object.fromEntries(rows.map((r) => [r.flag_name, r.enabled]));
    return {
      enable_ai: map.enable_ai ?? true,
      enable_history: map.enable_history ?? true,
      enable_corridor: map.enable_corridor ?? true,
      enable_config: map.enable_config ?? true,
      enable_seasonal: map.enable_seasonal ?? true,
      enable_blending: map.enable_blending ?? true,
      enable_fuel_surcharge: map.enable_fuel_surcharge ?? true,
      enable_return_factor: map.enable_return_factor ?? true,
    };
  } catch {
    return DEFAULT_FLAGS;
  }
}

async function loadPricingConfig(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<PricingConfig[]> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/pricing_config?select=vehicle_type,rate_per_km,min_price,max_price,base_capacity_tonnes`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return DEFAULT_CONFIG;
    const rows: PricingConfig[] = await res.json();
    return rows.length > 0 ? rows : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function loadCorridorMultiplier(
  supabaseUrl: string,
  supabaseKey: string,
  originState: string,
  destState: string,
): Promise<number> {
  if (!originState || !destState) return 1.0;
  try {
    const url =
      `${supabaseUrl}/rest/v1/corridor_multipliers?select=multiplier` +
      `&origin_state=eq.${encodeURIComponent(originState)}` +
      `&destination_state=eq.${encodeURIComponent(destState)}`;
    const res = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return 1.0;
    const rows: { multiplier: number }[] = await res.json();
    return rows.length > 0 ? rows[0].multiplier : 1.0;
  } catch {
    return 1.0;
  }
}

async function loadSeasonalMultiplier(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<number> {
  const month = new Date().getMonth() + 1;
  try {
    const url = `${supabaseUrl}/rest/v1/seasonal_multipliers?select=multiplier&month=eq.${month}`;
    const res = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return SEASONAL_DEFAULTS[month] ?? 1.0;
    const rows: { multiplier: number }[] = await res.json();
    return rows.length > 0 ? rows[0].multiplier : SEASONAL_DEFAULTS[month] ?? 1.0;
  } catch {
    return SEASONAL_DEFAULTS[month] ?? 1.0;
  }
}

// ─── Fuel Surcharge & Return Factor Loaders ──────────────────

async function loadSurchargeConfig(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<SurchargeConfig> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/pricing_surcharge_config?select=base_diesel_price,surcharge_per_rupee,base_diesel_date&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return DEFAULT_SURCHARGE_CONFIG;
    const rows: SurchargeConfig[] = await res.json();
    return rows.length > 0 ? {
      base_diesel_price: Number(rows[0].base_diesel_price),
      surcharge_per_rupee: Number(rows[0].surcharge_per_rupee),
    } : DEFAULT_SURCHARGE_CONFIG;
  } catch {
    return DEFAULT_SURCHARGE_CONFIG;
  }
}

async function loadReturnFactors(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/route_return_factor?select=origin_state,destination_state,factor`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return {};
    const rows: { origin_state: string; destination_state: string; factor: number }[] = await res.json();
    const map: Record<string, number> = {};
    for (const r of rows) {
      const key = `${r.origin_state.toLowerCase()}|${r.destination_state.toLowerCase()}`;
      map[key] = Number(r.factor);
    }
    return map;
  } catch {
    return {};
  }
}

// ─── History Query ──────────────────────────────────────────

interface HistoryStats {
  rows: HistoryRow[];
  loads: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  iqr: number | null;
  avg: number | null;
}

async function fetchHistory(
  supabaseUrl: string,
  supabaseKey: string,
  originCity: string,
  destCity: string,
): Promise<HistoryStats> {
  const empty: HistoryStats = { rows: [], loads: 0, median: null, p25: null, p75: null, iqr: null, avg: null };
  try {
    const url = `${supabaseUrl}/rest/v1/rpc/get_route_history`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ p_origin: originCity, p_dest: destCity }),
    });
    if (!res.ok) return empty;
    const rows: HistoryRow[] = await res.json();
    if (rows.length === 0) return empty;

    const firstRow = rows[0];
    const prices = rows.map((r) => r.price_per_tonne).filter((p) => p != null);

    return {
      rows,
      loads: firstRow.record_count ?? prices.length,
      median: firstRow.median_price ?? null,
      p25: firstRow.p25_price ?? null,
      p75: firstRow.p75_price ?? null,
      iqr: firstRow.iqr_price ?? null,
      avg: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
    };
  } catch {
    return empty;
  }
}

async function fetchCorridorAverage(
  supabaseUrl: string,
  supabaseKey: string,
  originState: string,
  destState: string,
): Promise<number | null> {
  if (!originState || !destState) return null;
  try {
    const url = `${supabaseUrl}/rest/v1/rpc/get_corridor_average`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ p_origin_state: originState, p_dest_state: destState }),
    });
    if (!res.ok) return null;
    const avg: number = await res.json();
    return avg ? Math.round(avg) : null;
  } catch {
    return null;
  }
}

// ─── AI Providers (unchanged) ───────────────────────────────

function buildPrompt(body: PricePredictRequest, historyInfo: string, distanceInfo: string): string {
  return `You are a logistics pricing expert for the Indian freight market.
Given the following shipment details, suggest a fair price per tonne in INR.

Route: ${body.originCity}${body.originState ? `, ${body.originState}` : ""} → ${body.destinationCity}${body.destinationState ? `, ${body.destinationState}` : ""}
Weight: ${body.weightTonnes} tonnes
  Vehicle Type: ${body.vehicleType || body.vehicleClass || "Not specified"}
${distanceInfo}
${historyInfo}

Return ONLY a JSON object (no markdown, no explanation outside the JSON):
{
  "recommendedPrice": number,
  "range": { "min": number, "max": number },
  "confidence": "high" | "medium" | "low",
  "trend": "rising" | "falling" | "stable",
  "reasoning": "one-line explanation based on data"
}

Consider: route distance, seasonal factors, typical Indian freight rates, vehicle capacity. Return factual reasoning.`;
}

function parseAIResponse(text: string): PriceResult | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function geminiProvider(body: PricePredictRequest, prompt: string): Promise<ProviderResult> {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent`,
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
    const parsed = parseAIResponse(text);
    if (!parsed) return { success: false, rateLimited: false };
    return { success: true, data: parsed };
  } catch {
    return { success: false, rateLimited: false };
  }
}

async function groqProvider(body: PricePredictRequest, prompt: string): Promise<ProviderResult> {
  const apiKey = getEnv("GROQ_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 500,
      }),
    });
    if (res.status === 429) return { success: false, rateLimited: true };
    if (!res.ok) return { success: false, rateLimited: false };
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return { success: false, rateLimited: false };
    const parsed = parseAIResponse(text);
    if (!parsed) return { success: false, rateLimited: false };
    return { success: true, data: parsed };
  } catch {
    return { success: false, rateLimited: false };
  }
}

async function openRouterProvider(body: PricePredictRequest, prompt: string): Promise<ProviderResult> {
  const apiKey = getEnv("OPENROUTER_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };
  const models = [
    "cognitivecomputations/dolphin3.0-mistral-24b:free",
    "microsoft/phi-3-mini-4k-instruct:free",
  ];
  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://loadsaathi.in",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: `${prompt}\n\nReturn ONLY valid JSON.` }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });
      if (res.status === 429) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) continue;
      const parsed = parseAIResponse(text);
      if (parsed) return { success: true, data: parsed };
    } catch {
      continue;
    }
  }
  return { success: false, rateLimited: false };
}

// ─── Local Fallback (upgraded) ──────────────────────────────

function estimateToll(distanceKm: number, perKmRate: number): number {
  const est = Math.round(distanceKm * perKmRate * 0.08);
  return Math.max(est, 500);
}

function estimateDriverBhatta(distanceKm: number): number {
  const est = Math.round(distanceKm * 2);
  return Math.max(est, 300);
}

function localFallback(
  body: PricePredictRequest,
  history: HistoryStats,
  distanceKm: number | null,
  vehicleConfig: PricingConfig | null,
  corridorMultiplier: number,
  seasonalMultiplier: number,
  surchargeConfig: SurchargeConfig,
  returnFactorMap: Record<string, number>,
  currentDiesel: number | null,
  flags: PricingFlags,
): ExtendedPriceResult & { provider: string } {
  const weight = body.weightTonnes;
  const weightKg = weight * 1000;
  const originState = body.originState ?? "";
  const destState = body.destinationState ?? "";
  const returnFactor = flags.enable_return_factor
    ? getReturnFactor(originState, destState, returnFactorMap)
    : 1.0;

  // Tier 1: Historical median with multipliers
  if (history.median && history.loads > 5) {
    let perTonneBase = history.median * corridorMultiplier * seasonalMultiplier;
    perTonneBase = perTonneBase * returnFactor;

    let fuelSurcharge = 0;
    let toll = 0;
    let driver = 0;
    if (flags.enable_fuel_surcharge && body.includeFuelSurcharge !== false && currentDiesel) {
      const totalBase = perTonneBase * weight;
      fuelSurcharge = applyFuelSurcharge(totalBase, currentDiesel, surchargeConfig);
      toll = distanceKm ? estimateToll(distanceKm, vehicleConfig?.rate_per_km ?? 30) : 0;
      driver = distanceKm ? estimateDriverBhatta(distanceKm) : 0;
    }

    const finalPerTonne = perTonneBase + (fuelSurcharge / (weight || 1));
    const spread = history.iqr ? Math.round(history.iqr / 2) : Math.round(finalPerTonne * 0.15);

    return {
      recommendedPrice: Math.round(finalPerTonne),
      range: { min: Math.round(finalPerTonne - spread), max: Math.round(finalPerTonne + spread) },
      confidence: history.loads >= 50 ? "high" : "medium",
      trend: "stable",
      reasoning: `Based on ${history.loads} recent shipments. Median ₹${history.median}/t, adjusted for corridor, season, and return factor.`,
      provider: "data",
      fuelSurcharge,
      returnFactor,
      perKmRate: vehicleConfig?.rate_per_km,
      breakdown: {
        baseFreight: Math.round(perTonneBase * weight),
        fuel: fuelSurcharge,
        toll,
        driver,
        returnAdjustment: Math.round(perTonneBase * weight * (returnFactor - 1)),
      },
    };
  }

  // Tier 2: Distance-based with vehicle config (FTL / PTL split)
  if (distanceKm && vehicleConfig) {
    const perKmRate = vehicleConfig.rate_per_km;
    const capacity = vehicleConfig.base_capacity_tonnes ?? 10;
    const mode: "ftl" | "ptl" = body.shipmentMode ?? "ftl";

    let totalFreight: number;
    let baseFreight: number;

    if (mode === "ftl") {
      baseFreight = distanceKm * perKmRate;
      totalFreight = baseFreight * returnFactor;
    } else {
      const ratePerKg = perKmRate / capacity / 100;
      const ptl = calculatePtl(
        weightKg,
        distanceKm,
        ratePerKg,
        vehicleConfig.min_price,
        body.dimensions,
      );
      baseFreight = ptl.freight;
      totalFreight = baseFreight * returnFactor;
    }

    let fuelSurcharge = 0;
    let toll = 0;
    let driver = 0;
    if (flags.enable_fuel_surcharge && body.includeFuelSurcharge !== false && currentDiesel) {
      fuelSurcharge = applyFuelSurcharge(totalFreight, currentDiesel, surchargeConfig);
      toll = estimateToll(distanceKm, perKmRate);
      driver = estimateDriverBhatta(distanceKm);
    }

    const totalPrice = totalFreight + fuelSurcharge;
    const perTonnePrice = Math.round(totalPrice / (weight || 1));
    const spread = Math.round(perTonnePrice * 0.2);

    return {
      recommendedPrice: perTonnePrice,
      range: { min: Math.round(perTonnePrice - spread), max: Math.round(perTonnePrice + spread) },
      confidence: "medium",
      trend: "stable",
      reasoning: `${distanceKm}km route, ${vehicleConfig.vehicle_type} at ₹${perKmRate}/km (${mode.toUpperCase()}). Return factor ${returnFactor}x${currentDiesel ? `, fuel surcharge from ₹${currentDiesel}/L diesel` : ""}.`,
      provider: "config",
      fuelSurcharge,
      returnFactor,
      perKmRate,
      breakdown: {
        baseFreight: Math.round(baseFreight),
        fuel: fuelSurcharge,
        toll,
        driver,
        returnAdjustment: Math.round(baseFreight * (returnFactor - 1)),
      },
    };
  }

  // Tier 3: Corridor average fallback
  // (handled in main handler before calling this)

  // Tier 4: Weight-based tiers (original behavior, unchanged)
  const baseRate = weight >= 20 ? 2500 : weight >= 10 ? 3000 : 4000;
  const price = Math.round(baseRate * corridorMultiplier * seasonalMultiplier);
  const spread = Math.round(price * 0.2);
  return {
    recommendedPrice: price,
    range: { min: price - spread, max: price + spread },
    confidence: "low",
    trend: "stable",
    reasoning: `Estimated at ₹${price}/t based on typical rates for ${weight}t load.`,
    provider: "data",
    returnFactor,
    perKmRate: vehicleConfig?.rate_per_km,
  };
}

// ─── Confidence from data quality ───────────────────────────

function calculateConfidence(
  historicalLoads: number,
  iqr: number | null,
  median: number | null,
): "high" | "medium" | "low" {
  if (historicalLoads >= 50 && iqr !== null && median !== null) {
    const cv = iqr / median; // coefficient of variation proxy
    if (cv < 0.3) return "high";
    return "medium";
  }
  if (historicalLoads >= 10) return "medium";
  return "low";
}

// ─── Price blending ─────────────────────────────────────────

function blendPrices(
  historicalMedian: number | null,
  aiPrice: number | null,
  historicalLoads: number,
): number {
  if (!historicalMedian) return aiPrice!;
  if (!aiPrice) return historicalMedian;
  const historyWeight = Math.min(0.7, (historicalLoads / 50) * 0.7);
  const aiWeight = 1 - historyWeight;
  return Math.round(historicalMedian * historyWeight + aiPrice * aiWeight);
}

// ─── Factual reasoning ──────────────────────────────────────

function buildFactualReasoning(params: {
  historicalLoads: number;
  historicalMedian: number | null;
  distanceKm: number | null;
  vehicleType: string | null;
  corridorMultiplier: number;
  seasonalMultiplier: number;
  provider: string;
}): string {
  const parts: string[] = [];

  if (params.historicalLoads > 0 && params.historicalMedian) {
    parts.push(`Based on ${params.historicalLoads} recent shipments, median ₹${params.historicalMedian}/t`);
  }
  if (params.distanceKm) {
    parts.push(`Route ~${params.distanceKm}km`);
  }
  if (params.vehicleType) {
    parts.push(`Vehicle: ${params.vehicleType}`);
  }
  if (params.corridorMultiplier !== 1.0) {
    const pct = Math.round((params.corridorMultiplier - 1) * 100);
    parts.push(`${pct > 0 ? "+" : ""}${pct}% corridor adjustment`);
  }
  if (params.seasonalMultiplier !== 1.0) {
    parts.push(`${params.seasonalMultiplier}x seasonal factor`);
  }

  if (parts.length === 0) {
    return `Estimated using ${params.provider} pricing model.`;
  }
  return parts.join(". ") + ".";
}

// ─── Trend detection ────────────────────────────────────────

function detectTrend(prices: number[]): "rising" | "falling" | "stable" {
  if (prices.length < 4) return "stable";
  const half = Math.floor(prices.length / 2);
  const recentAvg = prices.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const olderAvg = prices.slice(half).reduce((a, b) => a + b, 0) / (prices.length - half);
  const diff = (recentAvg - olderAvg) / olderAvg;
  if (diff > 0.05) return "rising";
  if (diff < -0.05) return "falling";
  return "stable";
}

// ─── Main Handler ───────────────────────────────────────────

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  const requestId = generateRequestId();

  if (req.method === "OPTIONS") return optionsResponse(headers);
  if (req.method !== "POST") return errorResponse("Method not allowed", 405, headers, requestId);

  const ip = getRequestIp(req);
  if (!checkRateLimit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return errorResponse("Rate limit exceeded. Try again in 1 minute.", 429, headers, requestId);
  }

  // Auth is optional: verify the JWT only when a Bearer token is present.
  // Anonymous callers are protected by the IP rate limit above.
  const token = extractBearerToken(req);
  if (token) {
    const authUser = await verifyJwt(token);
    if (!authUser) return errorResponse("Invalid or expired token", 401, headers, requestId);
  }

  try {
    const body: PricePredictRequest = await req.json();
    if (!body.originCity || !body.destinationCity || !body.weightTonnes) {
      return errorResponse("Missing required fields: originCity, destinationCity, weightTonnes", 400, headers, requestId);
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const hasDb = !!(supabaseUrl && supabaseKey);

    // Load feature flags first (needed for conditional queries)
    const flags = hasDb ? await loadFeatureFlags(supabaseUrl, supabaseKey) : DEFAULT_FLAGS;

    // Load remaining config in parallel
    const [allConfig, corridorMult, seasonalMult, history, surchargeConfig, returnFactorMap, fuelPrice] = await Promise.all([
      hasDb ? loadPricingConfig(supabaseUrl, supabaseKey) : Promise.resolve(DEFAULT_CONFIG),
      flags.enable_corridor && hasDb
        ? loadCorridorMultiplier(supabaseUrl, supabaseKey, body.originState ?? "", body.destinationState ?? "")
        : Promise.resolve(1.0),
      flags.enable_seasonal && hasDb
        ? loadSeasonalMultiplier(supabaseUrl, supabaseKey)
        : Promise.resolve(1.0),
      flags.enable_history && hasDb
        ? fetchHistory(supabaseUrl, supabaseKey, body.originCity, body.destinationCity)
        : Promise.resolve(emptyHistory()),
      (flags.enable_fuel_surcharge && hasDb)
        ? loadSurchargeConfig(supabaseUrl, supabaseKey)
        : Promise.resolve(DEFAULT_SURCHARGE_CONFIG),
      flags.enable_return_factor && hasDb
        ? loadReturnFactors(supabaseUrl, supabaseKey)
        : Promise.resolve({}),
      (flags.enable_fuel_surcharge && body.originState && body.includeFuelSurcharge !== false && hasDb)
        ? getLatestFuelPrice(supabaseUrl, supabaseKey, body.originState)
        : Promise.resolve(null),
    ]);

    const currentDiesel = fuelPrice ? Number(fuelPrice.diesel_price) : null;

    // Resolve vehicle config — prefer vehicleClass, fall back to vehicleType
    const vehicleConfig = (body.vehicleClass ?? body.vehicleType)
      ? allConfig.find((c) => c.vehicle_type === (body.vehicleClass ?? body.vehicleType)) ?? null
      : null;

    // Fetch OSRM distance if coordinates available
    let distanceKm: number | null = null;
    if (body.originLat && body.originLng && body.destLat && body.destLng) {
      distanceKm = await fetchOsrmDistance(body.originLat, body.originLng, body.destLat, body.destLng);
    }

    // Corridor fallback: if no route history, try state-pair average
    let corridorAvg: number | null = null;
    if (flags.enable_corridor && history.loads === 0 && body.originState && body.destinationState && supabaseUrl && supabaseKey) {
      corridorAvg = await fetchCorridorAverage(supabaseUrl, supabaseKey, body.originState, body.destinationState);
    }

    // Build history info for AI prompt
    let historyInfo = "";
    if (history.loads > 0 && history.median) {
      const min = history.rows.length > 0 ? Math.min(...history.rows.map((r) => r.price_per_tonne)) : 0;
      const max = history.rows.length > 0 ? Math.max(...history.rows.map((r) => r.price_per_tonne)) : 0;
      historyInfo = `Historical data: ₹${min}–${max}/t (median ₹${history.median}) from ${history.loads} loads on this route`;
    } else if (corridorAvg) {
      historyInfo = `No direct route history. Corridor average: ₹${corridorAvg}/t for ${body.originState} → ${body.destinationState}`;
    }

    const distanceInfo = distanceKm ? `Estimated distance: ${distanceKm}km` : "";

    const prompt = buildPrompt(body, historyInfo, distanceInfo);

    // Try AI providers (if enabled)
    let aiResult: (PriceResult & { provider: string }) | null = null;
    if (flags.enable_ai) {
      const providers: { name: string; fn: (b: PricePredictRequest, p: string) => Promise<ProviderResult> }[] = [
        { name: "Gemini", fn: geminiProvider },
        { name: "Groq", fn: groqProvider },
        { name: "OpenRouter", fn: openRouterProvider },
      ];
      for (const { name, fn } of providers) {
        const result = await fn(body, prompt);
        if (result.success && result.data) {
          aiResult = { ...result.data, provider: name };
          break;
        }
      }
    }

    // Compute final price
    let recommendedPrice: number;
    let range: { min: number; max: number };
    let provider: string;
    let fb: (ExtendedPriceResult & { provider: string }) | null = null;

    if (flags.enable_blending && history.median && aiResult) {
      // Blend historical median (70%) with AI prediction (30%)
      recommendedPrice = blendPrices(history.median, aiResult.recommendedPrice, history.loads);
      const spread = history.iqr ? Math.round(history.iqr / 2) : Math.round(recommendedPrice * 0.15);
      range = { min: recommendedPrice - spread, max: recommendedPrice + spread };
      provider = `blend:${aiResult.provider}`;
    } else if (aiResult) {
      recommendedPrice = aiResult.recommendedPrice;
      range = aiResult.range;
      provider = aiResult.provider;
    } else {
      // Local fallback with corridor fallback
      fb = localFallback(body, history, distanceKm, vehicleConfig, corridorMult, seasonalMult, surchargeConfig, returnFactorMap, currentDiesel, flags);

      // If no route history but corridor average exists, use it
      if (history.loads === 0 && corridorAvg) {
        const returnFactor = flags.enable_return_factor
          ? getReturnFactor(body.originState ?? "", body.destinationState ?? "", returnFactorMap)
          : 1.0;
        let adjusted = corridorAvg * seasonalMult * returnFactor;
        let fuelSurcharge = 0;
        if (flags.enable_fuel_surcharge && body.includeFuelSurcharge !== false && currentDiesel) {
          fuelSurcharge = applyFuelSurcharge(adjusted * weight, currentDiesel, surchargeConfig);
          adjusted = adjusted + fuelSurcharge / (weight || 1);
        }
        const spread = Math.round(adjusted * 0.15);
        recommendedPrice = Math.round(adjusted);
        range = { min: Math.round(adjusted - spread), max: Math.round(adjusted + spread) };
        // Don't use fb extended fields in corridor path
        fb = null;
      } else {
        recommendedPrice = fb.recommendedPrice;
        range = fb.range;
      }
      provider = fb.provider;
    }

    // Confidence from data quality (overrides AI confidence)
    const confidence: "high" | "medium" | "low" = history.loads > 0
      ? calculateConfidence(history.loads, history.iqr, history.median)
      : aiResult?.confidence ?? "low";

    // Trend from historical data
    const allPrices = history.rows.map((r) => r.price_per_tonne).filter(Boolean);
    const trend: "rising" | "falling" | "stable" = allPrices.length >= 4 ? detectTrend(allPrices) : aiResult?.trend ?? "stable";

    // Factual reasoning
    const reasoning = buildFactualReasoning({
      historicalLoads: history.loads,
      historicalMedian: history.median,
      distanceKm,
       vehicleType: body.vehicleType ?? body.vehicleClass ?? null,
      corridorMultiplier: corridorMult,
      seasonalMultiplier: seasonalMult,
      provider,
    });

    const fbExtended: ExtendedPriceResult | null = fb;

    // Compute surcharge/return factor fields for non-local-fallback paths
    const returnFactorField = flags.enable_return_factor
      ? getReturnFactor(body.originState ?? "", body.destinationState ?? "", returnFactorMap)
      : undefined;

    let fuelSurchargeField: number | undefined;
    if (flags.enable_fuel_surcharge && body.includeFuelSurcharge !== false && currentDiesel) {
      if (aiResult) {
        fuelSurchargeField = applyFuelSurcharge(recommendedPrice * weight, currentDiesel, surchargeConfig);
      }
    }

    const perKmRateField = vehicleConfig ? vehicleConfig.rate_per_km : undefined;

    return new Response(
      JSON.stringify({
        recommendedPrice,
        range,
        confidence,
        trend,
        reasoning,
        historicalLoads: history.loads,
        historicalAvgPrice: history.median ?? history.avg,
        provider,
        fuelSurcharge: fbExtended?.fuelSurcharge ?? fuelSurchargeField,
        returnFactor: fbExtended?.returnFactor ?? returnFactorField,
        perKmRate: fbExtended?.perKmRate ?? perKmRateField,
        breakdown: fbExtended?.breakdown,
        dieselPrice: currentDiesel,
      }),
      { status: 200, headers },
    );
  } catch (err) {
    console.error(`[${requestId}] Price predict error:`, err);
    return errorResponse("Internal server error", 500, headers, requestId);
  }
});

// ─── Helper ────────────────────────────────────────────────

function emptyHistory(): HistoryStats {
  return { rows: [], loads: 0, median: null, p25: null, p75: null, iqr: null, avg: null };
}
