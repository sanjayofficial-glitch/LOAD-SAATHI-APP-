import { useParams, Link } from "react-router-dom";
import { BookOpen, ArrowLeft, ArrowRight, Clock, User } from "lucide-react";
import SeoMeta from "@/components/SeoMeta";
import { clampMetaDescription } from "@/config/site";
import { guideData } from "@/data/guides";


export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? guideData[slug.toLowerCase()] : null;

  if (!guide) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#050816] flex items-center justify-center">
        <SeoMeta title="Guide Not Found" description="The guide you are looking for does not exist." robots="noindex, nofollow" />
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-4xl font-black text-foreground mb-4">Guide Not Found</h1>
          <p className="text-muted-foreground mb-8">The guide you're looking for doesn't exist yet.</p>
          <Link to="/blog">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold">
              Browse Blog
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: clampMetaDescription(guide.summary),
        datePublished: "2026-06-01",
        dateModified: "2026-08-08",
        image: "https://loadsaathi.in/og-image.png",
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["h1", ".guide-summary"],
        },
        author: {
          "@type": "Person",
          name: guide.author,
          description: guide.authorBio,
        },
        publisher: {
          "@type": "Organization",
          name: "LoadSaathi",
          url: "https://loadsaathi.in",
          logo: { "@type": "ImageObject", url: "https://loadsaathi.in/logo-512.png" },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": `https://loadsaathi.in/guide/${slug}` },
        wordCount: guide.content.join(" ").split(/\s+/).length,
      },
      {
        "@type": "HowTo",
        name: guide.title,
        description: clampMetaDescription(guide.summary),
        datePublished: "2026-06-01",
        dateModified: "2026-08-08",
        image: "https://loadsaathi.in/og-image.png",
        author: {
          "@type": "Person",
          name: guide.author,
        },
        publisher: {
          "@type": "Organization",
          name: "LoadSaathi",
          url: "https://loadsaathi.in",
          logo: { "@type": "ImageObject", url: "https://loadsaathi.in/logo-512.png" },
        },
        totalTime: guide.readTime,
        step: guide.steps.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.name,
          text: step.text,
        })),
      },
    ],
  };

  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h2>{guide.title}</h2>
          <p>{guide.summary}</p>
          <p><strong>Author:</strong> {guide.author} | <strong>Read Time:</strong> {guide.readTime}</p>
          <h2>Guide Content</h2>
          {guide.content.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          {guide.rateTable && (
            <table border={1} style={{borderCollapse:'collapse',width:'100%',margin:'16px 0'}}>
              <caption style={{textAlign:'left',fontWeight:700,padding:'8px 0'}}>{guide.rateTable.caption}</caption>
              <thead>
                <tr>
                  {guide.rateTable.headers.map((h, i) => (
                    <th key={i} style={{padding:'6px 8px',textAlign:'left',background:'#f4f4f5'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.rateTable.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{padding:'6px 8px'}}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {guide.rateTable?.footnote && <p style={{fontSize:'12px'}}>{guide.rateTable.footnote}</p>}
        </div>
      </noscript>
      <SeoMeta
        title={guide.title}
        description={clampMetaDescription(guide.summary)}
        canonical={`/guide/${slug}`}
        jsonLd={schema}
        breadcrumbs={[
          { name: "Guides", url: "/blog" },
          { name: guide.title, url: `/guide/${slug}` },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-40" />
          <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16 relative z-10">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
            <div className="mb-4">
              <span className="text-xs font-semibold px-2 py-1 rounded-full border bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/30">
                Guide
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6 text-foreground dark:text-white">
              {guide.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
              <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {guide.author}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {guide.readTime}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Guide</span>
            </div>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-6 sm:px-12 pb-24">
          <div className="glass-card p-6 rounded-xl border border-orange-500/20 dark:border-orange-500/10 mb-10">
            <p className="guide-summary text-sm sm:text-base text-foreground leading-relaxed font-medium">
              {guide.summary}
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            {guide.content.map((paragraph, i) => (
              <p key={i} className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                {paragraph}
              </p>
            ))}
          </div>

          {guide.rateTable && (
            <div className="mt-10 overflow-x-auto">
              <table className="w-full text-left text-sm border border-border rounded-xl overflow-hidden">
                <caption className="text-left font-bold text-foreground mb-3 caption-top">
                  {guide.rateTable.caption}
                </caption>
                <thead>
                  <tr className="bg-orange-100 dark:bg-orange-900/20">
                    {guide.rateTable.headers.map((h) => (
                      <th key={h} className="px-4 py-3 font-bold whitespace-nowrap text-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.rateTable.rows.map((row) => (
                    <tr key={row[0]} className="border-t border-border">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={
                            ci === 0
                              ? "px-4 py-3 font-semibold text-foreground"
                              : "px-4 py-3 text-muted-foreground"
                          }
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {guide.rateTable.footnote && (
                <p className="text-xs text-muted-foreground mt-3">{guide.rateTable.footnote}</p>
              )}
            </div>
          )}

          {/* Internal Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Related Resources</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guide.internalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="glass-card p-3 rounded-xl border border-border hover:border-orange-500/30 transition-all group flex items-center justify-between"
                >
                  <span className="text-sm font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {link.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-orange-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Author Bio */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="glass-card p-6 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">About the Author</p>
                <p className="font-bold text-foreground">{guide.author}</p>
                <p className="text-sm text-muted-foreground mt-1">{guide.authorBio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
