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

// ── Static canonical pages: [path, changefreq, priority] ────────────────────
const STATIC = [
  ["/", "weekly", "1.0"],
  ["/features", "monthly", "0.9"],
  ["/how-it-works", "monthly", "0.9"],
  ["/about", "monthly", "0.8"],
  ["/pricing", "monthly", "0.8"],
  ["/faq", "monthly", "0.7"],
  ["/contact", "monthly", "0.7"],
  ["/safety-trust", "monthly", "0.7"],
  ["/compare", "monthly", "0.8"],
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
  ["/for-msmes", "monthly", "0.8"],
  ["/ai-logistics", "monthly", "0.8"],
  ["/data", "monthly", "0.8"],
  ["/blog", "weekly", "0.9"],
  ["/routes", "weekly", "0.9"],
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
  path.join(ROOT, "supabase/src/pages/public/guides/GuidePage.tsx"),
  /^\s+"([a-z0-9-]+)":\s*\{/gm
);
const LOCATION_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/pages/public/locations/LocationPage.tsx"),
  /^\s+([a-z]+):\s*\{$/gm
).filter((s) => s !== "vizag" && s !== "serviceBlurbs" && s !== "about" && s !== "contactPoint");
if (!LOCATION_SLUGS.includes("visakhapatnam")) LOCATION_SLUGS.push("visakhapatnam");
const TRANSPORT_SERVICE_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/pages/public/transport/TransportServicePage.tsx"),
  /^  ([a-z-]+): \{$/gm
).filter((s) => !["serviceBlurbs", "about", "contactPoint"].includes(s));

const urls = [
  ...STATIC.map(([p, changefreq, priority]) => ({ loc: `${BASE}${p}`, changefreq, priority })),
  ...ROUTE_SLUGS.map((s) => ({ loc: `${BASE}/routes/${s}`, changefreq: "monthly", priority: "0.7" })),
  ...LOCATION_SLUGS.map((s) => ({ loc: `${BASE}/location/${s}`, changefreq: "monthly", priority: "0.8" })),
  ...TRANSPORT_SERVICE_SLUGS.map((s) => ({ loc: `${BASE}/transport-service/${s}`, changefreq: "monthly", priority: "0.8" })),
  ...GUIDE_SLUGS.map((s) => ({ loc: `${BASE}/guide/${s}`, changefreq: "monthly", priority: "0.7" })),
  ...BLOG_SLUGS.map((s) => ({ loc: `${BASE}/blog/${s}`, changefreq: "monthly", priority: "0.6" })),
];

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

fs.writeFileSync(OUT, xml, "utf-8");
console.log(
  `[sitemap] wrote ${urls.length} canonical URLs to public/sitemap.xml ` +
    `(${STATIC.length} static, ${ROUTE_SLUGS.length} routes, ${LOCATION_SLUGS.length} locations, ` +
    `${TRANSPORT_SERVICE_SLUGS.length} transport-service, ${GUIDE_SLUGS.length} guides, ${BLOG_SLUGS.length} blog)`
);
