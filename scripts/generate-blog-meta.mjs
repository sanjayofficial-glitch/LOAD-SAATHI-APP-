#!/usr/bin/env node
/**
 * Generates supabase/src/data/blogMeta.ts from supabase/src/data/blog.ts.
 *
 * blogMeta.ts holds ONLY the lightweight fields consumers need (category,
 * title, summary, readTime, dates, relatedRoutes) — never the full article
 * content. Pages like RouteDetail, BlogList and SitemapPage import it
 * instead of the full data/blog module, which keeps the ~400 KB article-body
 * bundle out of their chunks.
 *
 * The file is committed (so `pnpm dev` works without running the build) and
 * regenerated during prebuild, so it can never drift from blog.ts. Never
 * hand-edit blogMeta.ts — edit blog.ts and let the build regenerate.
 *
 * Wired into scripts/smoke.mjs: if the committed file is stale, smoke fails.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "supabase", "src", "data", "blog.ts");
const OUT = path.join(ROOT, "supabase", "src", "data", "blogMeta.ts");

/* ── Minimal TS-object parser ─────────────────────────────────────────────── */

/** Read a `"…"` string literal starting at `i` (the opening quote). Returns [value, nextIndex]. */
function readString(src, i) {
  // i points at the opening quote
  let out = "";
  i += 1;
  while (i < src.length) {
    const c = src[i++];
    if (c === "\\") {
      const n = src[i++];
      out += n === "n" ? "\n" : n;
    } else if (c === '"') {
      return out;
    } else {
      out += c;
    }
  }
  throw new Error("Unterminated string in blog.ts");
}

/** Extract `key: "…"` from a block. */
function fieldString(block, key) {
  const m = block.match(new RegExp(`(?:^|\\n)\\s*${key}\\s*:\\s*"`));
  if (!m) return undefined;
  const start = m.index + m[0].length - 1;
  return readString(block, start);
}

/** Extract `key: [ "a", "b" ]` from a block (string elements only). */
function fieldArray(block, key) {
  const m = block.match(new RegExp(`(?:^|\\n)\\s*${key}\\s*:\\s*\\[`));
  if (!m) return undefined;
  let i = m.index + m[0].length;
  const arr = [];
  while (i < block.length) {
    const c = block[i];
    if (c === '"') {
      arr.push(readString(block, i));
      // advance past the string
      let j = i + 1;
      while (j < block.length) {
        const cc = block[j];
        if (cc === "\\") {
          j += 2;
        } else if (cc === '"') {
          j += 1;
          break;
        } else {
          j += 1;
        }
      }
      i = j;
    } else if (c === "]") {
      break;
    } else {
      i += 1;
    }
  }
  return arr;
}

/* ── Parse blog.ts ────────────────────────────────────────────────────────── */

const src = fs.readFileSync(SOURCE, "utf8");
const entries = [];
const slugRe = /^[ \t]+"([a-z0-9-]+)":\s*\{/gm;
let match;
while ((match = slugRe.exec(src)) !== null) {
  const slug = match[1];
  // Brace-aware block scan from the opening '{' of this entry.
  let depth = 1;
  let i = match.index + match[0].length;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === '"') {
      // skip string literal entirely so braces inside strings don't count
      let j = i + 1;
      while (j < src.length) {
        const cc = src[j];
        if (cc === "\\") j += 2;
        else if (cc === '"') {
          j += 1;
          break;
        } else j += 1;
      }
      i = j;
      continue;
    }
    i++;
  }
  const block = src.slice(match.index, i);
  entries.push({
    slug,
    category: fieldString(block, "category"),
    title: fieldString(block, "title"),
    date: fieldString(block, "date"),
    lastUpdated: fieldString(block, "lastUpdated"),
    readTime: fieldString(block, "readTime"),
    author: fieldString(block, "author"),
    authorBio: fieldString(block, "authorBio"),
    summary: fieldString(block, "summary"),
    relatedRoutes: fieldArray(block, "relatedRoutes"),
    coverImage: fieldString(block, "coverImage"),
  });
}

if (entries.length < 10) {
  console.error(`[blog-meta] only parsed ${entries.length} articles — parser error, aborting`);
  process.exit(1);
}
const missing = entries.filter((e) => !e.title || !e.summary || !e.category || !e.date || !e.readTime || !e.author);
if (missing.length) {
  console.error(`[blog-meta] missing required fields in: ${missing.map((m) => m.slug).join(", ")}`);
  process.exit(1);
}

/* ── Serialize as TypeScript ──────────────────────────────────────────────── */

const q = (s) => JSON.stringify(s ?? "");
const lines = entries.map((e) => {
  const rel = e.relatedRoutes?.length ? `\n  relatedRoutes: ${JSON.stringify(e.relatedRoutes)},` : "";
  const bio = e.authorBio ? `\n  authorBio: ${q(e.authorBio)},` : "";
  const upd = e.lastUpdated ? `\n  lastUpdated: ${q(e.lastUpdated)},` : "";
  const cov = e.coverImage ? `\n  coverImage: ${q(e.coverImage)},` : "";
  return `  {\n  slug: ${q(e.slug)},\n  category: ${q(e.category)},\n  title: ${q(e.title)},\n  date: ${q(e.date)},${upd}\n  readTime: ${q(e.readTime)},\n  author: ${q(e.author)},${bio}\n  summary: ${q(e.summary)},${rel}${cov}\n  },`;
});

const file = `/**
 * AUTO-GENERATED by scripts/generate-blog-meta.mjs — do NOT hand-edit.
 *
 * Source of truth: supabase/src/data/blog.ts (edit there, then run the build).
 * This file holds article metadata WITHOUT the article bodies so pages that
 * don't need full content (RouteDetail related posts, BlogList, SitemapPage
 * don't need full content) avoid pulling the ~400 KB body bundle into their
 * chunks. Regenerated on every prebuild; scripts/smoke.mjs fails if stale.
 */

export interface BlogMetaEntry {
  slug: string;
  category: string;
  title: string;
  date: string;
  lastUpdated?: string;
  readTime: string;
  author: string;
  authorBio?: string;
  summary: string;
  relatedRoutes?: string[];
  coverImage?: string;
}

export interface BlogListItem {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  coverImage?: string;
}

export const blogMeta: BlogMetaEntry[] = [
${lines.join("\n")}
];

/** Mirrors getBlogListItems() in data/blog.ts — byte-identical output. */
export function getBlogListItems(): BlogListItem[] {
  const items: BlogListItem[] = [];
  for (const a of blogMeta) {
    items.push({
      slug: a.slug,
      category: a.category,
      title: a.title,
      excerpt: a.summary.substring(0, 120).replace(/\\s+\\S*$/, "") + ".",
      date: a.date,
      readTime: a.readTime,
      author: a.author,
      coverImage: a.coverImage,
    });
  }
  return items;
}

/** Articles whose relatedRoutes include the given lane slug — mirrors RouteDetail's selector. */
export function findRelatedArticles(routeSlug: string, max = 3): BlogMetaEntry[] {
  return blogMeta.filter((a) => a.relatedRoutes?.includes(routeSlug)).slice(0, max);
}
`;

fs.writeFileSync(OUT, file, "utf8");
console.log(`[blog-meta] wrote ${entries.length} entries to supabase/src/data/blogMeta.ts`);
