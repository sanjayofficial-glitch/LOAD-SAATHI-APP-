#!/usr/bin/env node
/**
 * split-blog.mjs — moves article BODIES out of data/blog.ts.
 *
 * Why: data/blog.ts is a 422 KB single module; every client importing it
 * pays for all 86 article bodies regardless of which article they open.
 * This script:
 *   1. Parses data/blog.ts with a string-aware, brace-aware scanner.
 *   2. Writes each article's `content` array to data/blog/<slug>.ts.
 *   3. Replaces the inline body with `content: []` (metadata stays put —
 *      scripts/generate-blog-meta.mjs, prerender.mjs, sitemap, and smoke
 *      only read metadata fields / slugs, never `content`).
 *   4. Generates data/blogBodies.ts: a lazy `import.meta.glob` loader.
 *
 * Safe to re-run: it regenerates data/blog/*.ts and blogBodies.ts from the
 * current data/blog.ts, so editing blog.ts and re-running keeps everything
 * in sync.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "supabase", "src", "data", "blog.ts");
const BLOG_DIR = join(ROOT, "supabase", "src", "data", "blog");

const DQ = 34; // "
const LBRACE = 123; // {
const RBRACE = 125; // }
const LBRACKET = 91; // [
const RBRACKET = 93; // ]

const src = readFileSync(SOURCE, "utf8");

/** Skip a double-quoted string literal starting at `i` (the opening quote). */
function skipString(s, i) {
  let j = i + 1;
  while (j < s.length) {
    const c = s.charCodeAt(j);
    if (c === 92) j += 2; // backslash escape
    else if (c === DQ) return j + 1;
    else j += 1;
  }
  return s.length;
}

/**
 * Capture the `content: [...]` property inside one article block (the text
 * between the entry's `{` and its matching `}`). Returns the array literal
 * text (including brackets) or null if the article has no content field.
 */
function extractContentArray(block) {
  let i = 0;
  let depth = 0;
  const isIdentChar = (c) =>
    (c >= 48 && c <= 57) || // 0-9
    (c >= 65 && c <= 90) || // A-Z
    (c >= 97 && c <= 122) || // a-z
    c === 95 || // _
    c === 36; // $

  while (i < block.length) {
    const c = block.charCodeAt(i);
    if (c === DQ) {
      i = skipString(block, i);
      continue;
    }
    if (c === LBRACE) {
      depth += 1;
      i += 1;
      continue;
    }
    if (c === RBRACE) {
      depth -= 1;
      i += 1;
      continue;
    }
    if (depth === 1 && isIdentChar(c)) {
      let end = i;
      while (end < block.length && isIdentChar(block.charCodeAt(end))) end += 1;
      const name = block.slice(i, end);
      let k = end;
      while (k < block.length && /\s/.test(block[k])) k += 1;
      if (block.charCodeAt(k) === 58 && name === "content") {
        // 58 = ':'. Array literal starts at the first '[' after the colon.
        let a = k + 1;
        while (a < block.length && /\s/.test(block[a])) a += 1;
        if (block.charCodeAt(a) !== LBRACKET) return null;
        let arrDepth = 0;
        let b = a;
        while (b < block.length) {
          const ch = block.charCodeAt(b);
          if (ch === DQ) {
            b = skipString(block, b);
            continue;
          }
          if (ch === LBRACKET) arrDepth += 1;
          else if (ch === RBRACKET) {
            arrDepth -= 1;
            if (arrDepth === 0) break;
          }
          b += 1;
        }
        if (b >= block.length) return null;
        return { start: i, end: b + 1, text: block.slice(a, b + 1) };
      }
      i = end;
      continue;
    }
    i += 1;
  }
  return null;
}

/** Find article blocks using the same slug regex shape as blog-meta. */
function findArticleBlocks(s) {
  const slugRe = new RegExp('^[ \\t]+"([a-z0-9-]+)":\\s*\\{', "gm");
  const blocks = [];
  let match;
  while ((match = slugRe.exec(s)) !== null) {
    const slug = match[1];
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < s.length && depth > 0) {
      const c = s.charCodeAt(i);
      if (c === LBRACE) depth += 1;
      else if (c === RBRACE) depth -= 1;
      else if (c === DQ) {
        i = skipString(s, i);
        continue;
      }
      i += 1;
    }
    blocks.push({ slug, start: match.index, end: i, text: s.slice(match.index, i) });
  }
  return blocks;
}

const blocks = findArticleBlocks(src);
if (blocks.length < 10) {
  console.error(`[split-blog] only parsed ${blocks.length} articles — aborting`);
  process.exit(1);
}

// Replace right-to-left: spans are computed against the ORIGINAL source, so
// applying them descending keeps every earlier offset untouched by the
// shrinking that already happened for later blocks.
blocks.sort((a, b) => b.start - a.start);

mkdirSync(BLOG_DIR, { recursive: true });
let output = src;
let bodyCount = 0;

for (const { slug, start, end, text } of blocks) {
  const contentSpan = extractContentArray(text);
  if (!contentSpan) {
    console.warn(`[split-blog] ${slug}: no content field found — skipped`);
    continue;
  }

  // 1. Body module.
  const bodyFile = join(BLOG_DIR, `${slug}.ts`);
  const bodyText = contentSpan.text;
  // One legacy article interpolates `routes.length` inside a template
  // literal (data/blog/ptl-transport-odisha-jharkhand-2026.ts). Keep the
  // text byte-identical by giving that module the import it needs.
  const routesImport = bodyText.includes("${routes")
    ? 'import { routes } from "../routes";\n\n'
    : "";
  const body =
    "/**\n" +
    " * AUTO-GENERATED by scripts/split-blog.mjs — do not hand-edit.\n" +
    ` * Body of blog article "${slug}". Metadata lives in data/blog.ts.\n` +
    " */\n" +
    routesImport +
    "export const content: string[] = " +
    bodyText +
    ";\n";
  writeFileSync(bodyFile, body);

  // 2. Replace inline body with `content: []`, preserving indentation.
  const lineStart = text.lastIndexOf("\n", contentSpan.start) + 1;
  const linePrefix = text.slice(lineStart, contentSpan.start);
  const indentMatch = linePrefix.match(/^[ \t]*/);
  const indent = indentMatch ? indentMatch[0] : "";
  const replacedLine = indent + "content: [],";
  // The original array literal is followed by a property-separator comma
  // (e.g. `content: [...],\n`). Consume it so we don't emit `[],`.
  let tail = contentSpan.end;
  while (tail < text.length && (text[tail] === " " || text[tail] === "\t")) tail += 1;
  if (text[tail] === ",") tail += 1;
  const newText = text.slice(0, lineStart) + replacedLine + text.slice(tail);
  output = output.slice(0, start) + newText + output.slice(end);
  bodyCount += 1;
}

// 3. Loader index (built by concatenation — no template-literal escaping).
const loaderLines = [
  "/**",
  " * AUTO-GENERATED by scripts/split-blog.mjs — do not hand-edit.",
  " *",
  " * Lazy loader for blog article bodies (data/blog/<slug>.ts). Body modules",
  " * are only fetched when a reader actually opens an article — the ~400 KB",
  " * body bundle never ships with the app shell, blog lists, or sitemaps.",
  " */",
  "const bodies = import.meta.glob<{ content: string[] }>(\"./blog/*.ts\", {",
  "  eager: false,",
  "});",
  "",
  "export async function loadArticleContent(slug: string): Promise<string[]> {",
  "  const loader = bodies[\"./blog/\" + slug + \".ts\"];",
  "  if (!loader) return [];",
  "  const mod = await loader();",
  "  return mod?.content ?? [];",
  "}",
  "",
  "export default loadArticleContent;",
  "",
];
const loaderFile = join(ROOT, "supabase", "src", "data", "blogBodies.ts");
writeFileSync(loaderFile, loaderLines.join("\n"));

// Once bodies are gone, `routes` is only imported for the template-literal
// body that moved out — the import becomes dead code. Strip it when there is
// no remaining identifier usage (scan skips strings + template literals).
function countIdentifiers(s, name) {
  let n = 0;
  let i = 0;
  while (i < s.length) {
    const c = s.charCodeAt(i);
    if (c === DQ) {
      i = skipString(s, i);
      continue;
    }
    if (c === 96) {
      // backtick template literal — skip to matching close
      let j = i + 1;
      while (j < s.length) {
        const cc = s.charCodeAt(j);
        if (cc === 92) j += 2;
        else if (cc === 96) {
          j += 1;
          break;
        } else j += 1;
      }
      i = j;
      continue;
    }
    if (s.startsWith(name, i)) {
      const before = i > 0 ? s[i - 1] : "";
      const after = i + name.length < s.length ? s[i + name.length] : "";
      const boundary = (ch) => !ch || !/[A-Za-z0-9_$]/.test(ch);
      if (boundary(before) && boundary(after)) n += 1;
      i += name.length;
      continue;
    }
    i += 1;
  }
  return n;
}

const routesImportLine = 'import { routes } from "./routes";\n';
if (output.includes(routesImportLine) && countIdentifiers(output, "routes") === 1) {
  output = output.replace(routesImportLine, "");
}

writeFileSync(SOURCE, output);
console.log(
  `[split-blog] split ${bodyCount}/${blocks.length} article bodies → data/blog/*.ts; blog.ts now ${(output.length / 1024).toFixed(1)} KB`,
);
