// Daily cron edge function — refreshes the latest diesel (and petrol) price
// for a state in the `fuel_prices` table.
//
// Invoked by the Vercel cron route /api/cron/diesel (see vercel.json).
// `get-fuel-price` and _shared/fuel.ts read the newest row per state with
// `state=eq.<X>&order=effective_date.desc&limit=1`, so exactly ONE row must
// exist per (state, fuel_type). That is enforced by the live unique index
// `unique_state_fuel_type ON public.fuel_prices (state, fuel_type)`.
// Writing one row per district — as an earlier version of this function did —
// violated that index, so only the first city ever persisted.
//
// Source strategy:
//   1. LIVE_PRICE_API_URL (optional secret) — a JSON endpoint returning either
//      { diesel, petrol } or { diesel_price, petrol_price }.
//   2. Last-known row from `fuel_prices`, returned UNCHANGED. An earlier
//      version applied a 0.5% daily uplift here, which compounded every run
//      and inflated prices without any real-world source. Do not reintroduce
//      that: stale-but-true beats fresh-but-fictional.

interface FuelSnapshot {
  state: string;
  city: string | null;
  diesel_price: number;
  petrol_price: number | null;
  source: string;
}

const DEFAULT_STATE = "Odisha";

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** Reads a configured JSON price endpoint. Returns null when unavailable. */
async function fetchLivePrice(apiUrl: string, state: string): Promise<FuelSnapshot | null> {
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`[fuel] live source returned ${res.status}`);
      return null;
    }
    const data: unknown = await res.json();
    if (!data || typeof data !== "object") {
      console.error("[fuel] live source returned a non-object payload");
      return null;
    }
    const row = data as Record<string, unknown>;
    const diesel = toNumber(row.diesel) ?? toNumber(row.diesel_price);
    if (diesel === null) {
      console.error("[fuel] live source payload had no usable diesel price");
      return null;
    }
    return {
      state,
      city: typeof row.city === "string" ? row.city : null,
      diesel_price: diesel,
      petrol_price: toNumber(row.petrol) ?? toNumber(row.petrol_price),
      source: "live",
    };
  } catch (err) {
    console.error("[fuel] live source fetch failed:", err);
    return null;
  }
}

/** Last persisted row for the state, with prices passed through unchanged. */
async function fetchLastKnown(
  supabaseUrl: string,
  supabaseKey: string,
  state: string,
): Promise<FuelSnapshot | null> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/fuel_prices?state=eq.${encodeURIComponent(state)}&order=effective_date.desc&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return null;
    const rows: Array<Record<string, unknown>> = await res.json();
    const row = rows[0];
    if (!row) return null;
    const diesel = toNumber(row.diesel_price) ?? toNumber(row.price);
    if (diesel === null) return null;
    return {
      state,
      city: typeof row.city === "string" ? row.city : null,
      diesel_price: diesel,
      petrol_price: toNumber(row.petrol_price),
      source: "last-known",
    };
  } catch (err) {
    console.error("[fuel] last-known lookup failed:", err);
    return null;
  }
}

/**
 * Upserts a single row per (state, fuel_type), matching the live
 * `unique_state_fuel_type` index. `Prefer: resolution=merge-duplicates` turns
 * the POST into an upsert on the on_conflict target.
 *
 * The previous implementation sent
 * `Prefer: resolution=merge-duplicates, params=diff-composite id`, which is
 * not valid PostgREST — conflict columns come from the on_conflict query
 * parameter, not the Prefer header.
 */
async function upsertSnapshot(
  supabaseUrl: string,
  supabaseKey: string,
  snapshot: FuelSnapshot,
): Promise<{ ok: boolean; status: number; detail: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const body = {
    state: snapshot.state,
    city: snapshot.city,
    fuel_type: "diesel",
    price: snapshot.diesel_price,
    diesel_price: snapshot.diesel_price,
    petrol_price: snapshot.petrol_price,
    effective_date: today,
    source: snapshot.source,
    updated_at: new Date().toISOString(),
  };

  const res = await fetch(
    `${supabaseUrl}/rest/v1/fuel_prices?on_conflict=state,fuel_type`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(body),
    },
  );

  if (res.ok) {
    return { ok: true, status: res.status, detail: "ok" };
  }
  const detail = (await res.text()).slice(0, 300);
  return { ok: false, status: res.status, detail };
}

Deno.serve(async (req: Request) => {
  const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  // Cron secret validation — only Vercel cron or a caller with CRON_SECRET may invoke.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const auth = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${cronSecret}`;
    if (auth !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !supabaseKey) {
    console.error("[fuel] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    return new Response(JSON.stringify({ error: "Service misconfiguration" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  const state = Deno.env.get("FUEL_PRICE_STATE") ?? DEFAULT_STATE;
  const liveApiUrl = Deno.env.get("LIVE_PRICE_API_URL");

  try {
    // 1. Live source, when one is configured.
    let snapshot: FuelSnapshot | null = null;
    if (liveApiUrl) {
      snapshot = await fetchLivePrice(liveApiUrl, state);
    } else {
      console.log("[fuel] LIVE_PRICE_API_URL not set — using last-known prices");
    }

    // 2. Last-known, unchanged.
    if (!snapshot) {
      snapshot = await fetchLastKnown(supabaseUrl, supabaseKey, state);
    }

    if (!snapshot) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "No price data available from live source or last-known rows",
          upserted: 0,
        }),
        { status: 502, headers: jsonHeaders },
      );
    }

    const result = await upsertSnapshot(supabaseUrl, supabaseKey, snapshot);
    if (!result.ok) {
      console.error(`[fuel] upsert failed (${result.status}): ${result.detail}`);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to persist fuel price",
          upsertStatus: result.status,
          upsertDetail: result.detail,
          upserted: 0,
        }),
        { status: 502, headers: jsonHeaders },
      );
    }

    console.log(
      `[fuel] ${state}: ₹${snapshot.diesel_price}/L from ${snapshot.source}, effective ${new Date().toISOString().slice(0, 10)}`,
    );

    return new Response(
      JSON.stringify({
        status: "ok",
        upserted: 1,
        state: snapshot.state,
        diesel_price: snapshot.diesel_price,
        petrol_price: snapshot.petrol_price,
        source: snapshot.source,
        date: new Date().toISOString().slice(0, 10),
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    console.error("[fuel] fatal error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
