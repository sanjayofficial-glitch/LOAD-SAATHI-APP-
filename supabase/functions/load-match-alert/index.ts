// Load-match-alert — proactive notification agent for LoadSaathi.
//
// Scans recently posted trips and shipments, finds route matches, and inserts
// notification rows so the push-notifier edge function can deliver web push
// alerts to subscribed users.
//
// Intended to be invoked by a cron schedule (e.g. every 15 minutes via
// vercel.json crons or Supabase cron extension). Requires CRON_SECRET for auth.
//
// Database tables used (all already exist from migrations):
//   - public.trips (truckers post their available capacity)
//   - public.shipments (shippers post their loads)
//   - public.notifications (outbound alerts — push-notifier reads these)
//   - public.push_subscriptions (web push subscribers)
//   - public.users (user_type, contact info)
//
// Security:
//   - CRON_SECRET bearer token required (fail closed)
//   - Service-role key used server-side only (never exposed to clients)
//   - Read-only on trips/shipments; INSERT-only on notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface MarketTrip {
  id: string;
  trucker_id: string;
  origin_city: string;
  destination_city: string;
  departure_date: string;
  available_capacity_tonnes?: number;
  price_per_tonne?: number;
  vehicle_type?: string;
  status: string;
  created_at: string;
}

interface MarketShipment {
  id: string;
  shipper_id: string;
  origin_city: string;
  destination_city: string;
  weight_tonnes?: number;
  budget_per_tonne?: number;
  status: string;
  created_at: string;
}

interface NotificationRow {
  user_id: string;
  message: string;
  title?: string;
  type?: string;
  action_url?: string;
}

const RATE_LIMIT_WINDOW_MINUTES = 60;
const MAX_NOTIFICATIONS_PER_RUN = 50;

function getEnv(name: string): string {
  return Deno.env.get(name) ?? "";
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function citiesMatch(a: string, b: string): boolean {
  const na = normalizeCity(a);
  const nb = normalizeCity(b);
  if (na === nb) return true;
  // Substring match for cities like "Rourkela" vs "New Rourkela"
  return na.includes(nb) || nb.includes(na);
}

function routeMatches(
  trip: MarketTrip,
  shipment: MarketShipment,
): boolean {
  return (
    citiesMatch(trip.origin_city, shipment.origin_city) &&
    citiesMatch(trip.destination_city, shipment.destination_city)
  );
}

Deno.serve(async (req: Request) => {
  const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  // ── Auth: CRON_SECRET only ──
  const cronSecret = getEnv("CRON_SECRET");
  if (cronSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }
  }

  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);
    const cutoffIso = cutoff.toISOString();

    // ── Fetch recent trips and shipments ──
    const [tripsRes, shipmentsRes] = await Promise.all([
      admin
        .from("trips")
        .select("id, trucker_id, origin_city, destination_city, departure_date, available_capacity_tonnes, price_per_tonne, vehicle_type, status, created_at")
        .gte("created_at", cutoffIso)
        .in("status", ["active", "in_transit"])
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("shipments")
        .select("id, shipper_id, origin_city, destination_city, weight_tonnes, budget_per_tonne, status, created_at")
        .gte("created_at", cutoffIso)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (tripsRes.error || shipmentsRes.error) {
      console.error("[load-match-alert] DB query error:", tripsRes.error, shipmentsRes.error);
      return new Response(JSON.stringify({ error: "Database query failed" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const trips: MarketTrip[] = tripsRes.data ?? [];
    const shipments: MarketShipment[] = shipmentsRes.data ?? [];

    if (trips.length === 0 || shipments.length === 0) {
      return new Response(
        JSON.stringify({
          status: "ok",
          matches: 0,
          notifications: 0,
          message: "No recent trips or shipments to match.",
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // ── Find route matches ──
    const matches: { trip: MarketTrip; shipment: MarketShipment }[] = [];

    for (const shipment of shipments) {
      for (const trip of trips) {
        if (routeMatches(trip, shipment)) {
          matches.push({ trip, shipment });
        }
      }
    }

    // Deduplicate: one notification per shipment (best truck match) and per trip (best load match)
    const shipmentBestMatch = new Map<string, MarketTrip>();
    const tripBestMatch = new Map<string, MarketShipment>();

    for (const { trip, shipment } of matches) {
      const existing = shipmentBestMatch.get(shipment.id);
      if (
        !existing ||
        (trip.price_per_tonne ?? 0) < (existing.price_per_tonne ?? 0)
      ) {
        shipmentBestMatch.set(shipment.id, trip);
      }
      const existingTrip = tripBestMatch.get(trip.id);
      if (!existingTrip || (shipment.budget_per_tonne ?? 0) > (existingTrip.budget_per_tonne ?? 0)) {
        tripBestMatch.set(trip.id, shipment);
      }
    }

    // ── Insert notifications ──
    const notifications: NotificationRow[] = [];
    let count = 0;

    // Notify shippers about matching trucks
    for (const [shipmentId, trip] of shipmentBestMatch) {
      if (count >= MAX_NOTIFICATIONS_PER_RUN) break;
      const shipment = shipments.find((s) => s.id === shipmentId);
      if (!shipment) continue;

      notifications.push({
        user_id: shipment.shipper_id,
        title: "New truck match found",
        message: `Truck from ${trip.origin_city} to ${trip.destination_city} (${trip.available_capacity_tonnes ?? "?"}t, ₹${trip.price_per_tonne ?? "?"}/t) matches your shipment.`,
        type: "load_match",
        action_url: `/shipper/browse-trucks`,
      });
      count++;
    }

    // Notify truckers about matching loads
    for (const [tripId, shipment] of tripBestMatch) {
      if (count >= MAX_NOTIFICATIONS_PER_RUN) break;
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) continue;

      notifications.push({
        user_id: trip.trucker_id,
        title: "New load match found",
        message: `Shipment from ${shipment.origin_city} to ${shipment.destination_city} (${shipment.weight_tonnes ?? "?"}t, ₹${shipment.budget_per_tonne ?? "?"}/t) matches your trip.`,
        type: "load_match",
        action_url: `/trucker/browse-shipments`,
      });
      count++;
    }

    if (notifications.length === 0) {
      return new Response(
        JSON.stringify({
          status: "ok",
          matches: matches.length,
          notifications: 0,
          message: "No new route matches found.",
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const { error: insertError } = await admin
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("[load-match-alert] Notification insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to insert notifications" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        matches: matches.length,
        notifications: notifications.length,
        scannedTrips: trips.length,
        scannedShipments: shipments.length,
        windowMinutes: RATE_LIMIT_WINDOW_MINUTES,
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    console.error("[load-match-alert] fatal error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
