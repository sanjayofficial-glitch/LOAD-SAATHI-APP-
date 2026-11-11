#!/usr/bin/env node
/**
 * Agent-side metadata integrity checks for api/agent.js.
 *
 * Guards the SEO copy rules so a bad edit fails `pnpm check` (and CI),
 * not the SERP:
 *   1. Every static page entry has a non-empty title and metaDescription.
 *   2. Every blog/guide entry has a title and either metaDescription or summary.
 *   3. No two indexable pages share an identical title (title uniqueness).
 *
 * Run: node scripts/verify-agent-meta.mjs
 */
import fs from "node:fs";

const src = fs.readFileSync(new URL("../api/agent.js", import.meta.url), "utf8");

function parseObj(name) {
  const marker = `const ${name} = {`;
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`missing ${name} in api/agent.js`);
  const objStart = at + src.slice(at).indexOf("{");
  let depth = 0;
  let inStr = null;
  let i = objStart;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === "\\") { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) break; }
  }
  const literal = src.slice(objStart, i + 1);
  return new Function(`return (${literal})`)();
}

let failures = 0;
const report = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const staticData = parseObj("STATIC_PAGE_DATA");
const staticPaths = Object.keys(staticData);

// 1. Static pages carry title + metaDescription.
for (const p of staticPaths) {
  const e = staticData[p] || {};
  report(String(e.title || "").trim().length > 0, `static ${p} has title`);
  report(String(e.metaDescription || "").trim().length > 0, `static ${p} has metaDescription`);
}

// 2. Blog/guide entries carry title + (metaDescription | summary).
for (const [kind, name] of [["blog", "BLOG_DATA"], ["guide", "GUIDE_DATA"]]) {
  const data = parseObj(name);
  for (const [slug, e] of Object.entries(data)) {
    const title = String(e.title || "").trim();
    const desc = String(e.metaDescription || e.summary || "").trim();
    report(title.length > 0, `${kind} ${slug} has title`);
    report(desc.length > 0, `${kind} ${slug} has metaDescription (or summary)`);
  }
}

// 3. Title uniqueness across all indexable pages.
// Redirect sources (/fare-calculator → /tools/fare-calculator, etc.) are NOT
// indexable — they share titles with their canonical target by design, so they
// are excluded from uniqueness.
const redirectSources = new Set(Object.keys(parseObj("REDIRECTS")));
const seen = new Map();
const dupes = [];
const note = (kind, slug, title) => {
  if (!title) return;
  if (redirectSources.has(slug)) return;
  if (seen.has(title)) {
    dupes.push(`${kind} "${slug}" — "${title}" already used by ${seen.get(title)}`);
  } else {
    seen.set(title, `${kind} "${slug}"`);
  }
};
for (const p of staticPaths) note("static", p, String(staticData[p].title || "").trim());
for (const [slug, e] of Object.entries(parseObj("BLOG_DATA"))) note("blog", slug, String(e.title || "").trim());
for (const [slug, e] of Object.entries(parseObj("GUIDE_DATA"))) note("guide", slug, String(e.title || "").trim());

if (dupes.length) {
  console.log(`\n  Duplicate titles (${dupes.length}):`);
  for (const d of dupes.slice(0, 20)) console.log(`    ${d}`);
  failures += dupes.length;
} else {
  console.log("  ✓ no duplicate titles across static, blog and guide pages");
}

if (failures > 0) {
  console.error(`\nverify-agent-meta: ${failures} finding(s) — fix before deploy.`);
  process.exit(1);
}
console.log("\nverify-agent-meta: all metadata checks passed.");
