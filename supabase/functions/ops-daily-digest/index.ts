// Data provider for the founder's daily Telegram digest.
//
// Invoked by the Vercel cron route /api/cron/daily (diesel-cron pattern: the
// caller authenticates with the anon key; verify_jwt stays true so only a
// valid project JWT passes). All reads use the platform-injected
// SUPABASE_SERVICE_ROLE_KEY because lead counts are anon-invisible.
//
// Returns a compact JSON snapshot of the last 24 hours:
//   { since, leads: {total, withEmail, bySource, rows[]},
//     trips / shipments: {total, rows[]},
//     shipmentRequests, messages, priceHistory, diesel }

interface Row {
  [key: string]: unknown;
}

interface Snapshot {
  since: string;
  leads: { total: number; withEmail: number; bySource: Record<string, number>; rows: Row[] };
  trips: { total: number; rows: Row[] };
  shipments: { total: number; rows: Row[] };
  shipmentRequests: number;
  messages: number;
  priceHistory: number;
  diesel: Row | null;
}

const LIMIT = 60;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function handler(_req: Request): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !supabaseKey) {
    return json({ error: "Service credentials not configured" }, 500);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  async function fetchRows(
    table: string,
    select: string,
    onCreatedCols = true,
    limit = LIMIT,
  ): Promise<Row[]> {
    const q = onCreatedCols
      ? "select=" + select + "&created_at=gte." + since + "&order=created_at.desc&limit=" + limit
      : "select=" + select + "&order=effective_date.desc&limit=1";
    const url = supabaseUrl + "/rest/v1/" + table + "?" + q;
    try {
      const res = await fetch(url, {
        headers: { apikey: supabaseKey, Authorization: "Bearer " + supabaseKey },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        console.error("[digest] " + table + " -> " + res.status);
        return [];
      }
      return (await res.json()) as Row[];
    } catch (err) {
      console.error("[digest] " + table + " fetch failed:", err);
      return [];
    }
  }

  const [leadRows, tripRows, shipmentRows, requestRows, messageRows, priceRows, dieselRows] =
    await Promise.all([
      fetchRows("leads", "id,phone,name,email,source,page_path,created_at"),
      fetchRows("trips", "id,origin_city,destination_city,status,created_at"),
      fetchRows(
        "shipments",
        "id,origin_city,destination_city,weight_tonnes,status,created_at",
      ),
      fetchRows("shipment_requests", "id,status,created_at"),
      fetchRows("messages", "id,is_read,created_at"),
      fetchRows("price_history", "id,price_per_tonne,created_at"),
      fetchRows(
        "fuel_prices",
        "state,city,diesel_price,petrol_price,price,effective_date,source",
        false,
      ),
    ]);

  const bySource: Record<string, number> = {};
  for (const r of leadRows) {
    const k = String(r.source || "other");
    bySource[k] = (bySource[k] || 0) + 1;
  }

  const snapshot: Snapshot = {
    since,
    leads: {
      total: leadRows.length,
      // 60-row window cap keeps the payload bounded on spike days; counts are
      // within-window and the formatter labels them "24h" regardless.
      withEmail: leadRows.filter((r) => r.email).length,
      bySource,
      rows: leadRows,
    },
    trips: { total: tripRows.length, rows: tripRows },
    shipments: { total: shipmentRows.length, rows: shipmentRows },
    shipmentRequests: requestRows.length,
    messages: messageRows.length,
    priceHistory: priceRows.length,
    diesel: dieselRows[0] ?? null,
  };

  return json(snapshot);
}

// The edge runtime serves only what Deno.serve registers — a bare exported
// handler leaves it accepting connections without ever responding.
Deno.serve(async (req: Request): Promise<Response> => {
  return handler(req);
});
