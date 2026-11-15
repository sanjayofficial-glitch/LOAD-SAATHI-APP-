#!/usr/bin/env node
/**
 * Ensures a headless Chrome binary exists for the prerender step.
 *
 * Local dev on Windows/macOS usually has Chrome already (CHROME_PATH or the
 * default locations in prerender.mjs). On Vercel's Linux builder it does not,
 * so we download chrome-headless-shell once via @puppeteer/browsers and record
 * the binary path in .chrome/path.txt — prerender.mjs falls back to that.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MARKER = path.join(ROOT, ".chrome", "path.txt");

// Already known? (env wins, then previous install)
if (process.env.CHROME_PATH) {
  console.log("[chrome] using CHROME_PATH env");
  process.exit(0);
}
if (existsSync(MARKER)) {
  const p = readFileSync(MARKER, "utf8").trim();
  if (p && existsSync(p)) {
    console.log(`[chrome] using cached ${p}`);
    process.exit(0);
  }
}

// Skip download when a system Chrome is present (dev machines).
import { existsSync as _exists } from "node:fs";
const candidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];
if (candidates.some((c) => existsSync(c))) {
  mkdirSync(path.dirname(MARKER), { recursive: true });
  writeFileSync(MARKER, candidates.find((c) => existsSync(c)), "utf8");
  console.log("[chrome] system chrome found");
  process.exit(0);
}

// Download headless shell (Vercel build). Never hard-fail the build over an
// optional prerender enhancement — if the download fails, we log and continue;
// the edge function still serves SEO HTML, and prerender resumes whenever a
// Chrome binary is available.
console.log("[chrome] downloading chrome-headless-shell (once per build)…");
try {
  const { install } = await import("@puppeteer/browsers");
  const cacheDir = path.join(ROOT, ".chrome", "cache");
  mkdirSync(cacheDir, { recursive: true });
  const installed = await install({
    browser: "chrome-headless-shell",
    buildId: "stable",
    cacheDir,
    baseUrl: "https://storage.googleapis.com/chrome-for-testing-public",
  });
  mkdirSync(path.dirname(MARKER), { recursive: true });
  writeFileSync(MARKER, installed.executablePath, "utf8");
  console.log(`[chrome] installed at ${installed.executablePath}`);
} catch (err) {
  console.warn(`[chrome] headless-shell install failed (continuing without prerender): ${err?.message ?? err}`);
  process.exit(0);
}
