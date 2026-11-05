// Freddy agent-router client helper (browser side).
//
// Talks to the Supabase edge function /functions/v1/agent-router — the agentic
// backend that performs read-only tool calls (search_market, search_shipments,
// credit-insights) with conversation memory. Falls back is handled by the
// caller (FreddyChatModal) via the lightweight freddyAI.ask() path.

export interface AgentTrucker {
  full_name?: string;
  rating?: number;
  total_trips?: number;
  is_verified?: boolean;
}

export interface AgentLoad {
  id: string;
  origin_city: string;
  destination_city: string;
  departure_date?: string;
  available_capacity_tonnes?: number;
  price_per_tonne?: number;
  vehicle_type?: string;
  trucker?: AgentTrucker;
}

export interface AgentShipment {
  id: string;
  origin_city: string;
  destination_city: string;
  departure_date?: string;
  weight_tonnes?: number;
  budget_per_tonne?: number;
  goods_description?: string;
  shipper?: AgentTrucker;
}

export type AgentTool = 'search_market' | 'search_shipments' | 'credit-insights';

export interface AgentRouterResponse {
  ok: boolean;
  enabled?: boolean;
  phase?: number;
  tool?: AgentTool | null;
  detail?: string;
  error?: string;
  summary?: string;
  count?: number;
  limit?: number;
  loads?: AgentLoad[];
  shipments?: AgentShipment[];
  strengths?: string[];
  improvements?: string[];
  tips?: string[];
  projection?: string;
  sessionId?: string;
  requestId?: string;
}

export interface AgentChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Slot-filling form model — what Freddy needs before running a search. */
export interface FreddySlots {
  role: 'shipper' | 'trucker' | null;
  origin?: string;
  destination?: string;
  /** tonnes (shipper: min capacity wanted; trucker: shipment weight) */
  capacity?: number;
  /** ₹ per tonne (shipper: max price; trucker: budget) */
  budget?: number;
  /** e.g. Container / Trailer / Tipper / Open */
  vehicleType?: string;
}

const CITY_LIST = [
  'rourkela', 'ranchi', 'bhubaneswar', 'cuttack', 'sambalpur', 'berhampur',
  'balasore', 'jharsuguda', 'angul', 'dhanbad', 'jamshedpur', 'bilaspur',
  'bhilai', 'raipur', 'bokaro', 'asansol', 'durgapur', 'kolkata', 'howrah',
  'siliguri', 'patna', 'gaya', 'muzaffarpur', 'varanasi', 'prayagraj',
  'lucknow', 'kanpur', 'agra', 'delhi', 'gurugram', 'noida', 'mumbai',
  'navi mumbai', 'pune', 'nagpur', 'indore', 'bhopal', 'jaipur',
  'ahmedabad', 'surat', 'vadodara', 'chennai', 'bangalore', 'hyderabad',
  'kochi', 'trivandrum', 'coimbatore', 'madurai', 'vizag', 'visakhapatnam',
  'goa', 'dehradun', 'haridwar',
];

const VEHICLE_KEYWORDS: Array<[RegExp, string]> = [
  [/container|20ft|32ft|40ft|cfs/i, 'Container'],
  [/trailer|trolley/i, 'Trailer'],
  [/tipper|dumper/i, 'Tipper'],
  [/open body|^open\b/i, 'Open'],
  [/closed|covered/i, 'Closed'],
];

function titleCase(value: string): string {
  return value
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Extract structured slots from free text. Deterministic keyword approach —
 * mirrors the backend freddyIntent fallback so the client and server agree.
 */
export function extractSlots(message: string): Partial<FreddySlots> {
  const lower = message.toLowerCase();
  const slots: Partial<FreddySlots> = {};

  const truckerSignals = [
    'find loads', 'looking for loads', 'have a truck', 'my truck',
    'empty truck', 'find work', 'earn money', 'haul goods', 'carry goods',
    'trucker', 'driver', 'want loads', 'need loads', 'loads to carry',
    'find something to carry', 'find work for my truck',
  ];
  const shipperSignals = [
    'need a truck', 'need truck', 'book a truck', 'hire a truck',
    'find a truck', 'want a truck', 'send my goods', 'ship my goods',
    'move my goods', 'transport my goods', 'shipper', 'goods to transport',
    'load to ship', 'goods to move', 'transport my goods',
  ];
  const truckWords = /\b(truck|container|trailer|lorry|vehicle|tipper)\b/.test(lower);

  if (truckerSignals.some((s) => lower.includes(s))) {
    slots.role = 'trucker';
  } else if (shipperSignals.some((s) => lower.includes(s)) || truckWords) {
    slots.role = 'shipper';
  }

  const price = lower.match(/(?:under|max|maximum|below|≤|<)\s*₹?\s*([\d,]+)/);
  if (price && price[1]) slots.budget = Number(price[1].replace(/,/g, ''));

  const cap = lower.match(/(\d+(?:\.\d+)?)\s*(?:tonne|tons?|t)\b/);
  if (cap && cap[1]) slots.capacity = Number(cap[1]);

  for (const [re, label] of VEHICLE_KEYWORDS) {
    if (re.test(lower)) {
      slots.vehicleType = label;
      break;
    }
  }

  const cities = CITY_LIST.filter((c) => lower.includes(c));
  if (cities.length >= 1 && cities[0]) slots.origin = titleCase(cities[0]);
  if (cities.length >= 2 && cities[1]) slots.destination = titleCase(cities[1]);

  return slots;
}

export interface QueryClassification {
  intent: 'market' | 'shipment' | null;
  slots: Partial<FreddySlots>;
}

/** Decide which tool a message wants, if any. */
export function classifyQuery(message: string): QueryClassification {
  const slots = extractSlots(message);
  if (slots.role === 'trucker') return { intent: 'shipment', slots };
  if (slots.role === 'shipper') return { intent: 'market', slots };
  return { intent: null, slots };
}

function escapeLike(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}

const TRIP_SELECT = [
  'id', 'origin_city', 'destination_city', 'departure_date',
  'available_capacity_tonnes', 'price_per_tonne', 'vehicle_type', 'status',
  'trucker:users!trips_trucker_id_fkey(full_name,rating,total_trips,is_verified)',
].join(',');

const SHIPMENT_SELECT = [
  'id', 'origin_city', 'destination_city', 'departure_date',
  'weight_tonnes', 'budget_per_tonne', 'goods_description', 'status',
  'shipper:users!shipments_shipper_id_fkey(full_name,rating,total_trips,is_verified)',
].join(',');

/**
 * Direct read-only database search via PostgREST with the caller's Clerk JWT.
 * Used when the agent-router edge function is unavailable or not deployed, so
 * Freddy still takes real action. Same RLS posture as the backend tools:
 * authenticated reads only, never mutates.
 */
export async function executeSearchDirect(
  slots: FreddySlots,
  getToken: () => Promise<string | null>,
  fetchImpl: typeof fetch = fetch,
): Promise<AgentRouterResponse> {
  const token = await getToken();
  if (!token) throw new Error('Authentication required');

  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!base || !anonKey) throw new Error('Service unavailable');

  const isShip = slots.role === 'trucker';
  const table = isShip ? 'shipments' : 'trips';
  const url = new URL(`/rest/v1/${table}`, base);
  url.searchParams.set('select', isShip ? SHIPMENT_SELECT : TRIP_SELECT);
  url.searchParams.set(
    'status',
    isShip ? 'in.("pending")' : 'in.("active","in_transit")'
  );
  if (slots.origin) {
    url.searchParams.set('origin_city', `ilike.%${escapeLike(slots.origin)}%`);
  }
  if (slots.destination) {
    url.searchParams.set('destination_city', `ilike.%${escapeLike(slots.destination)}%`);
  }
  if (slots.capacity != null) {
    url.searchParams.set(
      isShip ? 'weight_tonnes' : 'available_capacity_tonnes',
      `gte.${slots.capacity}`
    );
  }
  if (slots.budget != null) {
    url.searchParams.set(
      isShip ? 'budget_per_tonne' : 'price_per_tonne',
      `lte.${slots.budget}`
    );
  }
  if (slots.vehicleType) {
    url.searchParams.set('vehicle_type', `ilike.%${escapeLike(slots.vehicleType)}%`);
  }
  url.searchParams.set('order', 'departure_date.asc');
  url.searchParams.set('limit', '50');

  const res = await fetchImpl(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`Direct search failed (HTTP ${res.status})`);
  }

  const rows = (await res.json()) as Array<Record<string, unknown>>;
  const count = rows.length;
  const tool: AgentTool = isShip ? 'search_shipments' : 'search_market';
  const top = rows[0] as Record<string, unknown> | undefined;
  const topOrigin = typeof top?.origin_city === 'string' ? top.origin_city : '?';
  const topDest = typeof top?.destination_city === 'string' ? top.destination_city : '?';

  const summary =
    count === 0
      ? `No open ${isShip ? 'shipments' : 'trucks'} found matching your search. Try broadening your filters or check back later.`
      : `Found ${count} ${isShip ? 'open shipment' : 'truck'}${count === 1 ? '' : 's'} — starting with ${topOrigin} → ${topDest}.`;

  return {
    ok: true,
    tool,
    count,
    limit: 50,
    summary,
    ...(isShip
      ? { shipments: rows as unknown as AgentShipment[] }
      : { loads: rows as unknown as AgentLoad[] }),
  };
}

// ── Zero-result recovery: nearby-availability suggestions ──

/** Lightweight row shape for suggestion chips (tool-agnostic). */
export interface SuggestionRow {
  id: string;
  origin_city: string;
  destination_city: string;
  departure_date?: string;
  /** e.g. "2 t" (capacity or weight). */
  primary?: string;
  /** e.g. vehicle type or goods description. */
  secondary?: string;
  name?: string;
  verified?: boolean;
}

export interface AvailabilitySuggestion {
  key: 'route' | 'origin' | 'destination' | 'all';
  label: string;
  count: number;
  /** Relaxed slots to run when the user taps this suggestion. */
  slots: FreddySlots;
}

export interface AgentAvailability {
  role: 'shipper' | 'trucker';
  suggestions: AvailabilitySuggestion[];
}

const SUGGESTION_ROWS = 3;

function toSuggestionRow(
  row: Record<string, unknown>,
  isShip: boolean,
): SuggestionRow {
  const trucker = row.trucker as Record<string, unknown> | undefined;
  const shipper = row.shipper as Record<string, unknown> | undefined;
  const person = isShip ? shipper : trucker;
  return {
    id: String(row.id ?? ''),
    origin_city: String(row.origin_city ?? ''),
    destination_city: String(row.destination_city ?? ''),
    departure_date: typeof row.departure_date === 'string' ? row.departure_date : undefined,
    primary: isShip
      ? row.weight_tonnes != null
        ? `${row.weight_tonnes} t`
        : undefined
      : row.available_capacity_tonnes != null
        ? `${row.available_capacity_tonnes} t`
        : undefined,
    secondary: isShip
      ? typeof row.goods_description === 'string'
        ? row.goods_description
        : undefined
      : typeof row.vehicle_type === 'string'
        ? row.vehicle_type
        : undefined,
    name: typeof person?.full_name === 'string' ? person.full_name : undefined,
    verified: person?.is_verified === true,
  };
}

function buildLookupUrl(
  base: string,
  table: 'trips' | 'shipments',
  params: Record<string, string>,
  limit: number,
): string {
  const url = new URL(`/rest/v1/${table}`, base);
  url.searchParams.set('select', table === 'trips' ? TRIP_SELECT : SHIPMENT_SELECT);
  url.searchParams.set(
    'status',
    table === 'trips' ? 'in.("active","in_transit")' : 'in.("pending")'
  );
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('order', 'departure_date.asc');
  url.searchParams.set('limit', String(limit));
  return url.toString();
}

/**
 * When a strict search returns nothing, probe four relaxed scopes so Freddy
 * can guide the user instead of leaving them at a dead end:
 *   route → same origin+destination, fewer constraints
 *   origin → same origin, any destination
 *   destination → same destination, any origin
 *   all → the marketplace as a whole
 * Runs in parallel; each scope is capped at SUGGESTION_ROWS rows.
 * Failures degrade gracefully to empty scopes.
 */
export async function searchAvailability(
  slots: FreddySlots,
  getToken: () => Promise<string | null>,
  fetchImpl: typeof fetch = fetch,
): Promise<AgentAvailability> {
  const token = await getToken();
  if (!token) throw new Error('Authentication required');

  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!base || !anonKey) throw new Error('Service unavailable');

  const isShip = slots.role === 'trucker';
  const table = isShip ? 'shipments' : 'trips';

  const fetchScope = async (params: Record<string, string>): Promise<SuggestionRow[]> => {
    const url = buildLookupUrl(base, table, params, SUGGESTION_ROWS);
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Lookup failed (HTTP ${res.status})`);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return rows.map((row) => toSuggestionRow(row, isShip));
  };

  const originParam: Record<string, string> = slots.origin
    ? { origin_city: `ilike.%${escapeLike(slots.origin)}%` }
    : {};
  const destinationParam: Record<string, string> = slots.destination
    ? { destination_city: `ilike.%${escapeLike(slots.destination)}%` }
    : {};

  const [route, origin, destination, all] = await Promise.allSettled([
    fetchScope({ ...originParam, ...destinationParam }),
    Object.keys(originParam).length ? fetchScope(originParam) : Promise.reject(new Error('no-origin')),
    Object.keys(destinationParam).length ? fetchScope(destinationParam) : Promise.reject(new Error('no-destination')),
    fetchScope({}),
  ]);

  const take = (r: PromiseSettledResult<SuggestionRow[]>): SuggestionRow[] =>
    r.status === 'fulfilled' ? r.value : [];

  const routeRows = take(route);
  const originRows = take(origin);
  const destinationRows = take(destination);
  const allRows = take(all);

  const noun = isShip ? 'shipment' : 'truck';
  const suggestions: AvailabilitySuggestion[] = [];

  if (routeRows.length > 0) {
    suggestions.push({
      key: 'route',
      label: `${routeRows.length} ${noun}${routeRows.length > 1 ? 's' : ''} on ${slots.origin} → ${slots.destination} — with fewer constraints`,
      count: routeRows.length,
      slots: { role: slots.role, origin: slots.origin, destination: slots.destination },
    });
  }
  if (originRows.length > 0 && slots.origin) {
    suggestions.push({
      key: 'origin',
      label: `${originRows.length} ${noun}${originRows.length > 1 ? 's' : ''} from ${slots.origin} — any destination`,
      count: originRows.length,
      slots: { role: slots.role, origin: slots.origin },
    });
  }
  if (destinationRows.length > 0 && slots.destination) {
    suggestions.push({
      key: 'destination',
      label: `${destinationRows.length} ${noun}${destinationRows.length > 1 ? 's' : ''} heading to ${slots.destination} — any origin`,
      count: destinationRows.length,
      slots: { role: slots.role, destination: slots.destination },
    });
  }
  if (allRows.length > 0 && suggestions.length === 0) {
    suggestions.push({
      key: 'all',
      label: `${allRows.length} ${noun}${allRows.length > 1 ? 's' : ''} active across the marketplace right now`,
      count: allRows.length,
      slots: { role: slots.role },
    });
  }

  return { role: slots.role ?? 'shipper', suggestions };
}

const CACHE_MAX = 20;
const responseCache = new Map<string, AgentRouterResponse>();

/** Stable per-browser session UUID, persisted for cross-navigation memory. */
export function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem('freddy-session-id');
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) {
      return existing;
    }
    const id = crypto.randomUUID();
    localStorage.setItem('freddy-session-id', id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export interface AskFreddyAgentOptions {
  message: string;
  sessionId: string;
  history?: AgentChatMessage[];
  getToken: () => Promise<string | null>;
  /** Preferred reply language (used for language-matched responses). */
  lang?: "en" | "hi";
  fetchImpl?: typeof fetch;
}

export async function askFreddyAgent(options: AskFreddyAgentOptions): Promise<AgentRouterResponse> {
  const { message, sessionId, history = [], getToken, lang = "en", fetchImpl = fetch } = options;

  const cacheKey = `${sessionId}:${message.trim().toLowerCase()}`;
  const cached = responseCache.get(cacheKey);
  if (cached) return cached;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) throw new Error('Service unavailable');

  const token = await getToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetchImpl(`${supabaseUrl}/functions/v1/agent-router`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      sessionId,
      history: history.slice(-6),
      lang,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const errData = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(errData.detail || errData.error || `Freddy error (${res.status})`);
  }

  const data = (await res.json()) as AgentRouterResponse;
  if (!data.ok) {
    throw new Error(data.detail || data.error || 'Freddy returned no results');
  }

  // Cache search-style results for identical queries within this page session
  // (credit insights are personal and are not cached).
  if (data.tool && data.tool !== 'credit-insights') {
    responseCache.set(cacheKey, data);
    if (responseCache.size > CACHE_MAX) {
      const firstKey = responseCache.keys().next().value;
      if (firstKey !== undefined) responseCache.delete(firstKey);
    }
  }

  return data;
}
