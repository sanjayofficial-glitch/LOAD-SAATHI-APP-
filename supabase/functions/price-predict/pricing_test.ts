import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  calculateConfidence,
  blendPrices,
  detectTrend,
  buildFactualReasoning,
  localFallback,
  parseAIResponse,
  applyFuelSurcharge,
  getReturnFactor,
  calculatePtl,
  DEFAULT_CONFIG,
  DEFAULT_SURCHARGE_CONFIG,
  type HistoryStats,
} from "./pricing.ts";

// ─── calculateConfidence ────────────────────────────────────

Deno.test("calculateConfidence returns high for 50+ records with low variance", () => {
  assertEquals(calculateConfidence(60, 200, 3000), "high");
});

Deno.test("calculateConfidence returns medium for 50+ records with high variance", () => {
  assertEquals(calculateConfidence(60, 1500, 3000), "medium");
});

Deno.test("calculateConfidence returns medium for 10-49 records", () => {
  assertEquals(calculateConfidence(25, null, null), "medium");
});

Deno.test("calculateConfidence returns low for <10 records", () => {
  assertEquals(calculateConfidence(5, null, null), "low");
});

Deno.test("calculateConfidence returns low for 0 records", () => {
  assertEquals(calculateConfidence(0, null, null), "low");
});

// ─── blendPrices ────────────────────────────────────────────

Deno.test("blendPrices returns AI price when no history", () => {
  assertEquals(blendPrices(null, 3000, 0), 3000);
});

Deno.test("blendPrices returns historical when no AI", () => {
  assertEquals(blendPrices(2500, null, 20), 2500);
});

Deno.test("blendPrices weights history more with more records", () => {
  // 50 records → 70% history weight
  const result = blendPrices(2000, 3000, 50);
  // 2000 * 0.7 + 3000 * 0.3 = 1400 + 900 = 2300
  assertEquals(result, 2300);
});

Deno.test("blendPrices weights AI more with few records", () => {
  // 5 records → 7% history weight
  const result = blendPrices(2000, 3000, 5);
  // 2000 * 0.07 + 3000 * 0.93 = 140 + 2790 = 2930
  assertEquals(result, 2930);
});

Deno.test("blendPrices with equal prices returns same", () => {
  assertEquals(blendPrices(2500, 2500, 30), 2500);
});

// ─── detectTrend ────────────────────────────────────────────

Deno.test("detectTrend returns stable for <4 prices", () => {
  assertEquals(detectTrend([100, 200, 300]), "stable");
});

Deno.test("detectTrend returns stable for equal halves", () => {
  assertEquals(detectTrend([100, 100, 100, 100]), "stable");
});

Deno.test("detectTrend returns rising when recent > older", () => {
  assertEquals(detectTrend([200, 200, 100, 100]), "rising");
});

Deno.test("detectTrend returns falling when recent < older", () => {
  assertEquals(detectTrend([100, 100, 200, 200]), "falling");
});

Deno.test("detectTrend handles empty array", () => {
  assertEquals(detectTrend([]), "stable");
});

// ─── buildFactualReasoning ──────────────────────────────────

Deno.test("buildFactualReasoning includes all params", () => {
  const result = buildFactualReasoning({
    historicalLoads: 43,
    historicalMedian: 2850,
    distanceKm: 450,
    vehicleType: "22ft",
    corridorMultiplier: 1.05,
    seasonalMultiplier: 1.08,
    provider: "data",
  });
  assertEquals(result.includes("43 recent shipments"), true);
  assertEquals(result.includes("median ₹2850/t"), true);
  assertEquals(result.includes("450km"), true);
  assertEquals(result.includes("22ft"), true);
  assertEquals(result.includes("+5% corridor"), true);
  assertEquals(result.includes("1.08x seasonal"), true);
});

Deno.test("buildFactualReasoning falls back to provider when no data", () => {
  const result = buildFactualReasoning({
    historicalLoads: 0,
    historicalMedian: null,
    distanceKm: null,
    vehicleType: null,
    corridorMultiplier: 1.0,
    seasonalMultiplier: 1.0,
    provider: "Gemini",
  });
  assertEquals(result, "Estimated using Gemini pricing model.");
});

Deno.test("buildFactualReasoning handles negative corridor multiplier", () => {
  const result = buildFactualReasoning({
    historicalLoads: 0,
    historicalMedian: null,
    distanceKm: null,
    vehicleType: null,
    corridorMultiplier: 0.95,
    seasonalMultiplier: 1.0,
    provider: "data",
  });
  assertEquals(result.includes("-5% corridor"), true);
});

// ─── localFallback ──────────────────────────────────────────

Deno.test("localFallback uses historical median when available", () => {
  const history: HistoryStats = {
    rows: [{ price_per_tonne: 2800, weight_tonnes: 10, created_at: "" }],
    loads: 20,
    median: 2800,
    p25: 2600,
    p75: 3000,
    iqr: 400,
    avg: 2800,
  };
  const result = localFallback(10, history, null, null, 1.0, 1.0);
  assertEquals(result.recommendedPrice, 2800);
  assertEquals(result.confidence, "medium");
  assertEquals(result.provider, "data");
});

Deno.test("localFallback uses vehicle config with distance", () => {
  const history: HistoryStats = {
    rows: [],
    loads: 0,
    median: null,
    p25: null,
    p75: null,
    iqr: null,
    avg: null,
  };
  const config = DEFAULT_CONFIG.find((c) => c.vehicle_type === "22ft")!;
  const result = localFallback(10, history, 300, config, 1.0, 1.0);
  // 52 * 300 / 10 = 1560, clamped to [5000, 14000] = 5000
  assertEquals(result.recommendedPrice, 5000);
  assertEquals(result.confidence, "medium");
  assertEquals(result.provider, "config");
});

Deno.test("localFallback applies corridor and seasonal multipliers", () => {
  const history: HistoryStats = {
    rows: [],
    loads: 0,
    median: null,
    p25: null,
    p75: null,
    iqr: null,
    avg: null,
  };
  const config = DEFAULT_CONFIG.find((c) => c.vehicle_type === "22ft")!;
  const result = localFallback(10, history, 300, config, 1.05, 1.1);
  // 52 * 300 / 10 = 1560, clamped to [5000, 14000] = 5000, then * 1.05 * 1.1 = 5775
  assertEquals(result.recommendedPrice, 5775);
});

Deno.test("localFallback uses weight tiers as last resort", () => {
  const history: HistoryStats = {
    rows: [],
    loads: 0,
    median: null,
    p25: null,
    p75: null,
    iqr: null,
    avg: null,
  };
  const result20 = localFallback(20, history, null, null, 1.0, 1.0);
  assertEquals(result20.recommendedPrice, 2500);

  const result15 = localFallback(15, history, null, null, 1.0, 1.0);
  assertEquals(result15.recommendedPrice, 3000);

  const result5 = localFallback(5, history, null, null, 1.0, 1.0);
  assertEquals(result5.recommendedPrice, 4000);
});

Deno.test("localFallback weight tiers apply multipliers", () => {
  const history: HistoryStats = {
    rows: [],
    loads: 0,
    median: null,
    p25: null,
    p75: null,
    iqr: null,
    avg: null,
  };
  const result = localFallback(15, history, null, null, 1.08, 1.05);
  // 3000 * 1.08 * 1.05 = 3402
  assertEquals(result.recommendedPrice, 3402);
});

// ─── parseAIResponse ────────────────────────────────────────

Deno.test("parseAIResponse parses valid JSON", () => {
  const input = '{"recommendedPrice":2500,"range":{"min":2000,"max":3000},"confidence":"high","trend":"stable","reasoning":"test"}';
  const result = parseAIResponse(input);
  assertNotEquals(result, null);
  assertEquals(result!.recommendedPrice, 2500);
});

Deno.test("parseAIResponse handles markdown-wrapped JSON", () => {
  const input = '```json\n{"recommendedPrice":2500,"range":{"min":2000,"max":3000},"confidence":"high","trend":"stable","reasoning":"test"}\n```';
  const result = parseAIResponse(input);
  assertNotEquals(result, null);
  assertEquals(result!.recommendedPrice, 2500);
});

Deno.test("parseAIResponse returns null for invalid JSON", () => {
  assertEquals(parseAIResponse("not json"), null);
});

Deno.test("parseAIResponse returns null for empty string", () => {
  assertEquals(parseAIResponse(""), null);
});

// ─── applyFuelSurcharge ───────────────────────────────────────

Deno.test("applyFuelSurcharge returns 0 when diesel at base price", () => {
  const result = applyFuelSurcharge(20000, 95.20, DEFAULT_SURCHARGE_CONFIG);
  assertEquals(result, 0);
});

Deno.test("applyFuelSurcharge returns 0 when diesel below base price", () => {
  const result = applyFuelSurcharge(20000, 90.0, DEFAULT_SURCHARGE_CONFIG);
  assertEquals(result, 0);
});

Deno.test("applyFuelSurcharge calculates correctly for Odisha diesel ₹101.61", () => {
  const result = applyFuelSurcharge(20000, 101.61, DEFAULT_SURCHARGE_CONFIG);
  // (101.61 - 95.20) * 0.0065 * 20000 = 833.3 → rounded to 830
  assertEquals(result, 830);
});

Deno.test("applyFuelSurcharge calculates correctly for diesel ₹110", () => {
  const result = applyFuelSurcharge(20000, 110, DEFAULT_SURCHARGE_CONFIG);
  // (110 - 95.20) * 0.0065 * 20000 = 1924 → rounded to 1920
  assertEquals(result, 1920);
});

Deno.test("applyFuelSurcharge rounds to nearest ₹10", () => {
  const result = applyFuelSurcharge(15000, 101.61, DEFAULT_SURCHARGE_CONFIG);
  // 15000 * (101.61 - 95.20) * 0.0065 = 624.975 → rounded to 620
  assertEquals(result, 620);
});

// ─── getReturnFactor ─────────────────────────────────────────

Deno.test("getReturnFactor returns seeded value for known pair", () => {
  const map: Record<string, number> = {
    "odisha|odisha": 1.5,
    "west bengal|odisha": 1.2,
    "default|default": 1.4,
  };
  assertEquals(getReturnFactor("Odisha", "Odisha", map), 1.5);
  assertEquals(getReturnFactor("West Bengal", "Odisha", map), 1.2);
});

Deno.test("getReturnFactor returns 1.4 for unknown pair", () => {
  const map: Record<string, number> = {};
  assertEquals(getReturnFactor("Maharashtra", "Karnataka", map), 1.4);
});

Deno.test("getReturnFactor is case-insensitive", () => {
  const map: Record<string, number> = {
    "odisha|jharkhand": 1.4,
  };
  assertEquals(getReturnFactor("ODISHA", "Jharkhand", map), 1.4);
});

// ─── calculatePtl ────────────────────────────────────────────

Deno.test("calculatePtl computes freight from weight and distance", () => {
  const result = calculatePtl(400, 320, 0.05, 5000);
  // 400 * 320 * 0.05 = 6400
  assertEquals(result.chargeableKg, 400);
  assertEquals(result.freight, 6400);
  assertEquals(result.perKg, 16);
});

Deno.test("calculatePtl uses min charge floor when freight is below minimum", () => {
  const result = calculatePtl(100, 50, 0.05, 5000);
  // 100 * 50 * 0.05 = 250 < 5000 → freight = 5000
  assertEquals(result.freight, 5000);
  assertEquals(result.chargeableKg, 100);
});

Deno.test("calculatePtl applies volumetric rule when dimensions provided", () => {
  // Box: 200cm x 150cm x 100cm → volumetric = 200*150*100/6000 = 500kg
  // Actual weight: 300kg → chargeable = 500
  const result = calculatePtl(300, 320, 0.05, 5000, { l: 200, b: 150, h: 100 });
  assertEquals(result.chargeableKg, 500);
  assertEquals(result.freight, 8000); // 500 * 320 * 0.05 = 8000
  assertEquals(result.perKg, 16);   // 8000 / 500
});

Deno.test("calculatePtl uses actual weight when it exceeds volumetric", () => {
  const result = calculatePtl(400, 320, 0.05, 5000, { l: 100, b: 100, h: 100 });
  // volumetric = 100*100*100/6000 = 166.67 → chargeable = 400 (actual)
  assertEquals(result.chargeableKg, 400);
  assertEquals(result.freight, 6400);
});

// ─── DEFAULT_CONFIG ─────────────────────────────────────────

Deno.test("DEFAULT_CONFIG has all vehicle types", () => {
  assertEquals(DEFAULT_CONFIG.length, 7);
  const types = DEFAULT_CONFIG.map((c) => c.vehicle_type);
  assertEquals(types.includes("mini_truck"), true);
  assertEquals(types.includes("trailer"), true);
});

Deno.test("DEFAULT_CONFIG has valid rate ranges", () => {
  for (const config of DEFAULT_CONFIG) {
    assertEquals(config.rate_per_km > 0, true);
    assertEquals(config.min_price > 0, true);
    assertEquals(config.max_price > config.min_price, true);
  }
});
