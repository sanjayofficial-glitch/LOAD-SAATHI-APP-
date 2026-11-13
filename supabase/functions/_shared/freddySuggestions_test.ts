// Self-contained tests for the Freddy zero-result suggestion engine.
// Network-free: the count probes receive an injected fetchImpl that returns
// synthetic Content-Range headers — no Deno net/env permissions, no secrets.

import {
  buildMarketProbes,
  buildShipmentProbes,
  buildSuggestions,
  parseContentRangeCount,
  probeMarketAvailability,
  probeShipmentAvailability,
} from "./freddySuggestions.ts";
import type { SearchMarketConfig } from "./searchMarket.ts";
import type { SearchShipmentsConfig } from "./searchShipments.ts";

const BASE_URL = "https://test-project.supabase.co";
const ANON_KEY = "test_anon_key_placeholder_not_real";
const TEST_JWT = "user_test.jwt.placeholder";

const MARKET_CONFIG: SearchMarketConfig = {
  baseUrl: BASE_URL,
  anonKey: ANON_KEY,
  userJwt: TEST_JWT,
};

const SHIPMENT_CONFIG: SearchShipmentsConfig = {
  baseUrl: BASE_URL,
  anonKey: ANON_KEY,
  userJwt: TEST_JWT,
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T, label = ""): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label} expected ${e}, got ${a}`);
}

Deno.test("parseContentRangeCount handles headers", () => {
  assertEquals(parseContentRangeCount("0-0/25"), 25);
  assertEquals(parseContentRangeCount("0-0/0"), 0);
  assertEquals(parseContentRangeCount("0-0/1"), 1);
  assertEquals(parseContentRangeCount(null), 0);
  assertEquals(parseContentRangeCount("not a range"), 0);
});

Deno.test("buildMarketProbes covers route, origin, destination and all", () => {
  const probes = buildMarketProbes({ origin: "Rourkela", destination: "Ranchi" });
  assertEquals(
    probes.map((p) => p.key),
    ["route", "origin", "destination", "all"],
  );

  const route = probes[0];
  assertEquals(route.filters.origin, "Rourkela");
  assertEquals(route.filters.destination, "Ranchi");
  assertEquals(route.query, "find trucks from Rourkela to Ranchi");
  assertEquals(route.label(3), "3 trucks on Rourkela → Ranchi");
  assertEquals(route.label(1), "1 truck on Rourkela → Ranchi");
});

Deno.test("buildMarketProbes drops missing legs", () => {
  const originOnly = buildMarketProbes({ origin: "Bhubaneswar" });
  assertEquals(
    originOnly.map((p) => p.key),
    ["origin", "all"],
  );

  const destOnly = buildMarketProbes({ destination: "Kolkata" });
  assertEquals(
    destOnly.map((p) => p.key),
    ["destination", "all"],
  );

  const none = buildMarketProbes({});
  assertEquals(
    none.map((p) => p.key),
    ["all"],
  );
});

Deno.test("buildShipmentProbes labels use 'open shipment' wording", () => {
  const probes = buildShipmentProbes({ origin: "Jamshedpur", destination: "Durgapur" });
  assertEquals(probes[0].query, "find shipments from Jamshedpur to Durgapur");
  assertEquals(probes[0].label(2), "2 open shipments on Jamshedpur → Durgapur");
});

Deno.test("buildSuggestions keeps only non-empty scopes, capped and ordered", () => {
  const probes = buildMarketProbes({ origin: "Cuttack", destination: "Bhubaneswar" });
  const counts = new Map<string, number>([
    ["route", 0],
    ["origin", 4],
    ["destination", 0],
    ["all", 12],
  ]);
  const suggestions = buildSuggestions(probes, counts);
  assertEquals(suggestions.length, 2);
  assertEquals(suggestions[0].label, "4 trucks leaving Cuttack");
  assertEquals(suggestions[1].label, "12 active trucks across the marketplace");

  const capped = buildSuggestions(
    probes,
    new Map([["route", 2], ["origin", 3], ["destination", 4], ["all", 5]]),
    2,
  );
  assertEquals(capped.length, 2);
});

Deno.test("probeMarketAvailability reads counts from Content-Range and escapes filters", async () => {
  const calls: string[] = [];
  const fetchImpl = async (input: string | URL): Promise<Response> => {
    calls.push(String(input));
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "content-range": "0-0/7" },
    });
  };

  const probes = buildMarketProbes({ origin: "Rourkela", destination: "Ranchi" });
  const counts = await probeMarketAvailability(MARKET_CONFIG, probes, fetchImpl as typeof fetch);

  assertEquals(counts.get("route"), 7);
  assertEquals(counts.get("origin"), 7);
  assertEquals(counts.get("destination"), 7);
  assertEquals(counts.get("all"), 7);
  assertEquals(calls.length, 4);

  for (const url of calls) {
    const u = new URL(url);
    assertEquals(u.pathname, "/rest/v1/trips");
    assertEquals(u.searchParams.get("select"), "id");
    assertEquals(u.searchParams.get("limit"), "1");
    assertEquals(u.searchParams.get("status"), 'in.("active","in_transit")');
  }

  const originCall = calls[1];
  assert(originCall.includes("origin_city=ilike.%25Rourkela%25"), "origin filter escaped");
});

Deno.test("probeMarketAvailability degrades failed probes to zero", async () => {
  const fetchImpl = async (): Promise<Response> => {
    throw new Error("network down");
  };
  const probes = buildMarketProbes({ origin: "X" });
  const counts = await probeMarketAvailability(MARKET_CONFIG, probes, fetchImpl as typeof fetch);
  for (const probe of probes) {
    assertEquals(counts.get(probe.key), 0);
  }
});

Deno.test("probeShipmentAvailability targets pending shipments", async () => {
  const calls: string[] = [];
  const fetchImpl = async (input: string | URL): Promise<Response> => {
    calls.push(String(input));
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "content-range": "0-0/3" },
    });
  };

  const probes = buildShipmentProbes({ origin: "Ranchi" });
  const counts = await probeShipmentAvailability(SHIPMENT_CONFIG, probes, fetchImpl as typeof fetch);

  assertEquals(counts.get("origin"), 3);
  for (const url of calls) {
    const u = new URL(url);
    assertEquals(u.pathname, "/rest/v1/shipments");
    assertEquals(u.searchParams.get("status"), 'in.("pending")');
  }
});
