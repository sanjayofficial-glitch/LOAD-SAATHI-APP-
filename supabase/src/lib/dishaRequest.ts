/**
 * Disha coordinator — client-side helpers for the opt-in, read-only
 * "Ask Disha" workflow exposed inside Freddy's speech bubble.
 *
 * Nothing here touches the database directly. The only network call is
 * askDisha(), which POSTs `{ message, disha: true }` to the existing
 * agent-router Edge Function with the caller's own Supabase JWT. Filter
 * extraction, the marketplace search (RLS included) and the explanation all
 * happen server-side; the client only decides whether a question is in scope
 * and how to render the honest response.
 */

// ---------------------------------------------------------------------------
// Response types (mirror supabase/functions/_shared/dishaWorkflow.ts and the
// additive "disha" block built by agent-router/handler.ts).
// ---------------------------------------------------------------------------

export type DishaStepName = 'shipment_analyst' | 'matching_specialist' | 'disha_coordinator';

export type DishaStepStatus = 'started' | 'completed' | 'failed' | 'skipped';

export interface DishaStepEvent {
  step: DishaStepName;
  status: DishaStepStatus;
  /** Short, scrubbed, server-authored. Never a prompt, token or raw message. */
  summary: string;
  durationMs: number;
}

export type DishaIntent = 'route_search' | 'capacity_search' | 'price_search' | 'unconstrained';

export type DishaMissingKey =
  | 'origin'
  | 'destination'
  | 'min_capacity_tonnes'
  | 'max_price_per_tonne';

/** Public row projection: never carries trip ids, trucker ids or names. */
export interface DishaRow {
  origin: string;
  destination: string;
  departure_date: string;
  capacity_tonnes?: number;
  price_per_tonne?: number;
  vehicle_type?: string;
  distance_km?: number;
  duration_min?: number;
}

export type DishaBlockStatus = 'completed' | 'failed' | 'unavailable' | 'skipped';

export interface DishaBlock {
  status: DishaBlockStatus;
  intent: DishaIntent;
  missing: DishaMissingKey[];
  rows: DishaRow[];
  explanation: string;
  explanationSource: 'model' | 'deterministic';
  provider: string;
  checkedAt: string;
  trace: DishaStepEvent[];
}

// ---------------------------------------------------------------------------
// Supported-request classifier (client-side pre-flight only; the server is
// always authoritative about what actually runs).
// ---------------------------------------------------------------------------

/** A freight/marketplace signal must be present at all. */
const LOGISTICS_SIGNAL =
  /\b(shipments?|loads?|trucks?|trucking|trips?|freight|cargo|haul(?:ers?|ing)|carriers?|consignments?|logistics|transport(?:ation|ers?)?)\b/i;

/** AND at least one concrete search constraint: */
const ROUTE_CONSTRAINT = /\b(?:origin|destination|route|from)\b|\bto\s+[a-z]/i;
const CAPACITY_CONSTRAINT = /\b\d+(?:[.,]\d+)?\s*(?:t|tons?|tonnes?)\b/i;
const PRICE_CONSTRAINT =
  /(?:₹|inr\.?\s*|rs\.?\s*)\s*\d|\b\d[\d,]*(?:\.\d+)?\s*(?:per|\/)\s*(?:t|tons?|tonnes?)\b|\b(?:price|rate|budget|cost|cheapest|affordable)\b/i;

/**
 * True only for requests Disha can actually run: a logistics question that
 * names a route, a capacity or a price. Everything else (account help,
 * payments, status of *my* shipment, chit-chat) stays with Freddy.
 */
export function isSupportedDishaRequest(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  if (!LOGISTICS_SIGNAL.test(text)) return false;
  return ROUTE_CONSTRAINT.test(text) || CAPACITY_CONSTRAINT.test(text) || PRICE_CONSTRAINT.test(text);
}

// ---------------------------------------------------------------------------
// UI feature flag — default off; "true" (exact) turns the button on.
// ---------------------------------------------------------------------------

export interface DishaEnv {
  readonly VITE_DISHA_UI?: string | undefined;
}

export function isDishaUiEnabled(env: DishaEnv = import.meta.env): boolean {
  return env?.VITE_DISHA_UI === 'true';
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export class DishaRequestError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'DishaRequestError';
    this.status = status;
  }
}

export interface AskDishaOptions {
  message: string;
  /** VITE_SUPABASE_URL — no other base URL is ever accepted. */
  supabaseUrl: string;
  /** Caller's own Supabase JWT; omitted when absent (server rejects). */
  token?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * POST `{ message, disha: true }` to the agent-router Edge Function.
 *
 * Returns the parsed body. A non-OK response still yields the body when it
 * carries a "disha" block (the server reports search failures honestly inside
 * a 502), otherwise a DishaRequestError is thrown with the server's own error
 * string. Unreadable or non-object bodies always throw — we never invent a
 * result.
 */
export async function askDisha(options: AskDishaOptions): Promise<Record<string, unknown>> {
  const { message, supabaseUrl, token, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const fetchImpl = options.fetchImpl ?? fetch;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const signal =
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(timeoutMs)
      : undefined;

  const response = await fetchImpl(`${supabaseUrl}/functions/v1/agent-router`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, disha: true }),
    ...(signal ? { signal } : {}),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new DishaRequestError('Disha received a response she could not read. Please try again.');
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new DishaRequestError('Disha received an unexpected response from the service.');
  }

  const record = body as Record<string, unknown>;
  if (!response.ok && !('disha' in record)) {
    const detail =
      typeof record.error === 'string' && record.error.trim()
        ? record.error
        : `The service could not answer (HTTP ${response.status}).`;
    throw new DishaRequestError(detail, response.status);
  }

  return record;
}

// ---------------------------------------------------------------------------
// Response interpretation → view states
// ---------------------------------------------------------------------------

export type DishaViewState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'unsupported' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; block: DishaBlock; requestId?: string; serverError?: string };

const DISHA_STATUSES: readonly DishaBlockStatus[] = ['completed', 'failed', 'unavailable', 'skipped'];
const DISHA_STEPS: readonly DishaStepName[] = [
  'shipment_analyst',
  'matching_specialist',
  'disha_coordinator',
];
const DISHA_STEP_STATUSES: readonly DishaStepStatus[] = ['started', 'completed', 'failed', 'skipped'];
const DISHA_INTENTS: readonly DishaIntent[] = [
  'route_search',
  'capacity_search',
  'price_search',
  'unconstrained',
];
const DISHA_MISSING_KEYS: readonly DishaMissingKey[] = [
  'origin',
  'destination',
  'min_capacity_tonnes',
  'max_price_per_tonne',
];

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function parseRow(raw: unknown): DishaRow | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const origin = record.origin;
  const destination = record.destination;
  const departure = record.departure_date;
  if (typeof origin !== 'string' || typeof destination !== 'string' || typeof departure !== 'string') {
    return null;
  }
  const row: DishaRow = { origin, destination, departure_date: departure };
  const capacity = asNumber(record.capacity_tonnes);
  if (capacity !== undefined) row.capacity_tonnes = capacity;
  const price = asNumber(record.price_per_tonne);
  if (price !== undefined) row.price_per_tonne = price;
  if (typeof record.vehicle_type === 'string') row.vehicle_type = record.vehicle_type;
  const distance = asNumber(record.distance_km);
  if (distance !== undefined) row.distance_km = distance;
  const duration = asNumber(record.duration_min);
  if (duration !== undefined) row.duration_min = duration;
  return row;
}

function parseTraceEvent(raw: unknown): DishaStepEvent | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const step = record.step;
  const status = record.status;
  if (typeof step !== 'string' || !DISHA_STEPS.includes(step as DishaStepName)) return null;
  if (typeof status !== 'string' || !DISHA_STEP_STATUSES.includes(status as DishaStepStatus)) return null;
  return {
    step: step as DishaStepName,
    status: status as DishaStepStatus,
    summary: asString(record.summary),
    durationMs: asNumber(record.durationMs) ?? 0,
  };
}

/**
 * Validate and coerce a raw "disha" block. Returns null when the block is
 * absent or its status is unknown (the only hard failure); everything else is
 * coerced to safe rendering defaults so a malformed field can never crash or
 * mislead the UI.
 */
export function parseDishaBlock(raw: unknown): DishaBlock | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const status = record.status;
  if (typeof status !== 'string' || !DISHA_STATUSES.includes(status as DishaBlockStatus)) return null;

  const intent = record.intent;
  const source = record.explanationSource;

  return {
    status: status as DishaBlockStatus,
    intent:
      typeof intent === 'string' && DISHA_INTENTS.includes(intent as DishaIntent)
        ? (intent as DishaIntent)
        : 'unconstrained',
    missing: Array.isArray(record.missing)
      ? record.missing.filter((key): key is DishaMissingKey =>
          typeof key === 'string' && DISHA_MISSING_KEYS.includes(key as DishaMissingKey),
        )
      : [],
    rows: Array.isArray(record.rows)
      ? record.rows.map(parseRow).filter((row): row is DishaRow => row !== null)
      : [],
    explanation: asString(record.explanation),
    explanationSource: source === 'model' ? 'model' : 'deterministic',
    provider: asString(record.provider, 'none'),
    checkedAt: asString(record.checkedAt),
    trace: Array.isArray(record.trace)
      ? record.trace.map(parseTraceEvent).filter((event): event is DishaStepEvent => event !== null)
      : [],
  };
}

/**
 * Map a response body to a view state. The server's additive "disha" block is
 * the single source of truth; a body without a usable block becomes an honest
 * error view rather than a fabricated answer.
 */
export function interpretDishaResponse(body: unknown): DishaViewState {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { kind: 'error', message: 'Disha received an unexpected response from the service.' };
  }
  const record = body as Record<string, unknown>;
  const block = parseDishaBlock(record.disha);
  if (!block) {
    return {
      kind: 'error',
      message: 'Disha did not return an answer for this request. Nothing was booked.',
    };
  }
  return {
    kind: 'ok',
    block,
    requestId: typeof record.requestId === 'string' ? record.requestId : undefined,
    serverError: typeof record.error === 'string' ? record.error : undefined,
  };
}
