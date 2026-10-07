
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Tag, User } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";
import { getBlogListItems } from "@/data/blog";
import { clampMetaDescription } from "@/config/site";

const articles = getBlogListItems();

const collectionPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: "LoadSaathi Blog — Freight & Logistics Insights",
      description: "Insights, guides, and stories from India's intelligent freight network. Learn about AI freight matching, reducing empty kilometers, digital load boards, and more.",
      url: "https://loadsaathi.in/blog",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://loadsaathi.in/#website",
      },
      about: {
        "@type": "Thing",
        name: "Indian Freight & Logistics",
        sameAs: "https://loadsaathi.in",
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: articles.length,
        itemListElement: articles.map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://loadsaathi.in/blog/${a.slug}`,
          name: a.title,
          description: clampMetaDescription(a.excerpt),
        })),
      },
    },
  ],
};

const categoryColors: Record<string, string> = {
  "Industry Insights": "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30",
  "Trucker Tips": "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/30",
  "Product Updates": "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/30",
  "Shipper Guide": "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/30",
  "Case Study": "bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/30",
  "Industry Guide": "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/30",
  "Route Guide": "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/30",
  "Return Loads": "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30",
};

export default function BlogList() {
  return (
    <>
    <SeoMeta
      title="Blog — Freight & Logistics Insights"
      description="Insights, guides, and stories from India's intelligent freight network. Learn about AI freight matching, reducing empty kilometers, digital load boards, and more."
      keywords="freight blog India, logistics insights, trucking tips India, PTL LTL blog, digital freight marketplace, load board India"
      canonical="/blog"
      jsonLd={collectionPageSchema}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" },
      ]}
    />
    <div className="min-h-screen bg-background dark:bg-[#050816]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12 py-24 relative z-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <Tag className="h-5 w-5 text-orange-500" />
            <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">Our Blog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4 text-foreground dark:text-white">
            LoadSaathi Blog
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
            Insights, guides, and stories from India's intelligent freight network. Stay updated on industry trends and product updates.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 sm:px-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/blog/${article.slug}`}
              className="glass-card rounded-xl border border-border hover:border-orange-500/30 transition-all duration-300 group overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-orange-500/10 via-blue-500/5 to-transparent dark:from-orange-900/20 dark:via-blue-900/10 flex items-center justify-center relative overflow-hidden">
                {article.coverImage ? (
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                    <div className="text-6xl opacity-20 group-hover:scale-110 transition-transform duration-500">
                      📦
                    </div>
                  </>
                )}
              </div>
              <div className="p-6">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${categoryColors[article.category] || ""}`}>
                  {article.category}
                </span>
                <h3 className="text-lg font-bold text-foreground mt-3 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {article.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime}</span>
                    {article.author && (
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {article.author}</span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-orange-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
    <noscript>
      <div style={{maxWidth:'800px',margin:'0 auto',padding:'24px',fontFamily:'system-ui,sans-serif'}}>
        <h2>LoadSaathi Blog — Freight &amp; Logistics Insights</h2>
        <p>Insights, guides, and stories from India's intelligent freight network.</p>
        <ul>
          {articles.map((a) => (
            <li key={a.slug}><a href={`/blog/${a.slug}`}>{a.title}</a> — {a.excerpt}</li>
          ))}
        </ul>
      </div>
    </noscript>
    </>
  );
}
