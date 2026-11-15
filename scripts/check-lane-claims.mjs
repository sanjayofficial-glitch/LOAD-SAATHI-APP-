#!/usr/bin/env node
/**
 * Guards every content file against contradicting the canonical lane table.
 *
 * Any prose that names a lane (City A → City B, in any of the separators the
 * corpus uses) and then states a distance for it must state the canonical
 * distance. A lane that reads 420 km on its own page and 530 km in the guide
 * beside it is the contradiction that makes a whole corridor cluster look
 * untrustworthy.
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

// City-pair -> canonical distance, with the lane's own city names.
const lanes = [...bySlug.values()].map((r) => ({
  from: r.from,
  to: r.to,
  km: r.distanceKm,
  slug: r.slug,
}));

const DIRS = ["supabase/src/data/blog", "supabase/src/data"];
const files = [];
for (const dir of DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    if (f.endsWith(".ts") && !f.endsWith(".d.ts")) files.push(path.join(abs, f));
  }
}

const problems = [];
let claimsChecked = 0;

for (const filePath of files) {
  const src = fs.readFileSync(filePath, "utf8");
  for (const lane of lanes) {
    // "Rourkela–Ranchi", "Rourkela to Ranchi", "Rourkela-Ranchi" (but not the
    // slug form "rourkela-to-ranchi", which is handled separately).
    const nameRe = new RegExp(
      `${lane.from}\\s*(?:to|-|–|—|&ndash;)\\s*${lane.to}`,
      "gi",
    );
    for (const m of src.matchAll(nameRe)) {
      // Look at a window around the lane mention for a distance claim.
      const window = src.slice(m.index, m.index + 160);
      const kmMatch = window.match(/(\d{2,4})\s?km/i);
      if (!kmMatch) continue;
      claimsChecked++;
      const stated = Number(kmMatch[1]);
      if (stated !== lane.km) {
        problems.push({
          file: path.relative(ROOT, filePath),
          lane: `${lane.from}-${lane.to}`,
          stated,
          canonical: lane.km,
          context: window.slice(0, 90).replace(/\s+/g, " "),
        });
      }
    }
  }
}

console.log(`checked ${claimsChecked} lane-distance claim(s) across ${files.length} content files`);
if (problems.length === 0) {
  console.log("every lane distance in the corpus matches the canonical table");
} else {
  console.log(`\n${problems.length} contradiction(s):`);
  for (const p of problems) {
    console.log(
      `  ${p.file}\n     ${p.lane}: states ${p.stated} km, canonical is ${p.canonical} km\n     "${p.context}..."`,
    );
  }
  process.exitCode = 1;
}
