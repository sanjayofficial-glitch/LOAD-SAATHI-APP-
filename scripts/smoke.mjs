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

    // 3a. COVERAGE counts vs sitemap — the "verifiable counts" in api/site.js
    // are what the home page and llms.txt claim publicly. generate-sitemap.mjs
    // syncs them automatically, so a mismatch here means someone hand-edited
    // them or the sitemap file was overwritten.
    const siteJs = path.join(ROOT, "api", "site.js");
    if (fs.existsSync(siteJs)) {
      const cov = fs.readFileSync(siteJs, "utf-8").match(/export const COVERAGE = \{([\s\S]*?)\}/);
      const num = (k) => cov?.[1]?.match(new RegExp(`${k}:\\s*(\\d+)`))?.[1];
      const claimed = num && Number(num("sitemapUrls"));
      const routeCount = (sitemap.match(/\/routes\//g) || []).length;
      const cityCount = (sitemap.match(/\/location\//g) || []).length;
      const claimedRoutes = num && Number(num("freightRoutes"));
      const claimedCities = num && Number(num("cityPages"));
      check("site.js COVERAGE.sitemapUrls == sitemap URL count", claimed === urlCount, `claimed ${claimed}, sitemap ${urlCount}`);
      check("site.js COVERAGE.freightRoutes == /routes/* count", claimedRoutes === routeCount, `claimed ${claimedRoutes}, sitemap ${routeCount}`);
      check("site.js COVERAGE.cityPages == /location/* count", claimedCities === cityCount, `claimed ${claimedCities}, sitemap ${cityCount}`);
    }
  } else {
    check("sitemap.xml exists", false, "File not found in dist/");
  }

  // 3b. api/agent.js BLOG_DATA parity with supabase/src/data/blog.ts.
  // agent.js is the fallback head-tag injector for every URL when prerender is
  // skipped (e.g. Vercel builds without Chrome); a stale BLOG_DATA means new
  // posts ship without server-rendered SEO until the next manual sync.
  const blogTs = path.join(ROOT, "supabase", "src", "data", "blog.ts");
  const agentJs = path.join(ROOT, "api", "agent.js");
  if (fs.existsSync(blogTs) && fs.existsSync(agentJs)) {
    const blogSrc = fs.readFileSync(blogTs, "utf-8");
    const blogSlugs = [...new Set([...blogSrc.matchAll(/^\s+"([a-z0-9-]+)":\s*\{/gm)].map((m) => m[1]))];
    const agentSrc = fs.readFileSync(agentJs, "utf-8");
    const dataStart = agentSrc.indexOf("const BLOG_DATA");
    const dataEnd = agentSrc.indexOf("const GUIDE_DATA");
    if (dataStart !== -1 && dataEnd !== -1 && dataEnd > dataStart) {
      const block = agentSrc.slice(dataStart, dataEnd);
      // Skip nested fields — only two-space-indented "slug": { entries.
      const dataKeys = [...new Set([...block.matchAll(/^ {2}"([a-z0-9-]+)": \{/gm)].map((m) => m[1]))];
      const missing = blogSlugs.filter((s) => !dataKeys.includes(s));
      const extra = dataKeys.filter((s) => !blogSlugs.includes(s));
      check(
        `agent.js BLOG_DATA covers all ${blogSlugs.length} blog slugs`,
        missing.length === 0 && extra.length === 0,
        missing.length ? `missing: ${missing.slice(0, 5).join(", ")}` : extra.length ? `extra: ${extra.slice(0, 5).join(", ")}` : ""
      );
      // Title parity for every slug both sides share — the drift detector.
      const unesc = (s) => JSON.parse(`"${s}"`);
      const blogTitle = (key) => {
        const m = blogSrc.match(new RegExp(`^ {2}"${key}": \\{[\\s\\S]*?\\n {4}title: "((?:[^"\\\\]|\\\\.)*)"`, "m"));
        return m ? unesc(m[1]) : null;
      };
      let titleDrift = [];
      for (const slug of dataKeys) {
        if (!blogSlugs.includes(slug)) continue;
        const bm = block.match(new RegExp(`^ {2}"${slug}": \\{[\\s\\S]*?\\n {4}"title": "((?:[^"\\\\]|\\\\.)*)"`, "m"));
        if (!bm) continue;
        const agentTitle = unesc(bm[1]);
        const sTitle = blogTitle(slug);
        if (sTitle && agentTitle !== `${sTitle} | LoadSaathi` && agentTitle !== sTitle) {
          titleDrift.push(slug);
        }
      }
      check(
        "agent.js BLOG_DATA titles match blog.ts",
        titleDrift.length === 0,
        titleDrift.length ? `drifted: ${titleDrift.slice(0, 5).join(", ")}` : ""
      );
    }
  }

  // 3c. blogMeta.ts freshness — it is regenerated from blog.ts on prebuild.
  const blogMetaTs = path.join(ROOT, "supabase", "src", "data", "blogMeta.ts");
  if (fs.existsSync(blogMetaTs) && fs.existsSync(blogTs)) {
    const metaCount = [...new Set([...fs.readFileSync(blogMetaTs, "utf-8").matchAll(/slug: "([a-z0-9-]+)"/g)].map((m) => m[1]))].length;
    const sourceCount = [...new Set([...fs.readFileSync(blogTs, "utf-8").matchAll(/^\s+"([a-z0-9-]+)":\s*\{/gm)].map((m) => m[1]))].length;
    check(
      `blogMeta.ts is in sync with blog.ts (${sourceCount} entries)`,
      metaCount === sourceCount,
      `stale: blogMeta has ${metaCount}, blog.ts has ${sourceCount} — run pnpm build to regenerate`
    );
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
  // Canonicals only exist in HTML after prerender executes the React app.
  // When prerender was skipped (e.g. Vercel build image has no Chrome), the
  // SPA shell legitimately has no canonical tag — canonical is injected at
  // runtime by SeoMeta, so downgrade these checks to informational.
  const prerenderStatusPath = path.join(DIST, ".prerender-status.json");
  let prerendered = null;
  if (fs.existsSync(prerenderStatusPath)) {
    try {
      prerendered = JSON.parse(fs.readFileSync(prerenderStatusPath, "utf-8")).prerendered === true;
    } catch {
      prerendered = null;
    }
  }
  if (prerendered === false) {
    console.log(
      "\n  ℹ prerender was skipped (see .prerender-status.json) — " +
        "skipping canonical HTML checks (canonicals are injected at runtime)"
    );
  } else {
    if (prerendered === true) {
      // The homepage is the highest-value entry URL and its prerender has been
      // the flake source in the past. When prerender claims success, the home
      // page MUST be fresh (SeoMeta's managed tag present), else the build is
      // deploying the stale SPA shell as the money page.
      const homeFresh = /data-ls-seo/.test(html);
      check("prerendered / is fresh (SeoMeta ran)", homeFresh, "dist/index.html lacks data-ls-seo — homepage prerender went stale");
    }
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
      "/compare/loadsaathi-vs-trucksuvidha",
      "/compare/loadsaathi-vs-blackbuck",
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
  }

  // 7. Title/meta SEO rules for the priority pages (Phase 2/3 CTR work).
  // Titles must be <=60 chars, meta descriptions 140-155 chars. Guards the
  // copy rules from the SEO plan so a bad edit fails the build, not the SERP.
  const seoRulePages = [
    "/",
    "/about",
    "/tools/freight-rate-calculator",
    "/compare/loadsaathi-vs-trucksuvidha",
    "/compare/loadsaathi-vs-blackbuck",
  ];
  const decodeEntities = (s) =>
    s
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&rsquo;/g, "’")
      .replace(/&ndash;/g, "–")
      .replace(/&mdash;/g, "—")
      .replace(/&#x27;/g, "'");
  for (const route of seoRulePages) {
    const pagePath = route === "/"
      ? path.join(DIST, "index.html")
      : path.join(DIST, route, "index.html");
    if (!fs.existsSync(pagePath)) continue;
    const content = fs.readFileSync(pagePath, "utf-8");
    // SeoMeta marks its managed tags with a data-ls-seo attribute, so the
    // title tag may be <title data-ls-seo="">...</title>.
    const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/);
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]*)"/);
    check(`title tag present for ${route}`, !!titleMatch);
    if (titleMatch) {
      const t = decodeEntities(titleMatch[1]).trim();
      check(`title <=60 chars for ${route} (got ${t.length})`, t.length <= 60, t);
      const brands = t.match(/LoadSaathi/gi) || [];
      check(`no double brand in title for ${route}`, brands.length <= 1, t);
    }
    check(`meta description present for ${route}`, !!descMatch);
    if (descMatch) {
      const d = decodeEntities(descMatch[1]).trim();
      check(
        `meta 140-155 chars for ${route} (got ${d.length})`,
        d.length >= 140 && d.length <= 155,
        d
      );
    }
  }

  // Summary
  console.log(`\n[smoke] ${failures === 0 ? "ALL CHECKS PASSED ✓" : `${failures} CHECK(S) FAILED ✗`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
