import { Helmet } from "react-helmet-async";

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

  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0
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
          ...breadcrumbs.map((item, i) => ({
            "@type": "ListItem",
            position: i + 2,
            name: item.name,
            item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
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

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      <meta property="article:modified_time" content={dateModified} />
      {author && <meta name="author" content={author} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}
    </Helmet>
  );
}
