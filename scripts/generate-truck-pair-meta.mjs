#!/usr/bin/env node
/**
 * Generates api/truckPairMeta.json from the authoritative truckTypes.ts
 * module, so the edge function (api/agent.js) can serve the same titles,
 * descriptions, FAQs and lane slugs as the React pages — without a second
 * hand-maintained copy.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const srcPath = path.join(ROOT, "supabase/src/data/truckTypes.ts");
const src = fs.readFileSync(srcPath, "utf8");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Write beside the source so relative imports (../components/…, ../../api/…)
// resolve exactly as they do in the app, then import and clean up.
const genPath = srcPath.replace(/\.ts$/, ".gen.mjs");

// The module imports a sibling TS file (RateBenchmarks2026.data) that Node's
// ESM resolver cannot load (no extension). Transpile it into a sibling .gen.mjs
// and rewrite the import to point at it.
const benchSrcPath = path.join(ROOT, "supabase/src/components/RateBenchmarks2026.data.ts");
const benchGenPath = benchSrcPath.replace(/\.ts$/, ".gen.mjs");
const benchJs = ts.transpileModule(fs.readFileSync(benchSrcPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
fs.writeFileSync(benchGenPath, benchJs, "utf8");

let genJs = js.replace(
  /from "\.\.\/components\/RateBenchmarks2026\.data"/,
  'from "./../components/RateBenchmarks2026.data.gen.mjs"',
);
fs.writeFileSync(genPath, genJs, "utf8");

try {
  const mod = await import(pathToFileURL(genPath).href);

  const out = {};
  for (const [slug, pair] of Object.entries(mod.TRUCK_TYPE_PAIRS)) {
    out[slug] = {
      slug,
      title: mod.truckPairTitle(pair),
      description: mod.truckPairMetaDescription(pair),
      keywords: `${pair.shortA}, ${pair.shortB}, truck comparison, which truck to book, PTL truck size`,
      comparisonLane: pair.comparisonLane,
      comparisonRouteSlug: pair.comparisonRouteSlug,
      comparisonDistanceKm: pair.comparisonDistanceKm,
      faq: pair.faq,
    };
  }

  fs.writeFileSync(
    path.join(ROOT, "api/truckPairMeta.json"),
    JSON.stringify(out, null, 2) + "\n",
    "utf8",
  );
  console.log(`[truck-pair-meta] wrote ${Object.keys(out).length} pairs`);
} finally {
  fs.rmSync(genPath, { force: true });
  fs.rmSync(benchGenPath, { force: true });
}
