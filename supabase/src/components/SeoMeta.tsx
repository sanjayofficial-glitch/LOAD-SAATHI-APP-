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
  dateModified?: string;
  author?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  breadcrumbs?: BreadcrumbItem[];
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
    'meta[name="keywords"]:not([data-rh]):not([data-ls-seo]),' +
    'meta[property^="og:"]:not([data-rh]):not([data-ls-seo]),' +
    'meta[name^="twitter:"]:not([data-rh]):not([data-ls-seo]),' +
    'meta[property="article:modified_time"]:not([data-rh]):not([data-ls-seo])'
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
  dateModified = "2026-08-08",
  author,
  jsonLd,
  breadcrumbs,
}: SeoMetaProps) {
  const fullTitle = `${title} | LoadSaathi`;
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
    appendManaged("link", { rel: "canonical", href: url });

    appendManaged("meta", { property: "og:type", content: type });
    appendManaged("meta", { property: "og:url", content: url });
    appendManaged("meta", { property: "og:title", content: fullTitle });
    appendManaged("meta", { property: "og:description", content: description });
    appendManaged("meta", { property: "og:image", content: image });
    if (isDefaultImage) appendManaged("meta", { property: "og:image:width", content: "1200" });
    if (isDefaultImage) appendManaged("meta", { property: "og:image:height", content: "630" });
    appendManaged("meta", { property: "og:site_name", content: "LoadSaathi" });
    appendManaged("meta", { property: "og:locale", content: "en_IN" });

    appendManaged("meta", { name: "twitter:card", content: "summary_large_image" });
    appendManaged("meta", { name: "twitter:title", content: fullTitle });
    appendManaged("meta", { name: "twitter:description", content: description });
    appendManaged("meta", { name: "twitter:image", content: image });

    if (publishedTime) appendManaged("meta", { property: "article:published_time", content: publishedTime });
    if (type === "article") appendManaged("meta", { property: "article:modified_time", content: dateModified });
    if (author) appendManaged("meta", { name: "author", content: author });

    if (jsonLd) appendManaged("script", { type: "application/ld+json" }, JSON.stringify(jsonLd));
    if (breadcrumbSchema) appendManaged("script", { type: "application/ld+json" }, JSON.stringify(breadcrumbSchema));

    return () => clearManagedTags();
  }, [fullTitle, url, description, keywords, image, type, publishedTime, dateModified, author, jsonLd, breadcrumbSchema, isDefaultImage]);

  return null;
}
