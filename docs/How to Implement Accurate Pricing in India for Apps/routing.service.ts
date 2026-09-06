export type Coordinates = { lat: number; lon: number };

export type RoadRoute = {
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
  source: 'osrm' | 'straight-line';
};

type NominatimResult = { lat: string; lon: string };
type OsrmResponse = {
  code?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { coordinates: [number, number][] };
  }>;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const CACHE_PREFIX = 'loadsaathi-route-v1:';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function cacheKey(value: string) {
  return `${CACHE_PREFIX}${value.trim().toLowerCase()}`;
}

function readCache<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(cacheKey(key));
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(cacheKey(key), JSON.stringify(value));
  } catch {
    // Private browsing or storage limits should not block route estimation.
  }
}

export async function geocodeCity(city: string): Promise<Coordinates | null> {
  const normalized = city.trim();
  if (!normalized) return null;

  const cached = readCache<Coordinates>(`geocode:${normalized}`);
  if (cached) return cached;

  const query = encodeURIComponent(`${normalized}, India`);
  const response = await fetch(`${NOMINATIM_URL}?q=${query}&format=jsonv2&limit=1&countrycodes=in`, {
    headers: { 'Accept-Language': 'en' },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as NominatimResult[];
  const first = data[0];
  if (!first) return null;

  const coordinates = { lat: Number(first.lat), lon: Number(first.lon) };
  if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lon)) return null;
  writeCache(`geocode:${normalized}`, coordinates);
  return coordinates;
}

function straightLineDistanceKm(origin: Coordinates, destination: Coordinates) {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((destination.lat - origin.lat) * Math.PI) / 180;
  const longitudeDelta = ((destination.lon - origin.lon) * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos((origin.lat * Math.PI) / 180)
    * Math.cos((destination.lat * Math.PI) / 180)
    * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function routeBetweenCities(originCity: string, destinationCity: string): Promise<RoadRoute | null> {
  const key = `route:${originCity.trim()}|${destinationCity.trim()}`;
  const cached = readCache<RoadRoute>(key);
  if (cached) return cached;

  const origin = await geocodeCity(originCity);
  // Nominatim asks public clients to stay at or below one request per second.
  await sleep(1100);
  const destination = await geocodeCity(destinationCity);
  if (!origin || !destination) return null;

  const fallbackDistanceKm = straightLineDistanceKm(origin, destination);
  const fallback: RoadRoute = {
    distanceKm: Math.round(fallbackDistanceKm * 1.25),
    durationMinutes: Math.round((fallbackDistanceKm * 1.25 / 45) * 60),
    geometry: [[origin.lat, origin.lon], [destination.lat, destination.lon]],
    source: 'straight-line',
  };

  try {
    const coordinates = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    const response = await fetch(`${OSRM_URL}/${coordinates}?overview=full&geometries=geojson&steps=false`);
    if (!response.ok) return fallback;
    const data = (await response.json()) as OsrmResponse;
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) return fallback;

    const result: RoadRoute = {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMinutes: Math.round(route.duration / 60),
      geometry: route.geometry?.coordinates.map(([lon, lat]) => [lat, lon]) ?? fallback.geometry,
      source: 'osrm',
    };
    writeCache(key, result);
    return result;
  } catch {
    return fallback;
  }
}
