// Freddy agent-router client helper (browser side).
//
// Talks to the Supabase edge function /functions/v1/agent-router — the agentic
// backend that performs read-only tool calls (search_market, search_shipments,
// credit-insights) with conversation memory. The agent-router is the single
// source of truth for search intent: the client does not parse queries or
// query the database directly. When the backend is unavailable or disabled,
// the caller (FreddyChatModal) degrades to the lightweight freddyAI.ask()
// knowledge-base path.

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
  /** Zero-result recovery: relaxed-scope suggestions (label + re-run query). */
  suggestions?: { label: string; query: string }[];
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
