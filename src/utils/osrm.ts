import type { Geometry } from 'geojson';

export interface RouteResult {
  distance_km: number;
  duration_min: number;
  geometry?: Geometry;
}

// --- LRU-style in-memory cache to avoid repeated OSRM API calls ---
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_MAX_SIZE = 500;
const EVICT_BATCH = 50;
const routeCache = new Map<string, { result: RouteResult | null; ts: number }>();

function cacheKey(
  oLng: number, oLat: number,
  dLng: number, dLat: number
): string {
  // Round to 4 decimal places (~11 m precision) to maximise cache hits
  return `${oLng.toFixed(4)},${oLat.toFixed(4)};${dLng.toFixed(4)},${dLat.toFixed(4)}`;
}

function evictOldest(): void {
  if (routeCache.size <= CACHE_MAX_SIZE) return;
  // Delete oldest entries (Map maintains insertion order)
  let deleted = 0;
  for (const key of routeCache.keys()) {
    if (deleted >= EVICT_BATCH) break;
    routeCache.delete(key);
    deleted++;
  }
}

/**
 * Fetch a driving route from the public OSRM API.
 * Results are cached in-memory for 10 minutes with LRU eviction.
 * Returns distance (km), duration (min), and GeoJSON geometry.
 */
export async function getRoute(
  originLng: number, originLat: number,
  destLng: number, destLat: number
): Promise<RouteResult | null> {
  const key = cacheKey(originLng, originLat, destLng, destLat);
  const cached = routeCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${originLng},${originLat};${destLng},${destLat}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok') {
      // Don't cache non-Ok responses (may be transient/rate-limit)
      return null;
    }
    const route = data.routes[0];
    const result: RouteResult = {
      distance_km: Math.round(route.distance / 1000),
      duration_min: Math.round(route.duration / 60),
      geometry: route.geometry,
    };
    evictOldest();
    routeCache.set(key, { result, ts: Date.now() });
    return result;
  } catch (err) {
    console.warn('[osrm] Route request failed:', err);
    return null;
  }
}

export interface Waypoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface OptimizedRouteResult {
  waypoints: Waypoint[];
  segments: RouteResult[];
  totalDistanceKm: number;
  totalDurationMin: number;
  optimized: boolean;
}

function haversineDistance(a: Waypoint, b: Waypoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

/**
 * Optimize a list of waypoints using nearest-neighbor heuristic.
 * The first waypoint is treated as the fixed start; remaining waypoints
 * are reordered to minimize total straight-line distance.
 * Then each segment is routed via getRoute() for accurate road distances.
 */
export async function optimizeRoute(
  waypoints: Waypoint[]
): Promise<OptimizedRouteResult | null> {
  if (waypoints.length < 2) return null;

  const start = waypoints[0];
  if (!start) return null;
  const remaining = waypoints.slice(1);
  const ordered: Waypoint[] = [start];
  const pool = [...remaining];

  while (pool.length > 0) {
    const last = ordered[ordered.length - 1];
    if (!last) return null;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const wp = pool[i];
      if (!wp) continue;
      const d = haversineDistance(last, wp);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const best = pool[bestIdx];
    if (!best) return null;
    ordered.push(best);
    pool.splice(bestIdx, 1);
  }

  const segments: RouteResult[] = [];
  let totalDistanceKm = 0;
  let totalDurationMin = 0;

  for (let i = 0; i < ordered.length - 1; i++) {
    const from = ordered[i];
    const to = ordered[i + 1];
    if (!from || !to) return null;
    const segment = await getRoute(from.lng, from.lat, to.lng, to.lat);
    if (!segment) return null;
    segments.push(segment);
    totalDistanceKm += segment.distance_km;
    totalDurationMin += segment.duration_min;
  }

  return {
    waypoints: ordered,
    segments,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalDurationMin: Math.round(totalDurationMin),
    optimized: ordered.length !== waypoints.length ||
      !ordered.every((wp, i) => wp === waypoints[i]),
  };
}
