#!/usr/bin/env node
/**
 * One-shot drift check: blog.ts slugs vs api/agent.js BLOG_DATA keys vs sitemap.
 * (Used manually; the smoke test now enforces this automatically.)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blogSrc = fs.readFileSync(path.join(ROOT, "supabase/src/data/blog.ts"), "utf8");
const slugRe = /^\s+"([a-z0-9-]+)":\s*\{/gm;
const slugs = [...new Set([...blogSrc.matchAll(slugRe)].map((m) => m[1]))];

const agent = fs.readFileSync(path.join(ROOT, "api/agent.js"), "utf8");
const start = agent.indexOf("const BLOG_DATA");
const end = agent.indexOf("const GUIDE_DATA");
const block = agent.slice(start, end);
const keyRe = /^\s{2}"([a-z0-9-]+)": \{/gm;
const keys = [...new Set([...block.matchAll(keyRe)].map((m) => m[1]))];

const sitemap = fs.readFileSync(path.join(ROOT, "public/sitemap.xml"), "utf8");
const urlCount = (sitemap.match(/<url>/g) || []).length;

console.log("blog.ts slugs:", slugs.length);
console.log("agent.js BLOG_DATA keys:", keys.length);
console.log("sitemap urls:", urlCount);
const missing = slugs.filter((s) => !keys.includes(s));
const extra = keys.filter((s) => !slugs.includes(s));
if (missing.length) console.log("MISSING in agent.js:", missing);
if (extra.length) console.log("EXTRA in agent.js:", extra);
if (missing.length || extra.length) process.exit(1);
console.log("BLOG_DATA parity OK");
