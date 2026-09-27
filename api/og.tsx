export const config = { runtime: "edge" };

import { ImageResponse } from "@vercel/og";
import { createElement as h, type ReactElement, type ReactNode } from "react";

const ACCENT = "rgb(255, 121, 26)";
const BG = "#0f172a";
const CARD_BG = "#1e293b";
const MUTED = "#94a3b8";
const FG = "#f8fafc";
const SUB = "#cbd5e1";
const DIVIDER = "#334155";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Kind = "trip" | "shipment";

type TripRow = {
  origin_city?: string;
  destination_city?: string;
  departure_date?: string;
  available_capacity_tonnes?: number;
  price_per_tonne?: number;
  vehicle_type?: string;
};

type ShipmentRow = {
  origin_city?: string;
  destination_city?: string;
  departure_date?: string;
  goods_description?: string;
  weight_tonnes?: number;
  budget_per_tonne?: number;
};

function clip(value: string, max: number): string {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function padDate(raw?: string): string {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10);
  try {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return raw.slice(0, 10);
  }
}

function inr(value?: number): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `₹${value.toLocaleString("en-IN")}`;
}

function num(value?: number): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return String(value);
}

function pick(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value.trim() : fallback;
}

async function fetchRow(kind: Kind, id: string): Promise<TripRow | ShipmentRow | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;
  const table = kind === "trip" ? "trips" : "shipments";
  const select =
    kind === "trip"
      ? "origin_city,destination_city,departure_date,available_capacity_tonnes,price_per_tonne,vehicle_type"
      : "origin_city,destination_city,departure_date,goods_description,weight_tonnes,budget_per_tonne";
  const endpoint = `${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=${select}&limit=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const rows = (await response.json()) as Array<TripRow | ShipmentRow>;
    return rows[0] ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function shell(children: ReactNode): ReactElement {
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: BG,
        color: FG,
        fontFamily: "geist",
        fontWeight: 400,
      },
    },
    children,
  );
}

function header(badge: string): ReactNode {
  return h(
    "div",
    {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "44px 64px 0",
      },
    },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
      h("span", { style: { fontSize: 46, color: ACCENT } }, "LoadSaathi"),
      h("span", { style: { fontSize: 22, color: MUTED, marginTop: 6 } }, "Precision Freight Intelligence"),
    ),
    h(
      "div",
      {
        style: {
          backgroundColor: "rgba(255,121,26,0.15)",
          color: ACCENT,
          borderRadius: 999,
          padding: "12px 28px",
          fontSize: 22,
          letterSpacing: "0.12em",
        },
      },
      badge,
    ),
  );
}

function routeLine(origin: string, dest: string): ReactNode {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 28, padding: "48px 64px 0" } },
    h("span", { style: { fontSize: 70 } }, origin),
    h("span", { style: { fontSize: 58, color: ACCENT } }, "→"),
    h("span", { style: { fontSize: 70 } }, dest),
  );
}

function statCard(label: string, value: string, valueColor = FG): ReactNode {
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
        backgroundColor: CARD_BG,
        borderRadius: 20,
        padding: "24px 32px",
        minWidth: 320,
      },
    },
    h("span", { style: { fontSize: 18, color: MUTED, letterSpacing: "0.14em" } }, label),
    h("span", { style: { fontSize: 38, color: valueColor } }, value),
  );
}

function footer(): ReactNode {
  return h(
    "div",
    {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "24px 64px 40px",
      },
    },
    h("span", { style: { fontSize: 26, color: MUTED } }, "loadsaathi.in"),
    h("span", { style: { fontSize: 26, color: ACCENT } }, "Book shared freight online"),
  );
}

function accentBar(): ReactNode {
  return h("div", { style: { height: 12, backgroundColor: ACCENT, width: "100%" } });
}

function subtitleLine(text: string): ReactNode {
  return h("div", { style: { padding: "24px 64px 0", fontSize: 26, color: SUB } }, text);
}

function cardRow(cards: ReactNode[]): ReactNode {
  return h("div", { style: { display: "flex", gap: 24, padding: "40px 64px 0" } }, ...cards);
}

function cardTail(): ReactNode[] {
  return [
    h("div", { style: { flex: 1 } }),
    h("div", { style: { height: 1, backgroundColor: DIVIDER, margin: "0 64px" } }),
    footer(),
  ];
}

function buildCard(kind: Kind | null, row: TripRow | ShipmentRow | null): ReactElement {
  if (!row || !kind) {
    return shell([
      accentBar(),
      header("SHARED FREIGHT"),
      routeLine("PTL & LTL Freight", "Across East India"),
      subtitleLine("Verified truckers, live routes and fair rates — book part loads online."),
      cardRow([
        statCard("PLATFORM", "PTL & LTL"),
        statCard("REGION", "East India"),
        statCard("ONLINE", "loadsaathi.in", ACCENT),
      ]),
      ...cardTail(),
    ]);
  }

  const origin = pick(row.origin_city, "Origin");
  const dest = pick(row.destination_city, "Destination");

  if (kind === "trip") {
    const trip = row as TripRow;
    const parts: string[] = [];
    if (trip.vehicle_type?.trim()) parts.push(trip.vehicle_type.trim());
    const cap = num(trip.available_capacity_tonnes);
    if (cap) parts.push(`${cap}T available`);
    const rate = inr(trip.price_per_tonne);
    return shell([
      accentBar(),
      header("TRUCK SPACE"),
      routeLine(origin, dest),
      subtitleLine(parts.length ? parts.join(" · ") : "Available truck space"),
      cardRow([
        statCard("DEPARTURE", padDate(trip.departure_date)),
        statCard("CAPACITY", cap ? `${cap}T` : "—"),
        statCard("RATE", rate ? `${rate}/T` : "—", ACCENT),
      ]),
      ...cardTail(),
    ]);
  }

  const shipment = row as ShipmentRow;
  const goods = shipment.goods_description?.trim();
  const weight = num(shipment.weight_tonnes);
  const budget = inr(shipment.budget_per_tonne);
  return shell([
    accentBar(),
    header("LOAD AVAILABLE"),
    routeLine(origin, dest),
    subtitleLine(goods ? clip(goods, 70) : "Goods transport load"),
    cardRow([
      statCard("PICKUP BY", padDate(shipment.departure_date)),
      statCard("WEIGHT", weight ? `${weight}T` : "—"),
      statCard("BUDGET", budget ? `${budget}/T` : "—", ACCENT),
    ]),
    ...cardTail(),
  ]);
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawType = url.searchParams.get("type");
  const rawId = url.searchParams.get("id") ?? "";
  const kind: Kind | null = rawType === "trip" || rawType === "shipment" ? rawType : null;
  const row = kind && UUID_RE.test(rawId) ? await fetchRow(kind, rawId) : null;
  const image = new ImageResponse(buildCard(kind, row), {
    width: 1200,
    height: 630,
    headers: { "cache-control": "public, max-age=300, must-revalidate" },
  });
  return image as unknown as Response;
}
