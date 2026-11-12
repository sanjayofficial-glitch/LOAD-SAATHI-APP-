#!/usr/bin/env node
/**
 * IndexNow submission CLI — LoadSaathi.
 *
 * Reads the local sitemap (public/sitemap.xml) and submits URLs to the
 * IndexNow API. Supports:
 *
 *   node scripts/submit-indexnow.mjs --seed          # all sitemap URLs
 *   node scripts/submit-indexnow.mjs --latest        # lastmod ≤ 72h + homepage
 *   node scripts/submit-indexnow.mjs --url <u>       # single URL
 *   node scripts/submit-indexnow.mjs ... --dry-run    # print payloads, no HTTP
 *
 * Requires INDEXNOW_KEY in the environment (the key is public by design —
 * it also lives at https://loadsaathi.in/<key>.txt). Never invents a key.
 *
 * Exit code 0 = every batch accepted (200/202) or dry-run; 1 otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'public', 'sitemap.xml');
const SITE_URL = 'https://loadsaathi.in';
const HOST = 'loadsaathi.in';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const WINDOW_MS = 72 * 60 * 60 * 1000;
const BATCH = 500;
const MAX_ATTEMPTS = 3;

const KEY = process.env.INDEXNOW_KEY || '';
const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;

if (!KEY_RE.test(KEY)) {
  console.error('[indexnow] INDEXNOW_KEY must be 8–128 hex chars (a-z, A-Z, 0-9, dashes). Set INDEXNOW_KEY.');
  process.exit(1);
}

const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;

function readSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`[indexnow] sitemap not found at ${SITEMAP_PATH} — run "pnpm build" first (or use --url).`);
    process.exit(1);
  }
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  if (locs.length !== lastmods.length) {
    console.error(`[indexnow] sitemap loc/lastmod mismatch (${locs.length}/${lastmods.length})`);
    process.exit(1);
  }
  return locs.map((loc, i) => ({ loc, lastmod: lastmods[i] }));
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const urlArgIndex = args.indexOf('--url');
const urlArg = urlArgIndex >= 0 && args[urlArgIndex + 1] ? args[urlArgIndex + 1] : null;

function collectUrls() {
  if (urlArg) {
    let u = urlArg;
    if (!u.startsWith('http')) u = `${SITE_URL}${u.startsWith('/') ? u : `/${u}`}`;
    return [u];
  }
  const urls = readSitemap();
  if (args.includes('--seed')) {
    return urls.map((u) => u.loc);
  }
  if (args.includes('--latest')) {
    const cutoff = Date.now() - WINDOW_MS;
    return urls
      .filter((u) => u.loc === `${SITE_URL}/` || (Date.parse(u.lastmod) >= cutoff))
      .map((u) => u.loc);
  }
  console.error('[indexnow] provide one of: --seed | --latest | --url <u> [--dry-run]');
  process.exit(1);
  return [];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function submitBatch(batch) {
  const payload = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch };
  if (dryRun) {
    console.log(`[indexnow] [dry-run] would POST ${batch.length} URLs to ${ENDPOINT}`);
    console.log(JSON.stringify(payload, null, 2));
    return { status: 200, body: 'dry-run' };
  }
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      console.error(`[indexnow] request failed (attempt ${attempt}): ${(err && err.message) || err}`);
      if (attempt === MAX_ATTEMPTS) return { status: 0, body: 'network_error' };
      await sleep(attempt * 5000);
      continue;
    }
    const text = await res.text();
    if (res.status === 429 && attempt < MAX_ATTEMPTS) {
      console.warn(`[indexnow] 429 rate limited — backoff (attempt ${attempt})`);
      await sleep(attempt * 5000);
      continue;
    }
    return { status: res.status, body: text };
  }
  return { status: 429, body: 'rate_limited' };
}

const urls = collectUrls();
console.log(`[indexnow] ${urls.length} URL(s) to submit (host=${HOST}, keyLocation=${KEY_LOCATION})`);

const summary = { submitted: 0, rejected: 0, upstream: [] };
let failed = false;

for (let i = 0; i < urls.length; i += BATCH) {
  const chunk = urls.slice(i, i + BATCH);
  const r = await submitBatch(chunk);
  summary.upstream.push({ status: r.status, count: chunk.length, body: r.body });
  if (r.status === 200 || r.status === 202) {
    summary.submitted += chunk.length;
  } else {
    failed = true;
    console.error(`[indexnow] batch rejected: HTTP ${r.status} — ${r.body}`);
  }
  if (r.status === 429) break;
}

console.log(`[indexnow] done: submitted=${summary.submitted}/${urls.length} upstream=${JSON.stringify(summary.upstream)}`);
if (!dryRun) {
  console.log('[indexnow] note: HTTP 200 from IndexNow means RECEIVED — not indexed.');
}
process.exit(failed && !dryRun ? 1 : 0);
