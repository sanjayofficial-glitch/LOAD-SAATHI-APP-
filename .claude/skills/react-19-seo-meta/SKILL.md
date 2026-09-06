---
name: react-19-seo-meta
description: >-
  React 19-safe SEO meta tag injection without react-helmet-async. Use when adding
  SEO to React pages, injecting JSON-LD, managing canonical URLs, or fixing helmet
  crashes on React 19. Triggers: react 19 seo, helmet alternative, seo meta injection,
  json-ld react, imperative seo.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# React 19 SEO Meta

## What This Skill Captures

This skill documents LoadSaathi's custom `SeoMeta` component, which replaces
`react-helmet-async` with imperative `<head>` manipulation. It is safe for React 19,
deterministic in cleanup, and supports JSON-LD, breadcrumbs, and static tag removal.
It also enforces the SEO rules defined in `CONTEXT.md` for public pages.

## Key Files and Paths

- `src/components/SeoMeta.tsx` — The SeoMeta component used on every public page.
- `index.html` — SPA shell containing global static JSON-LD schemas.
- `src/components/PublicLayout.tsx` — Layout wrapper that ensures `<HelmetProvider>`
  is present (though SeoMeta itself does not depend on it).
- `src/components/SeoMeta.tsx` — Component that handles all dynamic head injection.

## Core Patterns

### Imperative Head Injection

`SeoMeta` uses `useLayoutEffect` to write `<title>`, `<meta>`, `<link>`, and
`<script type="application/ld+json">` tags directly into `document.head`. Each
managed tag is marked with `data-ls-seo` for safe cleanup.

### Deterministic Cleanup

`clearManagedTags()` removes only tags created by `SeoMeta` during unmount or
re-render. This prevents accidentally removing static tags from `index.html`.

### Stale Static Tag Removal

`removeStaleStaticSeoTags()` targets static SEO tags that may have been injected
by older helmet-based code or server-rendered shells. It checks for `data-ls-seo`
and known legacy markers.

### Supported Features

- Title and meta description / keywords / robots
- Canonical URL (`<link rel="canonical">`)
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card tags
- Hreflang links
- JSON-LD injection (objects serialized automatically)
- BreadcrumbList generation from `breadcrumbs` prop

### Static Global Schemas

Global schemas (Organization, LocalBusiness, WebSite with SearchAction) live in
`index.html`. `SeoMeta` adds page-specific JSON-LD without overwriting globals.

### React 19 Compatibility

`react-helmet-async` can crash under React 19 concurrent features. `SeoMeta` avoids
this by using imperative DOM APIs inside `useLayoutEffect`, which is stable across
React versions.

## Usage

```tsx
<SeoMeta
  title="Page Title"
  description="Page description for search engines"
  canonical="/page-slug"
  jsonLd={{ "@type": "FAQPage", ... }}
  breadcrumbs={[
    { name: 'Home', url: '/' },
    { name: 'Page Title', url: '/page-slug' },
  ]}
/>
```

Every public page in LoadSaathi must use `<SeoMeta>` with `title`, `description`,
and `canonical` props.

## Best Practices

- Do not mix `react-helmet-async` and `SeoMeta` on the same page.
- Keep JSON-LD objects small and self-contained; large nested schemas hurt parse time.
- Use `breadcrumbs` for structured navigation paths; SeoMeta renders BreadcrumbList
  JSON-LD automatically.
- Test with View Source (not DevTools Elements) to confirm JSON-LD appears in raw HTML.
- Ensure `noscript` blocks are present on public pages for AI crawlers that do not
  execute JavaScript.

## Trigger Phrases

- "react 19 seo"
- "helmet alternative"
- "seo meta injection"
- "json-ld react"
- "imperative seo"
