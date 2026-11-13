#!/usr/bin/env node
/**
 * Build-time sitemap generator for LoadSaathi.
 *
 * Regenerates public/sitemap.xml (copied to dist/ by Vite) from the same
 * slug sources the app and api/agent.js use, so the sitemap can never drift
 * into listing 404s, redirects, or duplicates.
 *
 * Included: canonical public URLs only (https, apex, no trailing slash).
 * Excluded: /screens/* (thin previews), /share/* (noindex by policy), auth
 * pages, private app routes, .html duplicates, non-HTML resources,
 * redirect sources (/freight-intelligence, legacy calculator URLs,
 * /transport/* alias, /location/vizag alias).
 *
 * Run: node scripts/generate-sitemap.mjs (wired as `prebuild`)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "sitemap.xml");
const BASE = "https://loadsaathi.in";
const TODAY = new Date().toISOString().slice(0, 10);

function extractSlugs(filePath, pattern) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const regex = new RegExp(pattern, "gm");
  const slugs = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    slugs.push(match[1]);
  }
  return [...new Set(slugs)];
}

/**
 * Extract lastmod dates from data files.
 * Blog: uses lastUpdated field (e.g., "July 5, 2026" → "2026-07-05")
 * Routes: uses RATES_UPDATED_AT from routes.ts
 */
function extractLastMod(filePath, slugList, dateFieldPattern) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const dates = {};
  for (const slug of slugList) {
    // Look for the slug and then find the date field after it
    const slugIdx = content.indexOf(`"${slug}"`);
    if (slugIdx === -1) continue;
    const afterSlug = content.slice(slugIdx, slugIdx + 2000);
    const dateMatch = afterSlug.match(dateFieldPattern);
    if (dateMatch) {
      // Parse "July 5, 2026" → "2026-07-05"
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed.getTime())) {
        dates[slug] = parsed.toISOString().slice(0, 10);
      }
    }
  }
  return dates;
}

// ── Static canonical pages: [path, changefreq, priority] ────────────────────
const STATIC = [
  ["/", "weekly", "1.0"],
  ["/features", "monthly", "0.9"],
  ["/how-it-works", "monthly", "0.9"],
  ["/guide", "weekly", "0.9"],
  ["/about", "monthly", "0.8"],
  ["/pricing", "monthly", "0.8"],
  ["/faq", "monthly", "0.7"],
  ["/contact", "monthly", "0.7"],
  ["/safety-trust", "monthly", "0.7"],
  ["/compare", "monthly", "0.8"],
  ["/compare/loadsaathi-vs-trucksuvidha", "monthly", "0.8"],
  ["/compare/loadsaathi-vs-blackbuck", "monthly", "0.8"],
  ["/privacy", "yearly", "0.3"],
  ["/terms", "yearly", "0.3"],
  ["/solutions/shippers", "monthly", "0.8"],
  ["/solutions/truckers", "monthly", "0.8"],
  ["/gallery", "monthly", "0.7"],
  ["/return-load", "weekly", "0.9"],
  ["/ptl-transport", "weekly", "0.9"],
  ["/ltl-transport", "weekly", "0.9"],
  ["/truck-load-booking", "weekly", "0.9"],
  ["/freight-marketplace", "weekly", "0.9"],
  ["/truck-near-me", "weekly", "0.9"],
  ["/tools", "monthly", "0.8"],
  ["/transport-cost-calculator", "monthly", "0.8"],
  ["/tools/fare-calculator", "monthly", "0.8"],
  ["/tools/freight-rate-calculator", "monthly", "0.9"],
  ["/tools/return-load-calculator", "monthly", "0.9"],
  ["/tools/truck-load-calculator", "monthly", "0.8"],
  ["/tools/ptl-vs-ftl-calculator", "monthly", "0.8"],
  ["/tools/route-optimizer", "monthly", "0.8"],
  ["/tools/empty-km-savings", "monthly", "0.8"],
  ["/tools/trip-profit", "monthly", "0.8"],
  ["/tools/shared-savings", "monthly", "0.8"],
  ["/tools/document-checklist", "monthly", "0.8"],
  ["/tools/carbon-savings", "monthly", "0.8"],
  ["/tools/toll-fuel", "monthly", "0.8"],
  ["/tools/gst-calculator", "monthly", "0.8"],
  ["/tools/payload-utilization", "monthly", "0.8"],
  ["/tools/shipment-brief", "monthly", "0.8"],
  ["/tools/waiting-time-cost", "monthly", "0.8"],
  ["/tools/freight-quote-comparison", "monthly", "0.8"],
  ["/tools/cargo-volume-planner", "monthly", "0.8"],
  ["/tools/load-securing-checklist", "monthly", "0.8"],
  ["/for-msmes", "monthly", "0.8"],
  ["/ai-logistics", "monthly", "0.8"],
  ["/data", "monthly", "0.8"],
  ["/blog", "weekly", "0.9"],
  ["/routes", "weekly", "0.9"],
  ["/sitemap", "monthly", "0.5"],
  ["/hi", "monthly", "0.8"],
  ["/hi/ptl-transport", "monthly", "0.8"],
  ["/hi/return-load", "monthly", "0.8"],
  ["/hi/bhada-kaise-book-kare", "monthly", "0.7"],
  ["/hi/route/rourkela-to-ranchi", "monthly", "0.7"],
  ["/odisha", "weekly", "0.9"],
  ["/odisha/kalinganagar-jajpur", "monthly", "0.8"],
  ["/odisha/paradeep", "monthly", "0.8"],
  ["/odisha/keonjhar-barbil", "monthly", "0.8"],
  ["/odisha/talcher-angul", "monthly", "0.8"],
  ["/odisha/dhenkanal", "monthly", "0.8"],
  ["/odisha/rayagada-koraput", "monthly", "0.8"],
  ["/odisha-freight-index-2026", "monthly", "0.8"],
];

// ── Dynamic slugs (same sources as scripts/prerender.mjs) ────────────────────
const ROUTE_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/data/routes.ts"),
  /slug:\s*"([^"]+)"/g
);
const BLOG_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/data/blog.ts"),
  /^\s+"([a-z0-9-]+)":\s*\{/gm
);
const GUIDE_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/data/guides.ts"),
  /^\s+"([a-z0-9-]+)":\s*\{/gm
);
const LOCATION_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/data/locations.ts"),
  /^\s+([a-z]+):\s*\{$/gm
).filter((s) => s !== "vizag" && s !== "serviceBlurbs" && s !== "about" && s !== "contactPoint" && s !== "speakable");
if (!LOCATION_SLUGS.includes("visakhapatnam")) LOCATION_SLUGS.push("visakhapatnam");
const TRANSPORT_SERVICE_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/data/transportServices.ts"),
  /^  ([a-z-]+): \{$/gm
).filter((s) => !["serviceBlurbs", "about", "contactPoint"].includes(s));

// Extract real lastmod dates from data files
// - Blog/guides: use lastUpdated when present; otherwise fall back to the
//   published `date` (never the build date — a rebuild does not mean the
//   article changed).
// - Static pages and locations: content changes are rare and editorial, so
//   they get a fixed baseline date instead of today's build date.
const BLOG_DATES = extractLastMod(
  path.join(ROOT, "supabase/src/data/blog.ts"),
  BLOG_SLUGS,
  /lastUpdated:\s*"([^"]+)"/
);
const GUIDE_DATES = extractLastMod(
  path.join(ROOT, "supabase/src/data/guides.ts"),
  GUIDE_SLUGS,
  /lastUpdated:\s*"([^"]+)"/
);
const BLOG_PUBLISHED = extractLastMod(
  path.join(ROOT, "supabase/src/data/blog.ts"),
  BLOG_SLUGS,
  /date:\s*"([^"]+)"/
);
const GUIDE_PUBLISHED = extractLastMod(
  path.join(ROOT, "supabase/src/data/guides.ts"),
  GUIDE_SLUGS,
  /date:\s*"([^"]+)"/
);
const ROUTE_DATES = extractLastMod(
  path.join(ROOT, "supabase/src/data/routes.ts"),
  ROUTE_SLUGS,
  /dataStatus:\s*"([^"]+)"/
);
// Routes use RATES_UPDATED_AT as a fallback for lastmod
const RATES_UPDATED = "2026-10-01"; // Matches RATES_UPDATED_AT in routes.ts
// Stable baseline for content that only changes on editorial release.
const STATIC_LASTMOD = "2026-10-01";

const urls = [
  ...STATIC.map(([p, changefreq, priority]) => ({ loc: `${BASE}${p}`, changefreq, priority, lastmod: STATIC_LASTMOD })),
  ...ROUTE_SLUGS.map((s) => ({ loc: `${BASE}/routes/${s}`, changefreq: "monthly", priority: "0.7", lastmod: ROUTE_DATES[s] || RATES_UPDATED })),
  ...LOCATION_SLUGS.map((s) => ({ loc: `${BASE}/location/${s}`, changefreq: "monthly", priority: "0.8", lastmod: STATIC_LASTMOD })),
  ...TRANSPORT_SERVICE_SLUGS.map((s) => ({ loc: `${BASE}/transport-service/${s}`, changefreq: "monthly", priority: "0.8", lastmod: STATIC_LASTMOD })),
  ...GUIDE_SLUGS.map((s) => ({ loc: `${BASE}/guide/${s}`, changefreq: "monthly", priority: "0.7", lastmod: GUIDE_DATES[s] || GUIDE_PUBLISHED[s] || STATIC_LASTMOD })),
  ...BLOG_SLUGS.map((s) => ({ loc: `${BASE}/blog/${s}`, changefreq: "monthly", priority: "0.6", lastmod: BLOG_DATES[s] || BLOG_PUBLISHED[s] || STATIC_LASTMOD })),
];

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod || TODAY}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

fs.writeFileSync(OUT, xml, "utf-8");
console.log(
  `[sitemap] wrote ${urls.length} canonical URLs to public/sitemap.xml ` +
    `(${STATIC.length} static, ${ROUTE_SLUGS.length} routes, ${LOCATION_SLUGS.length} locations, ` +
    `${TRANSPORT_SERVICE_SLUGS.length} transport-service, ${GUIDE_SLUGS.length} guides, ${BLOG_SLUGS.length} blog)`
);

// ── COVERAGE auto-sync ────────────────────────────────────────────────────────
// The "verifiable counts" in api/site.js and site.ts are asserted against the
// sitemap by scripts/smoke.mjs. Instead of hand-editing them whenever content
// is added (they had already drifted: 212 vs the real count), patch them here —
// so a new blog post or lane updates the source of truth in the same build.
const coverage = {
  sitemapUrls: urls.length,
  freightRoutes: ROUTE_SLUGS.length,
  cityPages: LOCATION_SLUGS.length,
};

function patchCoverage(file) {
  if (!fs.existsSync(file)) {
    console.error(`[sitemap] COVERAGE sync failed — missing file: ${path.relative(ROOT, file)}`);
    process.exitCode = 1;
    return;
  }
  let src = fs.readFileSync(file, "utf-8");
  let changed = false;
  for (const [key, value] of Object.entries(coverage)) {
    const re = new RegExp(`(${key}:\\s*)(\\d+)`);
    const m = src.match(re);
    if (!m) {
      console.error(`[sitemap] COVERAGE sync failed — "${key}" not found in ${path.relative(ROOT, file)}`);
      process.exitCode = 1;
      return;
    }
    if (m[2] !== String(value)) {
      src = src.replace(re, `$1${value}`);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, src, "utf-8");
    console.log(`[sitemap] synced COVERAGE in ${path.relative(ROOT, file)}:`, coverage);
  }
}

patchCoverage(path.join(ROOT, "api", "site.js"));
patchCoverage(path.join(ROOT, "supabase", "src", "config", "site.ts"));
