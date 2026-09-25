import { Link, useParams } from "react-router-dom";
import { Calendar, Clock, User, ArrowLeft, ArrowRight, Share2, BookOpen, FileText, Shield, TrendingUp, CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SeoMeta from "@/components/SeoMeta";
import { articles, parseDate } from "@/data/blog";
import { routes } from "@/data/routes";

function parseInlineLinks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const linkText = match[1] ?? "";
    const href = match[2] ?? "#";
    const isInternal = href.startsWith("/") && !href.startsWith("//");
    if (isInternal) {
      parts.push(
        <Link key={key++} to={href} className="text-orange-600 dark:text-orange-400 underline underline-offset-2 hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
          {linkText}
        </Link>
      );
    } else {
      parts.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 underline underline-offset-2 hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
          {linkText}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

const headingPrefixes = [
  "What Changed:",
  "Rule 1:",
  "Rule 2:",
  "How the GST Department",
  "Impact on MSMEs:",
  "Macro Trends Reshaping",
  "Action Checklist:",
  "Key Takeaways",
  "Frequently Asked Questions",
  "Problem Statement:",
  "Detailed Breakdown:",
  "Impact on MSME Shared Freight",
  "Step-by-Step Guide:",
  "Indian Case Studies:",
  "Statistical Overview",
  "Conclusion & Call to Action",
  "What Is a Return Load",
  "Top Return Load Corridors",
  "How LoadSaathi Finds Return Loads",
  "5 Ways to Price Return Loads",
  "What Is PTL Transport",
  "2026 PTL Freight Rates",
  "How to Book PTL Transport",
  "Why LoadSaathi Is the Best PTL Platform",
  "Why Steel Transport from Rourkela",
  "Choosing the Right Truck",
  "2026 Steel Freight Rates",
  "Steel Transport Compliance",
  "How LoadSaathi Connects Steel Shippers",
  "What Do Truckers Actually Earn",
  "Detailed Profit-and-Loss",
  "Running Costs Per Kilometre",
  "Why Return Loads Are the Key",
  "New Truck Buyers",
  "Transporter Obligations Under 2026",
  "Step-by-Step Guide for Transporters",
  "Indian Case Study: How One Fleet",
  "Call to Action: Stay Compliant",
  "Why East India freight corridors matter",
  "Important East India freight corridors",
  "What freight moves through these corridors?",
  "How to choose between PTL, LTL, and FTL on an East India route",
  "How return-load planning affects corridor economics",
  "How to request a useful route quote",
  "What should a corridor guide contain?",
  "How are truck transport charges calculated in India?",
  "The main factors behind the rate",
  "What information should you provide for an accurate estimate?",
  "Example calculation",
  "Questions to ask before accepting a freight quote",
  "What is a return load or backhaul?",
  "Why do trucks return empty?",
  "Five practical ways to find return loads",
  "Backhaul KPIs every fleet should track",
  "How to verify a return load before accepting it",
  "A simple return-load decision rule",
  "What is digital freight matching?",
  "Traditional freight matching versus digital matching",
  "How AI-assisted freight matching works",
  "Benefits for shippers",
  "Benefits for truckers and fleet owners",
  "What makes a freight-matching platform trustworthy?",
  "What are PTL freight rates?",
  "How PTL pricing is usually assessed",
  "A simple PTL rate framework",
  "Example: what information changes a PTL quote?",
  "PTL versus FTL: which is more economical?",
  "How shippers can improve PTL pricing",
  "Questions to ask before booking PTL",
  "Why Kolkata Return Loads Matter",
  "The Cost of Driving Back Empty",
  "Top Return Load Corridors from Kolkata",
  "How LoadSaathi Finds Return Loads from Kolkata",
  "5 Pricing Strategies for Kolkata Return Loads",
  "Kolkata to Northeast Connection",
  "Monthly Salary Ranges by Vehicle Type",
  "Owner-Operator Earnings",
  "Round-Trip Profitability:",
  "How LoadSaathi Helps Jharkhand Truckers",
  "Cost: Brokers Add",
  "Trust: Phone Calls vs Verified Profiles",
  "Speed: Days vs Minutes",
  "Visibility: In the Dark vs Real-Time GPS",
  "Payment: 30-45 Days vs 24 Hours",
  "When Brokers Still Make Sense",
  "Distance and Transit Time",
  "PTL Rates:",
  "FTL Rates by Vehicle Type",
  "Return Load Opportunities",
  "How to Get the Best Rate",
  "Carrier Liability vs Cargo Insurance",
  "Types of Cargo Insurance Coverage",
  "How Much Does Cargo Insurance Cost",
  "Claims Process",
  "How Digital Freight Platforms Handle Insurance",
];

const sectionImages: Record<number, { icon: React.ReactNode; label: string }> = {
  3: { icon: <FileText className="h-10 w-10 text-orange-500/40" />, label: "e-Way Bill Rule Changes" },
  6: { icon: <Shield className="h-10 w-10 text-blue-500/40" />, label: "Real-Time GST Analytics" },
  7: { icon: <FileText className="h-10 w-10 text-orange-500/40" />, label: "e-Way Bill Rule Status" },
  9: { icon: <TrendingUp className="h-10 w-10 text-green-500/40" />, label: "Industry Trends" },
  14: { icon: <CheckCircle className="h-10 w-10 text-purple-500/40" />, label: "Compliance Checklist" },
  20: { icon: <Shield className="h-10 w-10 text-blue-500/40" />, label: "Real-Time GST Analytics" },
  23: { icon: <TrendingUp className="h-10 w-10 text-green-500/40" />, label: "Sourced Market Statistics" },
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug.toLowerCase()] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#050816] flex items-center justify-center">
        <SeoMeta title="Article Not Found" description="The article you are looking for does not exist." robots="noindex, nofollow" />
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-4xl font-black text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or may have been removed.</p>
          <Link to="/blog">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const isoDate = parseDate(article.date);
  const isoLastUpdated = article.lastUpdated ? parseDate(article.lastUpdated) : isoDate;
  const coverImage = article.coverImage
    ? `https://loadsaathi.in${article.coverImage}`
    : "https://loadsaathi.in/logo-512.png";

  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: article.title,
        description: article.summary.substring(0, 160),
        author: {
          "@type": "Person",
          name: article.author,
          description: article.authorBio,
        },
        datePublished: isoDate,
        dateModified: isoLastUpdated,
        publisher: {
          "@type": "Organization",
          name: "LoadSaathi",
          url: "https://loadsaathi.in",
          logo: {
            "@type": "ImageObject",
            url: "https://loadsaathi.in/logo-512.png",
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://loadsaathi.in/blog/${slug}`,
        },
        articleSection: article.category,
        wordCount: article.content.join(" ").split(/\s+/).length,
        image: coverImage,
        keywords: article.keywords,
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["h1", ".prose p:first-of-type"],
        },
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://loadsaathi.in/#website",
        },
      },
    ],
  };

  const faqSchema = article.faq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  const relatedRoutes = article.relatedRoutes
    ? routes.filter((r) => article.relatedRoutes?.includes(r.slug))
    : [];

  const otherArticles = Object.entries(articles)
    .filter(([s]) => s !== slug)
    .slice(0, 3);

  return (
    <>
    <SeoMeta
      title={article.title}
      description={article.summary.substring(0, 160)}
      canonical={`${article.canonicalUrl ?? `/blog/${slug}`}`}
      type="article"
      image={coverImage}
      publishedTime={isoDate}
      dateModified={isoLastUpdated}
      author={article.author}
      jsonLd={faqSchema ? [articleSchema, faqSchema] : articleSchema}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: article.title, url: `/blog/${slug}` },
      ]}
    />

    <noscript>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>{article.title}</h1>
        <p><strong>{article.category}</strong> | {article.author} | {article.date} | {article.readTime}</p>
        {article.lastUpdated && <p>Last updated: {article.lastUpdated}</p>}
        <p>{article.summary}</p>
        <hr />
        {article.content.map((paragraph, i) => {
          const isH2 = paragraph.startsWith("## ");
          return isH2 ? (
            <h2 key={i} style={{ marginTop: "1.5rem" }}>{paragraph.replace(/^## /, "")}</h2>
          ) : (
            <p key={i} style={{ marginBottom: "1rem", lineHeight: 1.7 }}>{paragraph}</p>
          );
        })}
        {article.faq && article.faq.length > 0 && (
          <>
            <h2>Frequently Asked Questions</h2>
            {article.faq.map((item, i) => (
              <div key={i} style={{ marginBottom: "1.5rem" }}>
                <p><strong>Q: {item.question}</strong></p>
                <p>A: {item.answer}</p>
              </div>
            ))}
          </>
        )}
        {relatedRoutes.length > 0 && (
          <>
            <h2>Freight Routes Mentioned in This Article</h2>
            <ul>
              {relatedRoutes.map((r) => (
                <li key={r.slug}><a href={`https://loadsaathi.in/routes/${r.slug}`}>{r.from} → {r.to}</a> — {r.distanceKm} km · ~{r.transitTime} hrs</li>
              ))}
            </ul>
          </>
        )}
        <p><em>About the Author: {article.author} — {article.authorBio}</em></p>
      </div>
    </noscript>

    <div className="min-h-screen bg-background dark:bg-[#050816]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16 relative z-10">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <div className="mb-6">
            <span className="text-xs font-semibold px-2 py-1 rounded-full border bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30">
              {article.category}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6 text-foreground dark:text-white">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {article.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {article.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {article.readTime}</span>
            {article.lastUpdated && (
              <span className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400">
                <BookOpen className="h-4 w-4" /> Last updated: {article.lastUpdated}
              </span>
            )}
          </div>
        </div>
      </div>

      {article.coverImage && (
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 -mt-4 mb-8">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-64 sm:h-80 object-cover rounded-xl border border-border"
            loading="eager"
          />
        </div>
      )}

      <div className="max-w-[800px] mx-auto px-6 sm:px-12 pb-24">
        <div className="glass-card p-6 rounded-xl border border-orange-500/20 dark:border-orange-500/10 mb-10">
          <p className="text-sm sm:text-base text-foreground leading-relaxed font-medium">
            {article.summary}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {article.content.map((paragraph, i) => {
            const isH2Heading = paragraph.startsWith("## ");
            const isHeading = isH2Heading || headingPrefixes.some((p) => paragraph.startsWith(p));
            const image = sectionImages[i];
            const headingText = isH2Heading ? paragraph.replace(/^## /, "") : paragraph;

            return (
              <div key={i}>
                {image && (
                  <div className="my-10 rounded-xl bg-gradient-to-br from-orange-500/5 via-blue-500/5 to-transparent dark:from-orange-900/10 dark:via-blue-900/5 border border-orange-500/10 dark:border-orange-500/5 p-8 flex items-center justify-center gap-4">
                    {image.icon}
                    <span className="text-sm font-medium text-muted-foreground">{image.label}</span>
                  </div>
                )}
                {isHeading ? (
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-12 mb-4 leading-tight">
                    {headingText}
                  </h2>
                ) : (
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                    {parseInlineLinks(paragraph)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        {article.faq && article.faq.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h3>
            <div className="space-y-6">
              {article.faq.map((item, i) => (
                <div key={i} className="glass-card p-5 rounded-xl border border-border">
                  <h4 className="font-bold text-foreground mb-2">{item.question}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Routes */}
        {relatedRoutes.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">
              <MapPin className="h-4 w-4 inline mr-1.5 text-orange-400" />
              Freight Routes Mentioned in This Article
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedRoutes.map((r) => (
                <Link
                  key={r.slug}
                  to={`/routes/${r.slug}`}
                  className="glass-card p-3 rounded-xl border border-border hover:border-orange-500/30 transition-all group flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {r.from} → {r.to}
                    </span>
                    <p className="text-xs text-muted-foreground">{r.distanceKm} km · ~{r.transitTime} hrs</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-orange-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="glass-card p-6 rounded-xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">About the Author</p>
              <p className="font-bold text-foreground">{article.author}</p>
              <p className="text-sm text-muted-foreground mt-1">{article.authorBio}</p>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-foreground mb-4">More Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherArticles.map(([s, a]) => (
              <Link key={s} to={`/blog/${s}`} className="glass-card p-4 rounded-xl border border-border hover:border-orange-500/30 transition-all group">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30">{a.category}</span>
                <h4 className="text-sm font-bold text-foreground mt-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">{a.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{a.readTime}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="glass-card p-6 sm:p-8 rounded-xl text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Enjoyed this article?</h3>
            <p className="text-sm text-muted-foreground mb-6">Share it with your network and help spread the word about smarter freight.</p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={handleShare} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Share2 className="mr-2 h-4 w-4" /> Share Article
              </Button>
              <Link to="/blog">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" /> More Articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}