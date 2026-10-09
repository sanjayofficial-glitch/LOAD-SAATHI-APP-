#!/usr/bin/env node
/**
 * Regenerates the "Corridor Rate Guide" section of public/llms.txt from
 * supabase/src/data/routes.ts — the single source of truth for lane data.
 *
 * Distances, transit times, lane list and rate bands can never drift from the
 * published pages because this script derives all of them from routes.ts using
 * the same formulas as rateBand() (supabase/src/data/routes.ts) and
 * laneRates() (api/agent.js):
 *
 *   FTL per truck = distance x 85 .. 120
 *   PTL per tonne = max(distance x 17, 1200) .. max(distance x 24, 1500)
 *
 * Run: node scripts/generate-llms-routes.mjs (wired as part of `prebuild`)
 * Idempotent: replaces the section between the "## Corridor Rate Guide"
 * heading and the "Q: What is the cheapest way" FAQ line.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ROUTES_TS = path.join(ROOT, "supabase/src/data/routes.ts");
const LLMS = path.join(ROOT, "public/llms.txt");

const RATE_STAMP = "October 2026";

function fmt(n) {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return parts.join(",") + "," + last3;
}

function parseLanes(src) {
  const lanes = [];
  const re =
    /\{\s*slug:\s*"([^"]+)",\s*from:\s*"([^"]+)",\s*to:\s*"([^"]+)",\s*fromState:\s*"[^"]+",\s*toState:\s*"[^"]+",\s*distanceKm:\s*(\d+),\s*transitTime:\s*"([^"]+)",\s*dataStatus:\s*"(\w+)"/g;
  let m;
  while ((m = re.exec(src))) {
    lanes.push({ slug: m[1], from: m[2], to: m[3], km: Number(m[4]), transit: m[5], status: m[6] });
  }
  return lanes;
}

const lanes = parseLanes(fs.readFileSync(ROUTES_TS, "utf-8"));
if (!lanes.length) throw new Error("no lanes parsed from routes.ts");

let minKg = Infinity;
let maxKg = -Infinity;
let minFtl = Infinity;
let maxFtl = -Infinity;

const rows = lanes.map((l) => {
  const ftlMin = l.km * 85;
  const ftlMax = l.km * 120;
  const ptlMin = Math.max(l.km * 17, 1200);
  const ptlMax = Math.max(l.km * 24, 1500);
  minKg = Math.min(minKg, ptlMin / 1000);
  maxKg = Math.max(maxKg, ptlMax / 1000);
  minFtl = Math.min(minFtl, ftlMin);
  maxFtl = Math.max(maxFtl, ftlMax);
  return `| ${l.from} → ${l.to} | ${l.km} km | ₹${fmt(ftlMin)}–₹${fmt(ftlMax)} | ₹${fmt(ptlMin)}–₹${fmt(ptlMax)}/tonne |`;
});

const kg = (n) => (n < 10 ? `₹${n.toFixed(1).replace(/\.0$/, "")}` : `₹${Math.round(n)}`);

const section = [
  `## Corridor Rate Guide (indicative, ${RATE_STAMP})`,
  "",
  "Indicative East-India freight bands computed from LoadSaathi's rate model (FTL ₹85–120/km trip rate; PTL at 2× the FTL per-tonne rate, floored at ₹1,200/tonne). Live quotes vary by truck type, season, and load — verify with the fare calculator.",
  "",
  "| Corridor | Distance | Full truck (FTL) | Shared (PTL) |",
  "|---|---|---|---|",
  ...rows,
  "",
  "Q: How much does PTL freight cost per kg in East India?",
  `A: Indicative shared-load (PTL) rates on LoadSaathi corridors range from about ${kg(minKg)}/kg on short hops (Cuttack–Bhubaneswar, 30 km) to about ${kg(maxKg)}/kg on long hauls (Ranchi–Bhubaneswar, 470 km). Full-truck (FTL) trip rates range from roughly ₹${fmt(minFtl)} to ₹${fmt(maxFtl)} by the same model. See the corridor table above; live quotes depend on truck type and season. Rates updated ${RATE_STAMP}.`,
  "",
  "",
].join("\n");

let text = fs.readFileSync(LLMS, "utf-8");
const eol = text.includes("\r\n") ? "\r\n" : "\n";
const startRe = /## Corridor Rate Guide[^\r\n]*/;
const endRe = /Q: What is the cheapest way/;
const start = text.search(startRe);
const end = text.search(endRe);
if (start < 0 || end < 0 || end < start) {
  throw new Error("llms.txt anchors not found (## Corridor Rate Guide / Q: What is the cheapest way)");
}

const normalized = section.replace(/\n/g, eol);
text = text.slice(0, start) + normalized + text.slice(end);
fs.writeFileSync(LLMS, text, "utf-8");

console.log(
  `[llms] regenerated corridor table in public/llms.txt (${lanes.length} lanes, ${RATE_STAMP})`
);
