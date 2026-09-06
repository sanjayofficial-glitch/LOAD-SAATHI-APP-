// Daily cron edge function — fetches diesel prices for Odisha districts
// Writes one row per district to `fuel_prices` table.
// Scheduled via Supabase pg_cron or Vercel cron (see vercel.json).

interface DieselPriceEntry {
  state: string;
  city: string;
  diesel_price: number;
  petrol_price: number | null;
  source: string;
}

const DIESELPRICE_IN_API = "https://dieselprice.in/api/v1/state/odisha";

async function fetchFromDieselPriceIn(): Promise<DieselPriceEntry[] | null> {
  try {
    const res = await fetch(DIESELPRICE_IN_API, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) {
      console.error(`[fuel] dieselprice.in returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    // Expected format: { state: "Odisha", prices: [{ city: "Rourkela", diesel: 101.61, petrol: 103.45 }, ...] }
    if (!data || !Array.isArray(data.prices)) {
      console.error(`[fuel] Unexpected response shape from dieselprice.in`);
      return null;
    }
    return data.prices.map((p: { city: string; diesel: number; petrol?: number }) => ({
      state: data.state || "Odisha",
      city: p.city,
      diesel_price: Number(p.diesel),
      petrol_price: p.petrol != null ? Number(p.petrol) : null,
      source: "dieselprice.in",
    }));
  } catch (err) {
    console.error(`[fuel] dieselprice.in fetch failed:`, err);
    return null;
  }
}

async function getLastKnownPrices(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<DieselPriceEntry[] | null> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/fuel_prices?state=eq.Odisha&order=effective_date.desc&limit=50`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return null;
    const rows: { city: string; diesel_price: number; petrol_price: number | null }[] = await res.json();
    if (rows.length === 0) return null;
    // Apply 0.5% buffer to last-known values as fallback
    return rows.map((r) => ({
      state: "Odisha",
      city: r.city,
      diesel_price: Math.round(r.diesel_price * 1.005 * 100) / 100,
      petrol_price: r.petrol_price,
      source: "fallback:last-known+0.5%",
    }));
  } catch (err) {
    console.error(`[fuel] Fallback price fetch failed:`, err);
    return null;
  }
}

async function upsertPrices(
  supabaseUrl: string,
  supabaseKey: string,
  entries: DieselPriceEntry[],
): Promise<{ upserted: number }> {
  const today = new Date().toISOString().split("T")[0];
  let upserted = 0;

  for (const entry of entries) {
    const body = {
      state: entry.state,
      city: entry.city,
      diesel_price: entry.diesel_price,
      petrol_price: entry.petrol_price,
      effective_date: today,
      source: entry.source,
    };
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/fuel_prices`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates, params=diff-composite id",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        upserted++;
        console.log(`[fuel] Upserted ${entry.city}: ₹${entry.diesel_price}/L`);
      } else {
        console.error(`[fuel] Failed to upsert ${entry.city}: ${res.status}`);
      }
    } catch (err) {
      console.error(`[fuel] Error upserting ${entry.city}:`, err);
    }
  }

  return { upserted };
}

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseKey) {
    console.error(`[fuel] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set`);
    return new Response(JSON.stringify({ error: "Service misconfiguration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Allow both scheduled cron (GET) and manual trigger (POST)
  const method = req.method;
  if (method !== "GET" && method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Try primary API source
    let entries = await fetchFromDieselPriceIn();

    // Fallback: last-known prices + 0.5% buffer
    if (!entries || entries.length === 0) {
      console.error(`[fuel] Primary API unavailable, using fallback last-known prices`);
      entries = await getLastKnownPrices(supabaseUrl, supabaseKey);
    }

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({
        status: "error",
        message: "No price data available from any source",
        upserted: 0,
      }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    const result = await upsertPrices(supabaseUrl, supabaseKey, entries);

    console.log(`[fuel] Daily fetch complete. Upserted: ${result.upserted}. Source: ${entries[0]?.source}`);

    return new Response(JSON.stringify({
      status: "ok",
      upserted: result.upserted,
      state: "Odisha",
      date: new Date().toISOString().split("T")[0],
      source: entries[0]?.source ?? "unknown",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(`[fuel] Fatal error:`, err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
