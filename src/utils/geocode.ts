export interface Coords { lat: number; lon: number; }

interface CacheEntry extends Coords {
  _ts: number;
}

const geocodeCache = new Map<string, CacheEntry | null>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Nominatim rate limit: 1 request per second
let lastRequestTime = 0;
const NOMINATIM_MIN_INTERVAL_MS = 1100;

async function throttledFetch(url: string, init?: RequestInit): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < NOMINATIM_MIN_INTERVAL_MS) {
    await new Promise(r => setTimeout(r, NOMINATIM_MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, init);
}

export async function geocodeCity(
  city: string,
  country = 'India'
): Promise<Coords | null> {
  const cacheKey = `${city.toLowerCase().trim()},${country}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached._ts < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const query = encodeURIComponent(`${city}, ${country}`);
    const res = await throttledFetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data.length > 0) {
      const result: CacheEntry = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), _ts: Date.now() };
      geocodeCache.set(cacheKey, result);
      return result;
    }
    // Don't cache null/miss results — allow retries for misspelled cities
    return null;
  } catch (err) {
    console.warn('[geocode] Nominatim request failed:', err);
    return null;
  }
}
