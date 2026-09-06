// Lightweight read-only endpoint — returns latest fuel price for a state.
// Used by useFuelPrice hook on the frontend.

import { getCorsHeaders } from "../_shared/edgeHelpers.ts";

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: "Service misconfiguration" }), {
      status: 500,
      headers,
    });
  }

  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "Odisha";

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/fuel_prices?state=eq.${encodeURIComponent(state)}&order=effective_date.desc&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch fuel price", status: res.status }),
        { status: 502, headers },
      );
    }

    const rows = await res.json();

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: `No fuel price data found for ${state}` }),
        { status: 404, headers },
      );
    }

    const row = rows[0];

    return new Response(
      JSON.stringify({
        id: row.id,
        state: row.state,
        city: row.city,
        diesel_price: row.diesel_price,
        petrol_price: row.petrol_price,
        effective_date: row.effective_date,
        source: row.source,
        updated_at: row.updated_at,
      }),
      { status: 200, headers },
    );
  } catch (err) {
    console.error(`[get-fuel-price] Error:`, err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
});
