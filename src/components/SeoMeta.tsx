import { Helmet } from "react-helmet-async";
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
 * Remove any pre-existing static SEO tags that were not rendered by
 * react-helmet-async (they lack the `data-rh` attribute).  This
 * prevents duplicate canonical / title / description / OG / Twitter
 * tags in the rendered DOM when a static SPA shell ships homepage
 * defaults that conflict with the page-specific tags Helmet injects.
 */
function removeStaleStaticSeoTags() {
  const stale = document.querySelectorAll(
    'title:not([data-rh]),' +
    'link[rel="canonical"]:not([data-rh]),' +
    'meta[name="description"]:not([data-rh]),' +
    'meta[name="keywords"]:not([data-rh]),' +
    'meta[property^="og:"]:not([data-rh]),' +
    'meta[name^="twitter:"]:not([data-rh]),' +
    'meta[property="article:modified_time"]:not([data-rh])'
  );
  stale.forEach((el) => el.remove());
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
  // Remove any static SEO tags the SPA shell left behind so exactly
  // one of each tag exists in the rendered DOM.
  useLayoutEffect(() => {
    removeStaleStaticSeoTags();
  }, [title, description, canonical]);

  const fullTitle = `${title} | LoadSaathi`;
  const url = canonical
    ? `${BASE_URL}${canonical}`
    : typeof window !== "undefined"
      ? `${BASE_URL}${window.location.pathname}`
      : BASE_URL;
  const isDefaultImage = image === DEFAULT_IMAGE;

  // Filter out a Home entry from the caller's breadcrumbs — SeoMeta
  // always prepends Home at position 1, so passing "Home" would
  // create a duplicate.
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

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {isDefaultImage && <meta property="og:image:width" content="1200" />}
      {isDefaultImage && <meta property="og:image:height" content="630" />}
      <meta property="og:site_name" content="LoadSaathi" />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && (
        <meta property="article:modified_time" content={dateModified} />
      )}
      {author && <meta name="author" content={author} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
}
