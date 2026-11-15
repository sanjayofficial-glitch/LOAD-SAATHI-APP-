import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

import { TRUCK_TYPE_PAIRS, TRUCK_TYPE_PAIR_SLUGS, truckPairTitle, truckPairMetaDescription } from "@/data/truckTypes";

const ROOT = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

describe("Truck-type comparison pages", () => {
  it("has at least five fully-populated pairs", () => {
    expect(TRUCK_TYPE_PAIR_SLUGS.length).toBeGreaterThanOrEqual(5);
    for (const slug of TRUCK_TYPE_PAIR_SLUGS) {
      const pair = TRUCK_TYPE_PAIRS[slug]!;
      expect(pair).toBeTruthy();
      expect(pair.shortA).toBeTruthy();
      expect(pair.shortB).toBeTruthy();
      expect(pair.comparisonLane).toBeTruthy();
      expect(pair.comparisonRouteSlug).toBeTruthy();
      expect(pair.comparisonDistanceKm).toBeGreaterThan(0);
      expect(pair.verdictA).toBeTruthy();
      expect(pair.verdictB).toBeTruthy();
      expect(pair.faq.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps every title ≤ 60 characters and description in 140–155", () => {
    for (const slug of TRUCK_TYPE_PAIR_SLUGS) {
      const pair = TRUCK_TYPE_PAIRS[slug]!;
      const title = truckPairTitle(pair);
      const desc = truckPairMetaDescription(pair);
      expect(title.length, `${slug} title (${title.length})`).toBeLessThanOrEqual(60);
      expect(desc.length, `${slug} desc (${desc.length})`).toBeGreaterThanOrEqual(140);
      expect(desc.length, `${slug} desc (${desc.length})`).toBeLessThanOrEqual(155);
    }
  });

  it("derives every pair from repository data only — no invented figures", () => {
    const dimensions = read("supabase/src/data/vehicleDimensions.ts");
    const benchmark = read("supabase/src/components/RateBenchmarks2026.data.ts");
    for (const slug of TRUCK_TYPE_PAIR_SLUGS) {
      const pair = TRUCK_TYPE_PAIRS[slug]!;
      // Benchmark rows must exist in the shared rate-benchmark table.
      expect(benchmark).toContain(pair.a.benchmark.vehicle);
      expect(benchmark).toContain(pair.b.benchmark.vehicle);
      // Named models must exist in the vehicle-dimensions catalogue.
      if (pair.a.modelName) expect(dimensions).toContain(pair.a.modelName);
      if (pair.b.modelName) expect(dimensions).toContain(pair.b.modelName);
      // The comparison lane must exist in the canonical lane table.
      const lanes = JSON.parse(read("api/routeData.json")) as Record<string, { distanceKm: number }>;
      const lane = lanes[pair.comparisonRouteSlug]!;
      expect(lane, `${slug} lane ${pair.comparisonRouteSlug}`).toBeTruthy();
      expect(lane.distanceKm).toBe(pair.comparisonDistanceKm);
    }
  });

  it("keeps the edge function's meta file in sync with the React module", () => {
    const meta = JSON.parse(read("api/truckPairMeta.json")) as Record<
      string,
      { title: string; description: string; faq: unknown[] }
    >;
    for (const slug of TRUCK_TYPE_PAIR_SLUGS) {
      const pair = TRUCK_TYPE_PAIRS[slug]!;
      const entry = meta[slug]!;
      expect(entry, `truckPairMeta.json missing ${slug}`).toBeTruthy();
      expect(entry.title).toBe(truckPairTitle(pair));
      expect(entry.description).toBe(truckPairMetaDescription(pair));
      expect(entry.faq.length).toBe(pair.faq.length);
    }
  });

  it("lists every pair in the sitemap and the prerender route set", () => {
    const sitemap = read("public/sitemap.xml");
    const prerender = read("scripts/prerender.mjs");
    const sitemapGen = read("scripts/generate-sitemap.mjs");
    for (const slug of TRUCK_TYPE_PAIR_SLUGS) {
      expect(sitemap).toContain(`/truck-types/${slug}`);
      expect(prerender).toContain("/truck-types/");
      expect(sitemapGen).toContain("/truck-types/");
    }
  });
});
