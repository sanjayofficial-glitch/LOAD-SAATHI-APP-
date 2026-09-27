// Open Graph image generator for /share/trip/:id and /share/shipment/:id.
//
// Runtime and location are both load-bearing; do not "simplify" either.
//
// Runtime must be edge, not nodejs. @vercel/og@1.0.3 ships two builds behind
// conditional exports: the "edge" condition resolves to dist/index.edge.js,
// which is self-contained, while "node"/"import"/"default" all resolve to
// dist/index.node.js, which pulls in harfbuzzjs@0.10.0 and performs a dynamic
// require("fs"). On the Node runtime that file is loaded as ESM, where require()
// is illegal, so every request died with:
//
//   Error: Dynamic require of "fs" is not supported
//     at @vercel/og/dist/index.node.js:13
//
// The edge build has no such problem. It does, however, hit a different
// failure when this file sat directly in api/ next to api/agent.js: Vercel
// code-splits edge functions within a directory into a shared chunk, charged
// this file's @vercel/og import to its sibling, and failed the whole build:
//
//   The Edge Function "api/agent" is referencing unsupported modules:
//   - @vercel: module
//
// Moving the function into its own api/og/ directory isolates it from that
// grouping. An index.js maps back to the same public URL, /api/og, so every
// caller and the meta tags emitted by api/agent.js are unaffected.
//
// This file is plain JavaScript rather than TypeScript. Vercel transpiles a
// .ts/.tsx entrypoint to .js and the resulting bundle then fails to load as
// ESM (SyntaxError: Unexpected token 'export'), which cost an earlier deploy.
// A native .js entrypoint loads correctly, exactly like the sibling
// api/cron/diesel.js. The body is free of JSX -- it builds elements with
// createElement, aliased to h -- so conversion was only ever a matter of
// moving type annotations into JSDoc.

/**
 * @typedef {"trip" | "shipment"} Kind
 * @typedef {{ origin_city?: string, destination_city?: string, departure_date?: string,
 *             available_capacity_tonnes?: number, price_per_tonne?: number,
 *             vehicle_type?: string }} TripRow
 * @typedef {{ origin_city?: string, destination_city?: string, departure_date?: string,
 *             goods_description?: string, weight_tonnes?: number,
 *             budget_per_tonne?: number }} ShipmentRow
 */

export const config = { runtime: "edge" };

import { ImageResponse } from "@vercel/og";
import { createElement as h } from "react";

const ACCENT = "rgb(255, 121, 26)";
const BG = "#0f172a";
const CARD_BG = "#1e293b";
const MUTED = "#94a3b8";
const FG = "#f8fafc";
const SUB = "#cbd5e1";
const DIVIDER = "#334155";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @param {string} value @param {number} max */
function clip(value, max) {
  const text = String(value).trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** @param {string} [raw] */
function padDate(raw) {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw).slice(0, 10);
  try {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(raw).slice(0, 10);
  }
}

/** @param {number} [value] */
function inr(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `₹${value.toLocaleString("en-IN")}`;
}

/** @param {number} [value] */
function num(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return String(value);
}

/** @param {string} [value] @param {string} fallback */
function pick(value, fallback) {
  return value && String(value).trim() ? String(value).trim() : fallback;
}

/**
 * @param {Kind} kind
 * @param {string} id
 * @returns {Promise<TripRow | ShipmentRow | null>}
 */
async function fetchRow(kind, id) {
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
    const rows = await response.json();
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** @param {any} children */
function shell(children) {
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

/** @param {string} badge */
function header(badge) {
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
      h(
        "span",
        { style: { fontSize: 22, color: MUTED, marginTop: 6 } },
        "Precision Freight Intelligence",
      ),
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

/** @param {string} origin @param {string} dest */
function routeLine(origin, dest) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 28, padding: "48px 64px 0" } },
    h("span", { style: { fontSize: 70 } }, origin),
    h("span", { style: { fontSize: 58, color: ACCENT } }, "→"),
    h("span", { style: { fontSize: 70 } }, dest),
  );
}

/** @param {string} label @param {string} value @param {string} [valueColor] */
function statCard(label, value, valueColor = FG) {
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

function footer() {
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

function accentBar() {
  return h("div", { style: { height: 12, backgroundColor: ACCENT, width: "100%" } });
}

/** @param {string} text */
function subtitleLine(text) {
  return h(
    "div",
    { style: { padding: "24px 64px 0", fontSize: 26, color: SUB } },
    text,
  );
}

/** @param {any[]} cards */
function cardRow(cards) {
  return h("div", { style: { display: "flex", gap: 24, padding: "40px 64px 0" } }, ...cards);
}

function cardTail() {
  return [
    h("div", { style: { flex: 1 } }),
    h("div", { style: { height: 1, backgroundColor: DIVIDER, margin: "0 64px" } }),
    footer(),
  ];
}

/**
 * @param {Kind | null} kind
 * @param {TripRow | ShipmentRow | null} row
 */
function buildCard(kind, row) {
  if (!row || !kind) {
    return shell([
      accentBar(),
      header("SHARED FREIGHT"),
      routeLine("PTL & LTL Freight", "Across East India"),
      subtitleLine(
        "Verified truckers, live routes and fair rates — book part loads online.",
      ),
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
    /** @type {TripRow} */
    const trip = row;
    const parts = [];
    if (trip.vehicle_type && String(trip.vehicle_type).trim()) {
      parts.push(String(trip.vehicle_type).trim());
    }
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

  /** @type {ShipmentRow} */
  const shipment = row;
  const goods =
    shipment.goods_description && String(shipment.goods_description).trim()
      ? String(shipment.goods_description).trim()
      : null;
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

export default async function handler(request) {
  const url = new URL(request.url);
  const rawType = url.searchParams.get("type");
  const rawId = url.searchParams.get("id") ?? "";
  const kind = rawType === "trip" || rawType === "shipment" ? rawType : null;
  const row = kind && UUID_RE.test(rawId) ? await fetchRow(kind, rawId) : null;
  const image = new ImageResponse(buildCard(kind, row), {
    width: 1200,
    height: 630,
    headers: { "cache-control": "public, max-age=300, must-revalidate" },
  });
  return image;
}
