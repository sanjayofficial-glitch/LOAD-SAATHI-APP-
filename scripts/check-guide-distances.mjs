#!/usr/bin/env node
/**
 * Checks the rate guides (supabase/src/data/blog/*-freight-rates.ts,
 * *-trucking-rates.ts) against the canonical lane table.
 *
 * A guide that states a different distance than the lane page it sits next to
 * is the exact contradiction that made Google distrust the corridor cluster,
 * so this is a hard check, not a lint.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const canonical = JSON.parse(
  fs.readFileSync(path.join(ROOT, "api/routeData.json"), "utf8"),
);
const bySlug = new Map(Object.entries(canonical));

const blogDir = path.join(ROOT, "supabase/src/data/blog");
const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".ts"));

const problems = [];
let checked = 0;

for (const file of files) {
  const slug = file.replace(/\.ts$/, "");
  if (!/-(freight-rates|trucking-rates)$/.test(slug)) continue;

  // Map the guide to its lane: "rourkela-to-ranchi-trucking-rates" ->
  // "rourkela-to-ranchi".
  const laneSlug = slug.replace(/-(freight-rates|trucking-rates)$/, "");
  const lane = bySlug.get(laneSlug);
  if (!lane) {
    problems.push({ file, reason: "no matching lane in the canonical table" });
    continue;
  }
  checked++;

  const src = fs.readFileSync(path.join(blogDir, file), "utf8");
  const km = lane.distanceKm;
  // Distance mentions in the prose.
  const mentions = [...src.matchAll(/(\d{2,4})\s?km/gi)].map((m) => Number(m[1]));
  // The lane's own distance may legitimately appear; anything else is a
  // contradiction (e.g. a "530 km" claim on a 420 km lane).
  const wrong = [...new Set(mentions)].filter((v) => v !== km);
  if (wrong.length) {
    problems.push({
      file,
      reason: `states ${wrong.join(", ")} km but the lane is ${km} km`,
    });
  }
}

console.log(`checked ${checked} corridor guides`);
if (problems.length === 0) {
  console.log("all guide distances agree with the canonical lane table");
} else {
  console.log(`\n${problems.length} contradiction(s):`);
  for (const p of problems) console.log(`  ${p.file}: ${p.reason}`);
  process.exitCode = 1;
}
