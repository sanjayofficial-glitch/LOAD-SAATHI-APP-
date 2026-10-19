import { useLayoutEffect } from "react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SeoMetaProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: string;
  publishedTime?: string;
  dateModified?: string; // Only pass when a real update timestamp exists
  author?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  breadcrumbs?: BreadcrumbItem[];
  /**
   * Robots directive, e.g. "noindex, nofollow" for private pages, auth pages,
   * 404 states and share links. Omit on public indexable pages (index, follow
   * is the default and must not be rendered explicitly per-page).
   */
  robots?: string;
  /**
   * Content language for hreflang + og:locale. Defaults to "en-in"/"en_IN".
   * Hindi pages pass hreflang="hi".
   */
  hreflang?: string;
  /**
   * Additional language alternates for this page, e.g. the reciprocal pair:
   * an English page lists its Hindi twin via { hreflang: "hi", href: "/hi/…" }
   * and vice versa. Drop-in hreflang reciprocity is required by Google's
   * guidelines — alternates must be bidirectional or the annotation is ignored.
   */
  alternates?: { hreflang: string; href: string }[];
}

const BASE_URL = "https://loadsaathi.in";
const DEFAULT_IMAGE = "https://loadsaathi.in/og-image.png";

/**
 * Managed-tag marker. Everything this component appends to <head> is marked
 * with this attribute so it can be removed deterministically on cleanup —
 * and so React's reconciliation is never asked to delete a node we created
 * imperatively (that mismatch is what crashed react-helmet-async on React 19).
 */
const MANAGED_ATTR = "data-ls-seo";

/**
 * Remove any pre-existing static SEO tags shipped by the SPA shell in
 * index.html (they were never rendered by React). Only <head> is touched,
 * and only tags NOT owned by React (no `data-rh`) and NOT owned by us
 * (no `data-ls-seo`) are eligible — React-managed nodes are left alone.
 */
function removeStaleStaticSeoTags() {
  const stale = document.head.querySelectorAll(
    'title:not([data-rh]):not([data-ls-seo]),' +
    'link[rel="canonical"]:not([data-rh]):not([data-ls-seo]),' +
    'meta[name="description"]:not([data-rh]):not([data-ls-seo]),' +
    'meta[name="robots"]:not([data-rh]):not([data-ls-seo]),' +
    'meta[name="keywords"]:not([data-rh]):not([data-ls-seo]),' +
    'meta[property^="og:"]:not([data-rh]):not([data-ls-seo]),' +
    'meta[name^="twitter:"]:not([data-rh]):not([data-ls-seo]),' +
    'meta[property="article:modified_time"]:not([data-rh]):not([data-ls-seo]),' +
    'link[hreflang]:not([data-rh]):not([data-ls-seo])'
  );
  stale.forEach((el) => el.remove());
}

/** Remove every <head> node this component previously appended. */
function clearManagedTags() {
  document.head.querySelectorAll(`[${MANAGED_ATTR}]`).forEach((el) => el.remove());
}

/**
 * Append a new tag to <head> and mark it as owned by this component.
 * Plain DOM — never a React element — so React never tracks it.
 */
function appendManaged(
  tag: "title" | "meta" | "link" | "script",
  attrs: Record<string, string>,
  text?: string
) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  if (text !== undefined) el.textContent = text;
  el.setAttribute(MANAGED_ATTR, "");
  document.head.appendChild(el);
}

export default function SeoMeta({
  title,
  description,
  keywords,
  canonical,
  image = DEFAULT_IMAGE,
  type = "website",
  publishedTime,
  dateModified,
  author,
  jsonLd,
  breadcrumbs,
  robots,
  hreflang = "en-in",
  alternates,
}: SeoMetaProps) {
  // Avoid "X — LoadSaathi | LoadSaathi" double branding: some pages already
  // include the brand in their title. Only append when it isn't there.
  const fullTitle = /loadsaathi\s*$/i.test(title.trim())
    ? title.trim()
    : `${title} | LoadSaathi`;
  const url = canonical
    ? `${BASE_URL}${canonical}`
    : typeof window !== "undefined"
      ? `${BASE_URL}${window.location.pathname}`
      : BASE_URL;
  const isDefaultImage = image === DEFAULT_IMAGE;

  const filteredCrumbs = breadcrumbs
    ? breadcrumbs.filter(
        (item) => item.name !== "Home" && item.url !== "/"
      )
    : [];

  const breadcrumbSchema =
    filteredCrumbs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: BASE_URL,
            },
            ...filteredCrumbs.map((item, i) => ({
              "@type": "ListItem",
              position: i + 2,
              name: item.name,
              item: item.url.startsWith("http")
                ? item.url
                : `${BASE_URL}${item.url}`,
            })),
          ],
        }
      : null;

  // Write the <head> tags imperatively (no react-helmet-async). The old
  // Helmet v3 React-19 path rendered React-managed <title>/<meta>/<link>
  // nodes, which our previous cleanup then removed from under React — on
  // navigation React's commit-deletion crashed with a null `removeChild`,
  // aborting the update so the URL changed but the page didn't render
  // until a second tap. Plain DOM + marked nodes keeps everything we
  // create outside React's reconciliation.
  useLayoutEffect(() => {
    clearManagedTags();
    removeStaleStaticSeoTags();

    appendManaged("title", {}, fullTitle);

    appendManaged("meta", { name: "description", content: description });
    if (keywords) appendManaged("meta", { name: "keywords", content: keywords });
    if (robots) appendManaged("meta", { name: "robots", content: robots });
    appendManaged("link", { rel: "canonical", href: url });
    appendManaged("link", { rel: "alternate", hreflang, href: url });
    appendManaged("link", { rel: "alternate", hreflang: "x-default", href: url });
    // Reciprocal language alternates (EN↔HI pairs). Absolute URLs only —
    // hreflang hrefs must be fully-qualified per Google's guidelines.
    for (const alt of alternates ?? []) {
      const altHref = alt.href.startsWith("http") ? alt.href : `${BASE_URL}${alt.href}`;
      appendManaged("link", { rel: "alternate", hreflang: alt.hreflang, href: altHref });
    }

    appendManaged("meta", { property: "og:type", content: type });
    appendManaged("meta", { property: "og:url", content: url });
    appendManaged("meta", { property: "og:title", content: fullTitle });
    appendManaged("meta", { property: "og:description", content: description });
    appendManaged("meta", { property: "og:image", content: image });
    if (isDefaultImage) appendManaged("meta", { property: "og:image:width", content: "1200" });
    if (isDefaultImage) appendManaged("meta", { property: "og:image:height", content: "630" });
    appendManaged("meta", { property: "og:image:alt", content: `${title} — LoadSaathi` });
    appendManaged("meta", { property: "og:site_name", content: "LoadSaathi" });
    appendManaged("meta", { property: "og:locale", content: hreflang === "hi" ? "hi_IN" : "en_IN" });

    appendManaged("meta", { name: "twitter:card", content: "summary_large_image" });
    appendManaged("meta", { name: "twitter:title", content: fullTitle });
    appendManaged("meta", { name: "twitter:description", content: description });
    appendManaged("meta", { name: "twitter:image", content: image });
    appendManaged("meta", { name: "twitter:image:alt", content: `${title} — LoadSaathi` });

    if (publishedTime) appendManaged("meta", { property: "article:published_time", content: publishedTime });
    if (type === "article" && dateModified) appendManaged("meta", { property: "article:modified_time", content: dateModified });
    if (author) appendManaged("meta", { name: "author", content: author });

    if (jsonLd) appendManaged("script", { type: "application/ld+json" }, JSON.stringify(jsonLd));
    if (breadcrumbSchema) appendManaged("script", { type: "application/ld+json" }, JSON.stringify(breadcrumbSchema));

    return () => clearManagedTags();
  }, [fullTitle, url, description, keywords, robots, hreflang, image, type, publishedTime, dateModified, author, jsonLd, breadcrumbSchema, isDefaultImage, alternates]);

  return null;
}
