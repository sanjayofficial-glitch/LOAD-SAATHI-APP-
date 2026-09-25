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
import { spawn } from "node:child_process";
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
  "/contact",
  "/safety-trust",
  "/compare",
  "/privacy",
  "/terms",
  "/solutions/shippers",
  "/solutions/truckers",
  "/screens/dashboard",
  "/screens/matching",
  "/screens/chat",
  "/screens/credit-score",
  "/screens/reviews",
  "/screens/admin",
  "/routes",
  "/blog",
  "/gallery",
  "/return-load",
  "/ptl-transport",
  "/ltl-transport",
  "/truck-load-booking",
  "/freight-marketplace",
  "/truck-near-me",
  "/tools",
  "/transport-cost-calculator",
  "/tools/fare-calculator",
  "/tools/freight-rate-calculator",
  "/tools/return-load-calculator",
  "/tools/truck-load-calculator",
  "/tools/ptl-vs-ftl-calculator",
  "/tools/route-optimizer",
  "/tools/empty-km-savings",
  "/tools/trip-profit",
  "/tools/shared-savings",
  "/tools/document-checklist",
  "/tools/carbon-savings",
  "/tools/toll-fuel",
  "/tools/gst-calculator",
  "/tools/payload-utilization",
  "/for-msmes",
  "/ai-logistics",
  "/data",
];
// NOTE: redirect sources (/freight-intelligence, legacy calculator URLs,
// /transport/*, /location/vizag) are deliberately NOT prerendered — baking a
// static file would shadow the edge 301 with a 200 on Vercel.

/**
 * Extract slugs from a TypeScript/JavaScript source file by matching
 * a quoted string pattern after a given key (e.g., slug: "xxx" or "xxx": {).
 */
function extractSlugs(filePath, pattern) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  // Preserve the caller's flags (notably `m` for ^-anchored patterns) —
  // new RegExp(regexp, "g") would silently drop them and match nothing.
  const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
  const regex = new RegExp(pattern.source, flags);
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

// Dynamic routes: location pages (vizag 301s to visakhapatnam — prerender the target only)
const LOCATION_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/pages/public/locations/LocationPage.tsx"),
  /^\s+([a-z]+):\s*\{$/gm
).filter((s) => s !== "vizag" && s !== "serviceBlurbs" && s !== "about" && s !== "contactPoint");
if (!LOCATION_SLUGS.includes("visakhapatnam")) LOCATION_SLUGS.push("visakhapatnam");

// Dynamic routes: transport-service pages
const TRANSPORT_SERVICE_SLUGS = extractSlugs(
  path.join(ROOT, "supabase/src/pages/public/transport/TransportServicePage.tsx"),
  /^  ([a-z-]+): \{$/gm
).filter((s) => !["serviceBlurbs", "about", "contactPoint"].includes(s));

const PUBLIC_ROUTES = [
  ...STATIC_ROUTES,
  ...ROUTE_SLUGS.map((s) => `/routes/${s}`),
  ...BLOG_SLUGS.map((s) => `/blog/${s}`),
  ...GUIDE_SLUGS.map((s) => `/guide/${s}`),
  ...LOCATION_SLUGS.map((s) => `/location/${s}`),
  ...TRANSPORT_SERVICE_SLUGS.map((s) => `/transport-service/${s}`),
];

const TIMEOUT_MS = 90_000;
const READY_TIMEOUT_MS = 40_000; // per-page wall-clock budget waiting for React
const READY_POLL_MS = 500;
const PORT = 0; // random available port

// Optional: PRERENDER_ONLY="/about,/blog/x" to render a subset (debugging).
const ONLY = (process.env.PRERENDER_ONLY || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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

function chromeDumpDom(chromePath, url, timeoutMs, profileDir) {
  return execFileSync(
    chromePath,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      // Isolated throwaway profile: never touches (or blocks on) the user's
      // real Chrome profile, and skips extensions / first-run / sync noise.
      `--user-data-dir=${profileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
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

// ── CDP renderer ─────────────────────────────────────────────────────────────
// --dump-dom snapshots at the load event (boot-loader shell). Instead we drive
// one persistent headless Chrome over CDP, navigate per route, and wait for
// React to actually render (SeoMeta marker + h1) before grabbing the HTML.

function launchChrome(chromePath, profileDir, debugPort) {
  const child = spawn(
    chromePath,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      `--user-data-dir=${profileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      `--remote-debugging-port=${debugPort}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "ignore"], windowsHide: true }
  );
  return child;
}

async function waitForDebugger(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function connectPage(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, { maxPayload: 50 * 1024 * 1024 });
    let nextId = 0;
    const pending = new Map();
    ws.onopen = () => {
      resolve({
        send: (method, params = {}) =>
          new Promise((res, rej) => {
            const myId = ++nextId;
            pending.set(myId, { res, rej });
            ws.send(JSON.stringify({ id: myId, method, params }));
          }),
        close: () => {
          try { ws.close(); } catch { /* ignore */ }
        },
      });
    };
    ws.onerror = (e) => reject(e);
    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data.toString());
      } catch {
        return;
      }
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id).res(msg);
        pending.delete(msg.id);
      }
    };
  });
}

async function renderRoute(debugPort, url) {
  // Fresh tab per route so one bad page can't poison the next.
  const created = await (
    await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" })
  ).json();
  const { send, close } = await connectPage(created.webSocketDebuggerUrl);
  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", { url });
    const deadline = Date.now() + READY_TIMEOUT_MS;
    for (;;) {
      await new Promise((r) => setTimeout(r, READY_POLL_MS));
      const m = await send("Runtime.evaluate", {
        expression:
          "({seo: !!document.querySelector('[data-ls-seo]'), h1: !!document.querySelector('h1'), done: document.readyState === 'complete'})",
        returnByValue: true,
      });
      const v = m.result?.result?.value;
      if (v && v.seo && v.h1 && v.done) break;
      if (Date.now() > deadline) return null; // fail-soft: skip this route
    }
    const m = await send("Runtime.evaluate", {
      expression: "document.documentElement.outerHTML",
      returnByValue: true,
    });
    const html = m.result?.result?.value;
    return typeof html === "string" && html.length > 0 ? `<!DOCTYPE html>\n${html}` : null;
  } finally {
    close();
    try {
      await fetch(`http://127.0.0.1:${debugPort}/json/close/${created.id}`, { method: "PUT" });
    } catch {
      // best effort
    }
  }
}

async function main() {
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
  console.log(`[prerender] Discovered ${PUBLIC_ROUTES.length} routes to pre-render (${ROUTE_SLUGS.length} routes, ${BLOG_SLUGS.length} blog, ${GUIDE_SLUGS.length} guides, ${LOCATION_SLUGS.length} locations, ${TRANSPORT_SERVICE_SLUGS.length} transport-service)`);

  const spaIndex = path.join(DIST, "index.html");
  if (!fs.existsSync(spaIndex)) {
    console.warn("[prerender] dist/index.html missing. Skipping.");
    return;
  }

  const routes = ONLY.length
    ? PUBLIC_ROUTES.filter((r) => ONLY.includes(r))
    : PUBLIC_ROUTES;
  if (ONLY.length) console.log(`[prerender] PRERENDER_ONLY filter: ${routes.length} route(s)`);

  // Fresh throwaway Chrome profile per run (under the OS temp dir).
  const profileDir = fs.mkdtempSync(
    path.join(process.env.TEMP || process.env.TMPDIR || "/tmp", "ls-prerender-")
  );

  // Start SPA server
  const server = createSpaServer(DIST);
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  const port = server.address().port;
  console.log(`[prerender] SPA server on http://127.0.0.1:${port}`);

  // One persistent headless Chrome driven over CDP.
  const debugPort = 18711;
  const chrome = launchChrome(chromePath, profileDir, debugPort);
  const ready = await waitForDebugger(debugPort, TIMEOUT_MS);
  if (!ready) {
    console.warn("[prerender] Chrome debugger never came up. Skipping.");
    try { chrome.kill(); } catch { /* ignore */ }
    server.close();
    return;
  }

  const results = { success: 0, failed: 0, skipped: 0 };

  for (const route of routes) {
    const url = `http://127.0.0.1:${port}${route}`;
    const outFile = routeToFile(route);

    try {
      const rendered = await renderRoute(debugPort, url);
      // Corruption guard: never write suspicious output over a good file.
      if (!rendered || rendered.length < 5000 || !rendered.includes("<h1")) {
        results.skipped++;
        console.warn(`  ! ${route}: not ready (${rendered ? `${rendered.length} bytes` : "timeout"}) — kept previous file`);
        continue;
      }
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, rendered, "utf-8");
      results.success++;
      console.log(`  ✓ ${route} (${rendered.length} bytes)`);
    } catch (err) {
      results.failed++;
      console.warn(`  ✗ ${route}: ${err.message?.slice(0, 120)}`);
    }
  }

  try { chrome.kill(); } catch { /* ignore */ }
  server.close();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch {
    // best effort
  }
  console.log(
    `[prerender] Done. ${results.success} succeeded, ${results.failed} failed, ${results.skipped} skipped.`
  );
}

main();
