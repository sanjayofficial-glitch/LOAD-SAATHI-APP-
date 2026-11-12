// IndexNow submission endpoint — LoadSaathi.
//
// Private serverless endpoint that relays validated URL batches to the
// IndexNow API (https://api.indexnow.org/indexnow). It exists so content
// changes can be pushed to Bing (and other IndexNow participants) on demand,
// with ownership proof (key file), URL allowlisting, and upstream status
// mapping — without exposing the private submission token.
//
// Security:
//   - Requires `Authorization: Bearer $INDEXNOW_API_TOKEN` (rejects 401 otherwise).
//   - Only accepts canonical https://loadsaathi.in URLs that match the public
//     site's allowed patterns (mirrors the sitemap allowlist). Admin, auth,
//     private-dashboard, share, screens, and API paths are rejected.
//   - Host is pinned to loadsaathi.in; www and foreign hosts are rejected.
//   - The IndexNow key is public by design (key file lives at the site root);
//     it is not a secret. INDEXNOW_API_TOKEN is the secret here.
//
// Upstream status semantics (IndexNow spec):
//   200 = received (NOT indexed), 202 = accepted/key validation pending,
//   400 = invalid format, 403 = key invalid, 422 = URLs not for host,
//   429 = rate limited (retry with backoff).
//
// Usage:
//   POST /api/indexnow
//   Authorization: Bearer <INDEXNOW_API_TOKEN>
//   { "urls": ["https://loadsaathi.in/", "https://loadsaathi.in/blog/..."],
//     "action": "submit" | "delete" }        // action optional, default submit

export const config = { runtime: 'nodejs', maxDuration: 30 };

const HOST = 'loadsaathi.in';
const KEY_LOCATION = `https://${HOST}/9524fce83efa44d6845fabaaa587ee5c.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10000; // IndexNow protocol ceiling
const MAX_ATTEMPTS = 3;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

const log = (level, msg, extra = {}) => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, component: 'indexnow-api', msg, ...extra }));
};

/**
 * Exact static slugs from the sitemap (mirrors STATIC in generate-sitemap.mjs).
 */
const STATIC_ALLOW = new Set([
  '/',
  '/features',
  '/how-it-works',
  '/guide',
  '/about',
  '/pricing',
  '/faq',
  '/contact',
  '/safety-trust',
  '/compare',
  '/compare/loadsaathi-vs-trucksuvidha',
  '/compare/loadsaathi-vs-blackbuck',
  '/privacy',
  '/terms',
  '/solutions/shippers',
  '/solutions/truckers',
  '/gallery',
  '/return-load',
  '/ptl-transport',
  '/ltl-transport',
  '/truck-load-booking',
  '/freight-marketplace',
  '/truck-near-me',
  '/tools',
  '/transport-cost-calculator',
  '/for-msmes',
  '/ai-logistics',
  '/data',
  '/blog',
  '/routes',
  '/sitemap',
  '/hi',
  '/hi/ptl-transport',
  '/hi/return-load',
  '/hi/bhada-kaise-book-kare',
  '/hi/route/rourkela-to-ranchi',
]);

/** Dynamic section prefixes (same sections the sitemap lists). */
const PREFIX_ALLOW = [
  '/tools/',
  '/routes/',
  '/location/',
  '/transport-service/',
  '/guide/',
  '/blog/',
  '/compare/',
  '/solutions/',
  '/hi/',
];

/** Explicit deny substrings — defence in depth against private paths. */
const DENY_FRAGMENTS = [
  '/admin',
  '/login',
  '/register',
  '/choose-role',
  '/onboarding',
  '/forgot-password',
  '/auth-sync',
  '/profile',
  '/messages',
  '/chat/',
  '/favorites',
  '/credit-score',
  '/browse-trucks',
  '/trips/',
  '/dashboard',
  '/share/',
  '/screens/',
  '/api/',
  '/csp-report',
];

function normalizeUrl(raw) {
  if (typeof raw !== 'string') return null;
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.hostname !== HOST) return null; // pin apex host only
  if (url.search || url.hash) return null; // canonicals carry no query/hash
  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return pathname;
}

function isAllowedPath(pathname) {
  if (STATIC_ALLOW.has(pathname)) return true;
  if (PREFIX_ALLOW.some((p) => pathname.startsWith(p))) return true;
  return false;
}

function isDeniedPath(pathname) {
  return DENY_FRAGMENTS.some((f) => pathname.includes(f));
}

function validateUrls(urls) {
  const valid = [];
  const rejected = [];
  for (const raw of urls) {
    const pathname = normalizeUrl(raw);
    if (!pathname) {
      rejected.push({ url: String(raw), reason: 'non-canonical' });
      continue;
    }
    if (!isAllowedPath(pathname) || isDeniedPath(pathname)) {
      rejected.push({ url: `https://${HOST}${pathname}`, reason: 'not-allowed' });
      continue;
    }
    valid.push(`https://${HOST}${pathname}`);
  }
  return { valid: [...new Set(valid)], rejected };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Submit one batch to IndexNow. Returns { status, body } of the final attempt.
 * Retries on 429 (rate limit) with short backoff; does not retry 4xx config
 * errors (they will never succeed by retrying).
 */
async function submitBatch(batch) {
  const payload = {
    host: HOST,
    key: process.env.INDEXNOW_KEY || '',
    keyLocation: KEY_LOCATION,
    urlList: batch,
  };
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
      log('error', 'indexnow request failed', { attempt, error: String((err && err.message) || err), count: batch.length });
      if (attempt === MAX_ATTEMPTS) return { status: 0, body: { error: 'upstream_network_error' } };
      await sleep(attempt * 5000);
      continue;
    }
    const text = await res.text();
    if (res.status === 429 && attempt < MAX_ATTEMPTS) {
      log('warn', 'rate limited, backoff', { attempt, status: 429 });
      await sleep(attempt * 5000);
      continue;
    }
    return { status: res.status, body: text };
  }
  return { status: 429, body: 'rate_limited' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const token = process.env.INDEXNOW_API_TOKEN;
  if (!token) {
    return json(res, 503, { error: 'INDEXNOW_API_TOKEN not configured' });
  }
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${token}`) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  let body;
  try {
    body = JSON.parse(req.body || '{}');
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const urls = Array.isArray(body.urls) ? body.urls : [];
  if (!urls.length) {
    return json(res, 400, { error: 'urls[] is required' });
  }
  if (urls.length > MAX_URLS) {
    return json(res, 400, { error: `Too many URLs (max ${MAX_URLS})` });
  }

  const { valid, rejected } = validateUrls(urls);
  if (!valid.length) {
    return json(res, 400, { error: 'No valid canonical URLs to submit', rejected });
  }

  log('info', 'submit requested', { requested: urls.length, valid: valid.length, rejected: rejected.length });

  const chunks = [];
  for (let i = 0; i < valid.length; i += 500) {
    chunks.push(valid.slice(i, i + 500));
  }

  const results = [];
  let upstreamStatus = null;
  for (const chunk of chunks) {
    const r = await submitBatch(chunk);
    upstreamStatus = r.status;
    results.push({ count: chunk.length, status: r.status, body: r.body });
    if (r.status === 429) break; // stop fan-out if we're rate limited
  }

  const ok = results.every((r) => r.status === 200 || r.status === 202);
  log('info', 'submit done', { upstreamStatus, batches: results.length, ok });

  return json(res, ok ? 200 : (upstreamStatus === 429 ? 429 : 502), {
    ok,
    submitted: valid.length,
    rejected,
    results,
    note: 'HTTP 200 from IndexNow means the URL was RECEIVED — not indexed.',
  });
}
