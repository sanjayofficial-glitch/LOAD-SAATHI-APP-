#!/usr/bin/env node
/**
 * Pre-deploy smoke test for LoadSaathi.
 *
 * Verifies that the build output is healthy before deployment.
 * Run after `vite build` (and optionally after prerender).
 *
 * Checks:
 * 1. dist/index.html exists and is non-empty
 * 2. All JS/CSS bundles referenced in index.html exist
 * 3. Sitemap.xml is valid XML with expected URL count
 * 4. robots.txt exists
 * 5. Key pages have prerendered HTML (if prerender ran)
 *
 * Exit 0 = all checks passed. Exit 1 = critical failure (blocks deploy).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

let failures = 0;

function check(label, ok, detail = "") {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failures++;
  }
}

function main() {
  console.log("[smoke] Running pre-deploy checks...\n");

  // 1. dist/index.html
  const indexHtml = path.join(DIST, "index.html");
  check("dist/index.html exists", fs.existsSync(indexHtml));

  if (!fs.existsSync(indexHtml)) {
    console.error("\n[smoke] CRITICAL: dist/index.html missing. Cannot continue.");
    process.exit(1);
  }

  const html = fs.readFileSync(indexHtml, "utf-8");
  check("dist/index.html is non-empty", html.length > 100);

  // 2. Check that JS/CSS bundles exist (local only — prerendered HTML also
  // contains third-party CDN scripts like cookiehub and platform-injected
  // Vercel insights scripts, none of which live in dist/)
  const isExternal = (u) => /^(https?:)?\/\//.test(u) || u.startsWith("/_vercel/");
  const scriptMatches = html.matchAll(/src="([^"]*\.js)"/g);
  let scriptCount = 0;
  for (const [, src] of scriptMatches) {
    if (isExternal(src)) continue;
    const scriptPath = path.join(DIST, src);
    check(`Script bundle ${src} exists`, fs.existsSync(scriptPath));
    scriptCount++;
  }
  check(`Found ${scriptCount} script bundles`, scriptCount > 0, "No scripts found in index.html");

  const cssMatches = html.matchAll(/href="([^"]*\.css)"/g);
  let cssCount = 0;
  for (const [, href] of cssMatches) {
    if (isExternal(href)) continue;
    const cssPath = path.join(DIST, href);
    check(`CSS bundle ${href} exists`, fs.existsSync(cssPath));
    cssCount++;
  }
  check(`Found ${cssCount} CSS bundles`, cssCount > 0, "No CSS found in index.html");

  // 3. Sitemap
  const sitemapPath = path.join(DIST, "sitemap.xml");
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, "utf-8");
    check("sitemap.xml is non-empty", sitemap.length > 100);
    check("sitemap.xml contains <urlset>", sitemap.includes("<urlset"));
    const urlCount = (sitemap.match(/<url>/g) || []).length;
    check(`sitemap.xml has ${urlCount} URLs (expected >= 45)`, urlCount >= 45);
  } else {
    check("sitemap.xml exists", false, "File not found in dist/");
  }

  // 4. robots.txt
  const robotsPath = path.join(DIST, "robots.txt");
  check("robots.txt exists", fs.existsSync(robotsPath));

  // 5. Prerendered pages (bonus check — not required)
  const prerenderedPages = [
    "/return-load",
    "/ptl-transport",
    "/ltl-transport",
    "/truck-load-booking",
    "/freight-marketplace",
    "/transport-cost-calculator",
    "/tools/truck-load-calculator",
    "/tools/ptl-vs-ftl-calculator",
    "/tools/freight-rate-calculator",
    "/tools/return-load-calculator",
    "/for-msmes",
    "/ai-logistics",
    "/data",
  ];
  let prerenderedCount = 0;
  for (const route of prerenderedPages) {
    const pagePath = path.join(DIST, route, "index.html");
    if (fs.existsSync(pagePath)) {
      prerenderedCount++;
    }
  }
  console.log(
    `\n  ℹ ${prerenderedCount}/${prerenderedPages.length} new pages are prerendered` +
      (prerenderedCount < prerenderedPages.length ? " (missing pages still work via SPA fallback)" : "")
  );

  // 6. Canonical tag verification in prerendered pages
  const canonicalPages = [
    "/",
    "/features",
    "/about",
    "/pricing",
    "/return-load",
    "/ptl-transport",
    "/freight-marketplace",
    "/tools/freight-rate-calculator",
    "/data",
  ];
  let canonicalOk = 0;
  for (const route of canonicalPages) {
    const pagePath = route === "/"
      ? path.join(DIST, "index.html")
      : path.join(DIST, route, "index.html");
    if (!fs.existsSync(pagePath)) continue;
    const content = fs.readFileSync(pagePath, "utf-8");
    const canonicalMatch = content.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
    if (canonicalMatch) {
      const href = canonicalMatch[1];
      const expected = `https://loadsaathi.in${route}`;
      if (href === expected) {
        canonicalOk++;
      } else {
        console.error(`  ✗ Canonical mismatch for ${route}: got ${href}, expected ${expected}`);
        failures++;
      }
    } else {
      console.error(`  ✗ Missing canonical tag in ${route}`);
      failures++;
    }
  }
  console.log(`  ℹ ${canonicalOk}/${canonicalPages.length} prerendered pages have correct canonical tags`);

  // Summary
  console.log(`\n[smoke] ${failures === 0 ? "ALL CHECKS PASSED ✓" : `${failures} CHECK(S) FAILED ✗`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
