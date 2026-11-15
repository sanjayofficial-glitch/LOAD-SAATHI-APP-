export const MAP_W = 760;
export const MAP_H = 420;

/** The shared trip: Pune depot → three pickups along the way → Mumbai hub */
export const ROUTE_D =
  "M60 310 H190 Q230 310 230 270 V230 Q230 190 270 190 H360 Q400 190 400 230 V270 Q400 310 440 310 H520 Q560 310 560 270 V150 Q560 110 600 110 H690";

export const DEPOT = { x: 60, y: 310 };
export const DEST = { x: 690, y: 110 };

export const CAPACITY_T = 3.6;
export const FULL_TRUCK_RATE = 24000;

export type LoadId = "A" | "B" | "C";
export type LabelSide = "top" | "bottom" | "left" | "right";

export interface LoadDef {
  id: LoadId;
  name: string;
  cargo: string;
  business: string;
  weight: number;
  color: string;
  soft: string;
  /** Point on the road where the truck stops */
  road: { x: number; y: number };
  /** Where the business building sits on the map */
  pin: { x: number; y: number };
  labelSide: LabelSide;
  you?: boolean;
}

export const LOADS: LoadDef[] = [
  {
    id: "A",
    name: "Load A",
    cargo: "Steel",
    business: "Steel Mill",
    weight: 1.2,
    color: "#2e6fb5",
    soft: "#dcebf9",
    road: { x: 230, y: 250 },
    pin: { x: 150, y: 212 },
    labelSide: "bottom",
    you: true,
  },
  {
    id: "B",
    name: "Load B",
    cargo: "FMCG",
    business: "FMCG Warehouse",
    weight: 0.8,
    color: "#7a6fd0",
    soft: "#e9e6f8",
    road: { x: 330, y: 190 },
    pin: { x: 330, y: 128 },
    labelSide: "right",
  },
  {
    id: "C",
    name: "Load C",
    cargo: "Agro",
    business: "Agro Mandi",
    weight: 1.0,
    color: "#2fa39a",
    soft: "#d9f1ee",
    road: { x: 560, y: 210 },
    pin: { x: 652, y: 252 },
    labelSide: "bottom",
  },
];

export const LOAD_BY_ID: Record<LoadId, LoadDef> = {
  A: LOADS[0]!,
  B: LOADS[1]!,
  C: LOADS[2]!,
};

/** Illustrative cost model: pay for the space you fill + a small handling fee */
export const sharePct = (id: LoadId) =>
  Math.round((LOAD_BY_ID[id].weight / CAPACITY_T) * 100) + 2;
export const shareAmount = (id: LoadId) =>
  Math.round((FULL_TRUCK_RATE * sharePct(id)) / 100 / 10) * 10;

/* ---------- Route sampling (so the truck follows the exact road) ---------- */

const SAMPLES = 900;
let table: { x: number; y: number }[] | null = null;

/**
 * Safe fallback when SVG geometry APIs are unavailable (jsdom, very old
 * browsers, or a stripped-down WebView). Approximates the route as a straight
 * line between the depot and the destination — the visualizer degrades to a
 * straight run instead of taking down the hero with a thrown error.
 */
function buildFallbackTable(): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    pts.push({
      x: DEPOT.x + (DEST.x - DEPOT.x) * t,
      y: DEPOT.y + (DEST.y - DEPOT.y) * t,
    });
  }
  return pts;
}

function getTable() {
  if (table) return table;
  try {
    if (typeof document === "undefined" || !document.body) {
      table = buildFallbackTable();
      return table;
    }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.style.visibility = "hidden";
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", ROUTE_D);
    svg.appendChild(path);
    document.body.appendChild(svg);
    // getTotalLength is not implemented in every DOM (jsdom) — bail to the
    // fallback rather than throwing during render.
    if (typeof path.getTotalLength !== "function") {
      document.body.removeChild(svg);
      table = buildFallbackTable();
      return table;
    }
    const len = path.getTotalLength();
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const p = path.getPointAtLength((len * i) / SAMPLES);
      pts.push({ x: p.x, y: p.y });
    }
    document.body.removeChild(svg);
    table = pts;
  } catch {
    table = buildFallbackTable();
  }
  return table;
}

/** Point on the route for progress 0..1 */
export function pointAt(t: number) {
  const pts = getTable();
  const f = Math.min(1, Math.max(0, t)) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(f));
  const k = f - i;
  const p0 = pts[i]!;
  const p1 = pts[i + 1]!;
  return {
    x: p0.x + (p1.x - p0.x) * k,
    y: p0.y + (p1.y - p0.y) * k,
  };
}

/** Route progress (0..1) closest to a given map coordinate */
export function progressFor(x: number, y: number) {
  const pts = getTable();
  let best = 0;
  let bestD = Infinity;
  pts.forEach((p, i) => {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best / SAMPLES;
}

export const pct = (v: number, total: number) => `${(v / total) * 100}%`;
