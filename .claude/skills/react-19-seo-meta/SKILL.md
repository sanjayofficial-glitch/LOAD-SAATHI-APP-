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

# React 19-Safe SEO Meta Injection

Custom `<SeoMeta>` component that avoids `react-helmet-async` crashes on React 19 by writing `<head>` tags imperatively.

## Key Files

- `src/components/SeoMeta.tsx` — Main SEO component with imperative DOM manipulation
- `index.html` — Static JSON-LD schemas (Organization, LocalBusiness, WebSite with SearchAction)
- `src/components/PublicLayout.tsx` / `src/components/Layout.tsx` — Layout wrappers

## Pattern

### Imperative DOM with Managed Tags
```tsx
const MANAGED_ATTR = "data-ls-seo";
```
All tags created by SeoMeta are marked with `data-ls-seo` so they can be removed deterministically on cleanup without conflicting with React-managed nodes.

### Cleanup Strategy
1. `clearManagedTags()` — removes only tags we created (`[data-ls-seo]`)
2. `removeStaleStaticSeoTags()` — removes static tags from `index.html` SPA shell that weren't rendered by React
3. Never touches nodes with `data-rh` (react-helmet-async managed)

### Supported Tags
- `<title>` with site suffix (`| LoadSaathi`)
- `<meta name="description">`, `<meta name="keywords">`
- `<link rel="canonical">`, `<link rel="alternate" hreflang>`
- Open Graph: `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:site_name`, `og:locale`
- Twitter: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- Article: `article:published_time`, `article:modified_time`
- JSON-LD: any schema, plus automatic BreadcrumbList from breadcrumbs prop
- Author meta tag

### Usage
```tsx
<SeoMeta
  title="Page Title"
  description="Page description for search engines"
  canonical="/page-slug"
  jsonLd={schemaObject}
  breadcrumbs={[
    { name: 'Home', url: '/' },
    { name: 'Page Title', url: '/page-slug' },
  ]}
/>
```

## Best Practices

- Required on every public page per LoadSaathi SEO rules
- Static global schemas belong in `index.html`, not in SeoMeta
- Dynamic schemas injected via `jsonLd` prop
- Avoid flash of wrong title by using `useLayoutEffect` (synchronous DOM write)
