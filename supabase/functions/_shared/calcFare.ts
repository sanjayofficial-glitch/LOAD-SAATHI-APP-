// Freddy tool: calculate_fare — estimate freight rates from natural language.
//
// Mirrors the heuristic in the app's Freight Rate Calculator
// (supabase/src/pages/public/tools/FreightRateCalculator.tsx): when the
// price-predict service is unavailable the app uses
//   est ₹/km = 15 + 2 × weight(tonnes)
//   per-tonne = distance × est ₹/km ÷ weight
//   range = 0.8×–1.3× recommended
// This module implements exactly that estimate (read-only, no writes). It is
// an ESTIMATE, never a quote; the summary always says so.

import { fetchOsrmDistance } from "./osrm.ts";
import { extractIndianCities, normalizeHindi } from "./freddyIntent.ts";

const GEOCODE_MIN_INTERVAL_MS = 1100;
let lastGeocodeAt = 0;
const geocodeCache = new Map<string, { coords: { lat: number; lon: number } | null; ts: number }>();
const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface CalcRequest {
  origin: string;
  destination: string;
  weightTonnes?: number;
  vehicleType?: string;
}

export interface CalcEstimate {
  distanceKm: number;
  transitMinutes?: number;
  weightTonnes?: number;
  vehicleType?: string;
  perTonneMin: number;
  perTonneMax: number;
  perTonneRecommended: number;
  totalRecommended?: number;
  truckRecommendation?: { name: string; capacity: string; type: string };
  summary: string;
}

export type CalcOutcome =
  | { ok: true; estimate: CalcEstimate }
  | { ok: false; reason: string };

export interface CalcDeps {
  fetchImpl?: typeof fetch;
}

// Same truck bands as the app's calculator.
const TRUCK_BANDS: Array<{ min: number; max: number; name: string; capacity: string; type: string }> = [
  { min: 0, max: 1, name: "Tata Ace / Mini Truck", capacity: "0.7–1T", type: "Mini Truck" },
  { min: 1, max: 2.5, name: "Tata Intra / Bolero Pik-Up", capacity: "1–2.5T", type: "Pickup" },
  { min: 2.5, max: 5, name: "Tata 407 / Eicher Pro 2049", capacity: "2.5–5T", type: "LCV" },
  { min: 5, max: 10, name: "Tata LPT 1613 / Eicher Pro 3015", capacity: "5–10T", type: "MLCV" },
  { min: 10, max: 16, name: "Tata Signa / Mahindra Blazo X 25", capacity: "10–16T", type: "HCV" },
  { min: 16, max: 999, name: "Tata Prima / Tractor-Trailer", capacity: "16–25T", type: "Trailer" },
];

export function truckRecommendation(weight: number) {
  if (!Number.isFinite(weight) || weight <= 0) return undefined;
  return TRUCK_BANDS.find((b) => weight >= b.min && weight < b.max) ?? TRUCK_BANDS[TRUCK_BANDS.length - 1];
}

/** Parse "fare from X to Y for N tonnes" style requests. */
export function parseCalcRequest(message: string): CalcRequest | null {
  const m = normalizeHindi(message);

  const cities = extractIndianCities(m);
  if (cities.length < 2) return null;

  const weightMatch = m.match(
    /(\d+(?:\.\d+)?)\s*(?:tonne|tonnes|tons?|t|टन)\b/i,
  );
  const weightTonnes = weightMatch ? Number(weightMatch[1]) : undefined;
  if (weightTonnes !== undefined && (!Number.isFinite(weightTonnes) || weightTonnes <= 0 || weightTonnes > 500)) {
    return null;
  }

  const vehicleMatch = m.match(/\b(container|trailer|tipper|dumper|openbody|open\s+body|closed|covered)\b/i);
  return {
    origin: cities[0],
    destination: cities[1],
    weightTonnes,
    vehicleType: vehicleMatch ? vehicleMatch[1].toLowerCase() : undefined,
  };
}

async function geocodeCity(city: string, fetchImpl: typeof fetch): Promise<{ lat: number; lon: number } | null> {
  const key = city.toLowerCase().trim();
  const cached = geocodeCache.get(key);
  if (cached && Date.now() - cached.ts < GEOCODE_CACHE_TTL_MS) {
    return cached.coords;
  }
  const now = Date.now();
  const elapsed = now - lastGeocodeAt;
  if (elapsed < GEOCODE_MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, GEOCODE_MIN_INTERVAL_MS - elapsed));
  }
  lastGeocodeAt = Date.now();
  try {
    const query = encodeURIComponent(`${city}, India`);
    const res = await fetchImpl(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (data.length === 0) return null;
    const coords = { lat: Number(data[0].lat), lon: Number(data[0].lon) };
    geocodeCache.set(key, { coords, ts: Date.now() });
    return coords;
  } catch {
    return null;
  }
}

export async function calculateFareEstimate(
  req: CalcRequest,
  deps: CalcDeps = {},
): Promise<CalcOutcome> {
  const fetchImpl = deps.fetchImpl ?? fetch;

  const [originCoords, destCoords] = await Promise.all([
    geocodeCity(req.origin, fetchImpl),
    geocodeCity(req.destination, fetchImpl),
  ]);
  if (!originCoords || !destCoords) {
    return { ok: false, reason: "Could not locate one or both cities. Please check the spelling." };
  }

  const distanceKm = await fetchOsrmDistance(
    originCoords.lat,
    originCoords.lon,
    destCoords.lat,
    destCoords.lon,
  );
  if (distanceKm === null || distanceKm <= 0) {
    return { ok: false, reason: "Could not calculate a route between these cities." };
  }

  // Same heuristic as the app's Freight Rate Calculator fallback.
  const weight = req.weightTonnes;
  const estPerKm = weight && weight > 0 ? 15 + weight * 2 : 24;
  const perTonne = weight && weight > 0 ? (distanceKm * estPerKm) / weight : undefined;

  const perTonneMin = perTonne !== undefined ? Math.round(perTonne * 0.8) : 0;
  const perTonneMax = perTonne !== undefined ? Math.round(perTonne * 1.3) : 0;
  const perTonneRecommended = perTonne !== undefined ? Math.round(perTonne) : 0;
  const totalRecommended = perTonneRecommended > 0 ? perTonneRecommended * weight! : undefined;
  const truck = weight ? truckRecommendation(weight) : undefined;

  const transitMinutes = Math.round((distanceKm / 40) * 60); // rough 40 km/h average
  const payload: CalcEstimate = {
    distanceKm,
    transitMinutes,
    ...(weight !== undefined ? { weightTonnes: weight } : {}),
    ...(req.vehicleType ? { vehicleType: req.vehicleType } : {}),
    perTonneMin,
    perTonneMax,
    perTonneRecommended,
    ...(totalRecommended !== undefined ? { totalRecommended } : {}),
    ...(truck ? { truckRecommendation: truck } : {}),
    summary:
      weight !== undefined
        ? `Estimate: ~${distanceKm} km, ~${transitMinutes} min. Around ₹${perTonneMin}–₹${perTonneMax} per tonne (recommended ₹${perTonneRecommended}), total ≈ ₹${totalRecommended} for ${weight}t.`
        : `Estimate: ~${distanceKm} km, ~${transitMinutes} min. Add the weight to get a per-tonne range.`,
  };
  return { ok: true, estimate: payload };
}
