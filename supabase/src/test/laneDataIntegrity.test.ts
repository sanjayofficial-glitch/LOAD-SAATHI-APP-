import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execFileSync } from "child_process";

const ROOT = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

/**
 * The lane table is the single source of truth for corridor distance. These
 * tests fail if a second copy of the data reappears, if the derived
 * distances.json drifts from it, or if any content file states a distance
 * that contradicts it.
 */
describe("Lane data integrity", () => {
  const canonical = JSON.parse(read("api/routeData.json")) as Record<
    string,
    { from: string; to: string; distanceKm: number; transitTime: string; dataStatus: string }
  >;

  it("has a canonical lane table with every lane fully described", () => {
    const lanes = Object.values(canonical);
    expect(lanes.length).toBeGreaterThanOrEqual(48);
    for (const lane of lanes) {
      expect(lane.from).toBeTruthy();
      expect(lane.to).toBeTruthy();
      expect(lane.distanceKm).toBeGreaterThan(0);
      expect(lane.transitTime).toBeTruthy();
      expect(["verified", "corrected", "needs_review"]).toContain(lane.dataStatus);
    }
  });

  it("has a reverse lane for every lane (the corpus quotes both directions)", () => {
    // Symmetry is by CITY PAIR, not by slug: the lane table slugs a couple of
    // lanes by their short name ("bhubaneswar-to-vizag") while the city field
    // carries the long one ("Visakhapatnam").
    const pairs = new Set(
      Object.values(canonical).map((l) => `${l.from.toLowerCase()}|${l.to.toLowerCase()}`),
    );
    const missing = Object.entries(canonical)
      .filter(([, lane]) => !pairs.has(`${lane.to.toLowerCase()}|${lane.from.toLowerCase()}`))
      .map(([slug]) => slug);
    expect(missing).toEqual([]);
  });

  it("does not publish the same lane twice under two city spellings", () => {
    // "Visakhapatnam" and "Vizag" are the same city; a lane published under
    // both spellings in the same direction would be a duplicate page.
    const byDirection = new Map<string, string[]>();
    for (const [slug, lane] of Object.entries(canonical)) {
      const key = `${lane.from.toLowerCase()}|${lane.to.toLowerCase()}`;
      byDirection.set(key, [...(byDirection.get(key) ?? []), slug]);
    }
    const dupes = [...byDirection.entries()].filter(([, slugs]) => slugs.length > 1);
    expect(dupes).toEqual([]);
  });

  it("keeps api/agent.js free of an inline copy of the lane table", () => {
    // The edge function used to carry a hand-synced duplicate of this data.
    // It must import the canonical file instead.
    const agent = read("api/agent.js");
    expect(agent).not.toMatch(/const ROUTE_DATA = \{/);
    expect(agent).toContain("routeData.json");
  });

  it("keeps the React lane table on the canonical file too", () => {
    const routes = read("supabase/src/data/routes.ts");
    expect(routes).not.toMatch(/export const routes: RouteInfo\[\] = \[/);
    expect(routes).toContain("api/routeData.json");
  });

  it("keeps distances.json derived from the canonical lane table", () => {
    const distances = JSON.parse(read("supabase/src/data/distances.json")) as {
      routes: Record<string, { distanceKm: number; transitHours: number }>;
    };
    for (const [slug, lane] of Object.entries(canonical)) {
      const entry = distances.routes[slug];
      expect(entry, `distances.json is missing ${slug}`).toBeTruthy();
      if (!entry) continue;
      expect(entry.distanceKm).toBe(lane.distanceKm);
      expect(entry.transitHours).toBe(Number(lane.transitTime));
    }
  });

  it("has no content file contradicting the canonical lane distances", () => {
    // Fails loudly if a guide or article quotes a distance that differs from
    // the lane page beside it.
    const script = resolve(ROOT, "scripts/check-lane-claims.mjs");
    expect(existsSync(script)).toBe(true);
    const output = execFileSync(process.execPath, [script], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(output).toContain("every lane distance in the corpus matches");
  });

  it("has no corridor guide contradicting the canonical lane distances", () => {
    const script = resolve(ROOT, "scripts/check-guide-distances.mjs");
    expect(existsSync(script)).toBe(true);
    const output = execFileSync(process.execPath, [script], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(output).toContain("all guide distances agree");
  });
});
