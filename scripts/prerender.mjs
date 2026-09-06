#!/usr/bin/env node
/**
 * Fail-soft build-time prerender for LoadSaathi.
 *
 * Runs AFTER `vite build`. Uses only Node built-ins + local Chrome.
 * No npm dependencies required.
 *
 * How it works:
 * 1. Starts a minimal HTTP server that serves dist/ with SPA fallback
 * 2. Chrome --dump-dom renders each route via HTTP
 * 3. Overwrites dist/<route>/index.html with the rendered HTML
 *
 * SAFETY: If any single page fails, the script logs a warning and exits 0.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const STATIC_ROUTES = [
  "/",
  "/features",
  "/how-it-works",
  "/about",
  "/pricing",
  "/faq",
  "/fare-calculator",
  "/contact",
  "/safety-trust",
  "/compare",
  "/privacy",
  "/terms",
  "/solutions/shippers",
  "/solutions/truckers",
  "/routes",
  "/blog",
  "/gallery",
  "/return-load",
  "/ptl-transport",
  "/ltl-transport",
  "/truck-load-booking",
  "/freight-marketplace",
  "/transport-cost-calculator",
  "/truck-load-calculator",
  "/ptl-vs-ftl-calculator",
  "/freight-rate-calculator",
  "/return-load-calculator",
  "/for-msmes",
  "/ai-logistics",
  "/data",
];

/**
 * Extract slugs from a TypeScript/JavaScript source file by matching
 * a quoted string pattern after a given key (e.g., slug: "xxx" or "xxx": {).
 */
function extractSlugs(filePath, pattern) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const regex = new RegExp(pattern, "g");
  const slugs = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    slugs.push(match[1]);
  }
  return [...new Set(slugs)];
}

// Dynamic routes: 28 freight corridors
const ROUTE_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/data/routes.ts"),
  /slug:\s*"([^"]+)"/g
);

// Dynamic routes: blog articles
const BLOG_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/data/blog.ts"),
  /^\s+"([a-z0-9-]+)":\s*\{/gm
);

// Dynamic routes: guide pages
const GUIDE_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/pages/public/guides/GuidePage.tsx"),
  /^\s+"([a-z0-9-]+)":\s*\{/gm
);

// Dynamic routes: location pages
const LOCATION_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/pages/public/locations/LocationPage.tsx"),
  /^\s+([a-z]+):\s*\{$/gm
);

const PUBLIC_ROUTES = [
  ...STATIC_ROUTES,
  ...ROUTE_SLUGS.map((s) => `/routes/${s}`),
  ...BLOG_SLUGS.map((s) => `/blog/${s}`),
  ...GUIDE_SLUGS.map((s) => `/guide/${s}`),
  ...LOCATION_SLUGS.map((s) => `/location/${s}`),
];

const TIMEOUT_MS = 20_000;
const PORT = 0; // random available port

const CHROME_PATH =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json",
};

function findChrome() {
  if (fs.existsSync(CHROME_PATH)) return CHROME_PATH;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function createSpaServer(distDir) {
  return http.createServer((req, res) => {
    const urlPath = req.url.split("?")[0];
    let filePath = path.join(distDir, urlPath);

    // Serve file if it exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback: always serve index.html
    const fallback = path.join(distDir, "index.html");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(fallback).pipe(res);
  });
}

function routeToFile(route) {
  if (route === "/") return path.join(DIST, "index.html");
  return path.join(DIST, route, "index.html");
}

function chromeDumpDom(chromePath, url, timeoutMs) {
  return execFileSync(
    chromePath,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--dump-dom",
      url,
    ],
    {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      encoding: "utf-8",
      windowsHide: true,
    }
  );
}

function main() {
  console.log("[prerender] Starting build-time prerender...");

  if (!fs.existsSync(DIST)) {
    console.warn("[prerender] dist/ not found. Run `vite build` first. Skipping.");
    return;
  }

  const chromePath = findChrome();
  if (!chromePath) {
    console.warn("[prerender] Chrome not found. Set CHROME_PATH env var. Skipping.");
    return;
  }
  console.log(`[prerender] Using Chrome: ${chromePath}`);
  console.log(`[prerender] Discovered ${PUBLIC_ROUTES.length} routes to pre-render (${ROUTE_SLUGS.length} routes, ${BLOG_SLUGS.length} blog, ${GUIDE_SLUGS.length} guides, ${LOCATION_SLUGS.length} locations)`);

  const spaIndex = path.join(DIST, "index.html");
  if (!fs.existsSync(spaIndex)) {
    console.warn("[prerender] dist/index.html missing. Skipping.");
    return;
  }

  // Start SPA server
  const server = createSpaServer(DIST);
  server.listen(PORT, "127.0.0.1", () => {
    const port = server.address().port;
    console.log(`[prerender] SPA server on http://127.0.0.1:${port}`);

    const results = { success: 0, failed: 0 };

    for (const route of PUBLIC_ROUTES) {
      const url = `http://127.0.0.1:${port}${route}`;
      const outFile = routeToFile(route);

      try {
        const rendered = chromeDumpDom(chromePath, url, TIMEOUT_MS);
        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        fs.writeFileSync(outFile, rendered, "utf-8");
        results.success++;
        console.log(`  ✓ ${route} (${rendered.length} bytes)`);
      } catch (err) {
        results.failed++;
        console.warn(`  ✗ ${route}: ${err.message?.slice(0, 120)}`);
      }
    }

    server.close();
    console.log(
      `[prerender] Done. ${results.success} succeeded, ${results.failed} failed.`
    );
  });
}

main();
