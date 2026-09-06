// Shared helper to read latest fuel price by state
// Import as: import { getLatestFuelPrice } from "../_shared/fuel.ts";

export interface FuelPrice {
  state: string;
  city: string | null;
  diesel_price: number;
  petrol_price: number | null;
  effective_date: string;
  source: string | null;
}

export interface SurchargeConfig {
  base_diesel_price: number;
  surcharge_per_rupee: number;
  base_diesel_date: string;
}

export async function getLatestFuelPrice(
  supabaseUrl: string,
  supabaseKey: string,
  state: string,
): Promise<FuelPrice | null> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/fuel_prices?state=eq.${encodeURIComponent(state)}&order=effective_date.desc&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return null;
    const rows: FuelPrice[] = await res.json();
    return rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

export async function getSurchargeConfig(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<SurchargeConfig | null> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/pricing_surcharge_config?limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return null;
    const rows: SurchargeConfig[] = await res.json();
    return rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

export function isFuelPriceStale(effectiveDate: string, maxAgeDays = 7): boolean {
  const effective = new Date(effectiveDate).getTime();
  const now = Date.now();
  const ageDays = (now - effective) / (1000 * 60 * 60 * 24);
  return ageDays > maxAgeDays;
}
