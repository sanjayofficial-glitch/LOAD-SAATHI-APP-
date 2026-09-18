# Plan: Fix Edge Function Crash + Server-Side SEO for Route Pages

## Background

Commit `60e1354` (Sep 6) introduced `api/agent.js` as a Vercel Edge Function for SPA routing with content negotiation (HTML + Markdown). It also changed `vercel.json`'s catch-all route from `"dest": "/index.html"` to `"dest": "/api/agent.js"`. However, two issues were introduced:

1. **Crash**: `api/agent.js:103` calls `new URL(req.url)` without a base argument, which throws `TypeError: Invalid URL` when `req.url` is relative in Vercel Edge Runtime — causing 404s on all non-static routes (`/routes`, `/routes/rourkela-to-ranchi`, `/blog`, etc.)

2. **SEO**: Route-specific pages serve generic `index.html` with client-side-only SEO. Search engines that don't execute JavaScript see generic meta tags, not route-specific titles/descriptions/JSON-LD.

## Affected Routes (Confirmed 404)

- `/routes` (EXACT_ROUTE match, line 26)
- `/routes/rourkela-to-ranchi` (PREFIX match `/routes/`, line 59)
- `/blog/rourkela-to-ranchi-trucking-rates` (PREFIX match `/blog/`, line 58)
- `/routes/*` (all 26 route slugs)
- `/blog/*` (all blog posts)
- `/guide/*`, `/location/*`, `/transport/*` (all dynamic routes)
- All other SPA routes (pricing, features, faq, etc.)

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| URL fix method | `new URL(req.url, 'https://loadsaathi.in')` | Handles both absolute and relative `req.url`; minimal change |
| SEO approach | Server-side meta tag injection in Edge Function | No build-time dependency (Chrome); works immediately for all crawlers |
| Route data source | Inline in `api/agent.js` | Edge Function is plain JS; can't import TS modules; 26 routes is small |
| Prerender script | Leave as-is (not integrated) | Out of scope; requires Chrome on CI |

## Implementation Tasks

### Task 1: Fix the URL parsing crash

**File**: `api/agent.js`
**Line**: 103

```javascript
// Before (crashes on relative req.url):
const url = new URL(req.url);

// After (handles both absolute and relative):
const url = new URL(req.url, 'https://loadsaathi.in');
```

This is a one-line fix. When `req.url` is absolute (e.g., `https://loadsaathi.in/routes`), `new URL` ignores the base. When `req.url` is relative (e.g., `/routes`), it uses the provided base.

### Task 2: Add route data to Edge Function

**File**: `api/agent.js`

Create a `ROUTE_DATA` object mapping route slugs to their SEO metadata, sourced from `supabase/src/data/routes.ts` and `supabase/src/data/routeMeta.ts`.

Structure:
```javascript
const ROUTE_DATA = {
  "rourkela-to-ranchi": {
    from: "Rourkela",
    to: "Ranchi",
    fromState: "Odisha",
    toState: "Jharkhand",
    distanceKm: 180,
    transitTime: "4",
    description: "Connect the steel city...",
    metaDescription: "Book PTL/LTL freight from Rourkela to Ranchi...",
    keywords: "PTL freight Rourkela to Ranchi, LTL transport...",
  },
  // ... all 26 routes
};
```

Also add a lookup function:
```javascript
function getSeoMeta(path) {
  const n = normalizePath(path);
  // /routes/:slug
  const routeMatch = n.match(/^\/routes\/(.+)$/);
  if (routeMatch && ROUTE_DATA[routeMatch[1]]) {
    return ROUTE_DATA[routeMatch[1]];
  }
  return null;
}
```

### Task 3: Inject SEO meta tags into HTML response

**File**: `api/agent.js`
**Function**: `handler` (around lines 196-229)

After fetching `index.html` and before returning the response, inject route-specific SEO metadata:

```javascript
// After fetching index.html text, before serving:
const seoMeta = getSeoMeta(path);
if (seoMeta) {
  html = html
    .replace(/<title>.*?<\/title>/, `<title>${seoMeta.seoTitle}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, 
      `<meta name="description" content="${seoMeta.metaDescription}" />`)
    .replace(/<meta name="keywords" content=".*?" \/>/,
      `<meta name="keywords" content="${seoMeta.keywords}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/,
      `<link rel="canonical" href="https://loadsaathi.in/routes/${seoMeta.slug}" />`)
    .replace(
      /<meta property="og:title" content=".*?" \/>/,
      `<meta property="og:title" content="${seoMeta.seoTitle}" />`
    )
    .replace(
      /<meta property="og:description" content=".*?" \/>/,
      `<meta property="og:description" content="${seoMeta.metaDescription}" />`
    )
    .replace(
      /<meta property="og:url" content=".*?" \/>/,
      `<meta property="og:url" content="https://loadsaathi.in/routes/${seoMeta.slug}" />`
    )
    .replace(
      /<meta name="twitter:title" content=".*?" \/>/,
      `<meta name="twitter:title" content="${seoMeta.seoTitle}" />`
    )
    .replace(
      /<meta name="twitter:description" content=".*?" \/>/,
      `<meta name="twitter:description" content="${seoMeta.metaDescription}" />`
    );
}
```

For the title, use the same format as `RouteDetail.tsx` line 238:
```
`PTL Freight ${from} to ${to} | Book Trucks Online`
```

For JSON-LD injection, replace the first `<script type="application/ld+json">` block with route-specific schema (Service + BreadcrumbList + QAPage), matching `RouteDetail.tsx` lines 140-219.

The HTML response must be converted to a string (using `htmlRes.text()`) instead of streaming the body, to allow string manipulation.

### Task 4: Update DEDICATED_HTML set

**File**: `api/agent.js`
**Line**: 72

The `DEDICATED_HTML` set currently has `['/about', '/contact', '/privacy']`. These serve pre-built HTML files from `public/`. No change needed here — leave as-is.

### Task 5: Verify route exclusions

The `/routes/` prefix and `/blog/` prefix in the `PREFIXES` array (lines 58-59) already cover dynamic route slugs. No changes needed.

## Files to Modify

1. **`api/agent.js`** — Fix line 103, add `ROUTE_DATA` constant, add `getSeoMeta()` function, inject SEO tags in handler
2. **No other files** — The React `SeoMeta.tsx` component will still override these tags client-side after hydration, which is expected behavior

## Validation Steps

1. **URL fix**: Verify `new URL(req.url, 'https://loadsaathi.in')` works for both absolute and relative URLs
2. **Route matching**: Confirm `/routes/rourkela-to-ranchi` matches the `/routes/` prefix and `ROUTE_DATA["rourkela-to-ranchi"]` exists
3. **Meta injection**: Confirm string replacements target the correct meta tags in `index.html`
4. **No 503s**: Ensure the `fetch()` to `index.html` still works after changing from streaming (`htmlRes.body`) to text (`htmlRes.text()`)
5. **Build integrity**: Run `pnpm typecheck` and `pnpm run build` to ensure no errors

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| String replacement might miss or corrupt HTML tags | Use robust regex patterns; test with actual `index.html` content |
| Adding route data bloats `api/agent.js` | 26 routes × ~500 bytes = ~13KB — acceptable for an Edge Function |
| Changing `htmlRes.body` to `htmlRes.text()` adds latency | Negligible for a static HTML file (~5KB) |
| JSON-LD injection is complex | Keep JSON-LD simple — use Service + BreadcrumbList schema only |
| Future route additions require manual `ROUTE_DATA` sync | Add a maintenance note in the file; consider build-time generation later |

## Out of Scope

- Full prerender pipeline (`scripts/prerender.mjs` not integrated into build)
- Blog post SEO injection (data is in TypeScript source, not easily inlined)
- Location/Guide page SEO injection (similar data availability issues)
- Modifying `SeoMeta.tsx` or React components
