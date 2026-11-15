#!/usr/bin/env node
/**
 * Guards the anonymous-shell bundle budget.
 *
 * Sums gzip sizes of the chunks the public homepage pulls eagerly (posthog,
 * forms, leaflet, recharts are lazy/authed-only and excluded). If the budget
 * is exceeded, the build fails with a clear message — run `vite build` and
 * inspect `dist/assets` first to see what grew.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "dist", "assets");

/** Core eager chunks (prefixes). posthog/leaflet/recharts/forms are lazy or authed-only. */
const CORE_PREFIXES = [
  "index-",
  "App-",
  "theme-",
  "vendor-motion-",
  "vendor-router-",
  "vendor-query-",
  "vendor-clerk-",
  "vendor-supabase-",
  "vendor-icons-",
  "vendor-sonner-",
];

const LIMIT_KB_GZ = 260;

if (!fs.existsSync(ASSETS)) {
  console.error("[bundle] dist/assets not found — run `vite build` first.");
  process.exit(1);
}

const files = fs.readdirSync(ASSETS).filter((f) => f.endsWith(".js"));
let total = 0;
const rows = [];
for (const prefix of CORE_PREFIXES) {
  const f = files.find((x) => x.startsWith(prefix));
  if (!f) {
    console.warn(`[bundle] core chunk missing: ${prefix}*`);
    continue;
  }
  const gz = zlib.gzipSync(fs.readFileSync(path.join(ASSETS, f))).length;
  total += gz;
  rows.push(`  ${(gz / 1024).toFixed(1).padStart(6)} KB  ${f}`);
}

console.log(`[bundle] anonymous shell gzip: ${(total / 1024).toFixed(1)} KB (limit ${LIMIT_KB_GZ} KB)`);
rows.forEach((r) => console.log(r));

if (total / 1024 > LIMIT_KB_GZ) {
  console.error(
    `[bundle] FAIL — anonymous shell is ${(total / 1024).toFixed(1)} KB gzip, limit ${LIMIT_KB_GZ} KB. ` +
      "Defer or lazy-load the largest chunk (see the breakdown above).",
  );
  process.exit(1);
}
console.log("[bundle] OK");
