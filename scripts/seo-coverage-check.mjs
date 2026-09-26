// Coverage check: every sitemap URL must resolve to a getSeoMeta() entry in api/agent.js.
// Run: node scripts/seo-coverage-check.mjs
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../api/agent.js', import.meta.url), 'utf8');

function extractObjectKeys(name) {
  const marker = `const ${name} = {`;
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`missing ${name} in api/agent.js`);
  const objStart = at + src.slice(at).indexOf('{');
  let depth = 0;
  let inStr = null;
  let i = objStart;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) break; }
  }
  const objLiteral = src.slice(objStart, i + 1);
  const obj = new Function(`return (${objLiteral})`)();
  return Object.keys(obj);
}

const staticKeys = new Set(extractObjectKeys('STATIC_PAGE_DATA'));
const routeKeys = new Set(extractObjectKeys('ROUTE_DATA'));
const blogKeys = new Set(extractObjectKeys('BLOG_DATA'));
const guideKeys = new Set(extractObjectKeys('GUIDE_DATA'));
const transportKeys = new Set(extractObjectKeys('TRANSPORT_SERVICE_DATA'));

const sitemap = fs.readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/loadsaathi\.in([^<]*)<\/loc>/g)].map((m) => m[1] || '/');

function covered(p) {
  const n = p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
  let m;
  if ((m = n.match(/^\/routes\/(.+)$/))) return routeKeys.has(m[1]);
  if ((m = n.match(/^\/blog\/(.+)$/))) return blogKeys.has(m[1]);
  if ((m = n.match(/^\/guide\/(.+)$/))) return guideKeys.has(m[1]);
  if (n.startsWith('/location/')) return true;
  if ((m = n.match(/^\/transport-service\/(.+)$/))) return transportKeys.has(m[1]);
  return staticKeys.has(n);
}

const missing = paths.filter((p) => !covered(p));
console.log(`sitemap URLs: ${paths.length}`);
console.log(`STATIC_PAGE_DATA keys: ${staticKeys.size}, ROUTE_DATA: ${routeKeys.size}, BLOG_DATA: ${blogKeys.size}, GUIDE_DATA: ${guideKeys.size}`);
if (missing.length) {
  console.log(`\nMISSING getSeoMeta coverage (${missing.length}) — these would render with homepage title:`);
  for (const p of missing) console.log(`  ${p}`);
  process.exit(1);
}
console.log('coverage OK: every sitemap URL has a getSeoMeta entry');
