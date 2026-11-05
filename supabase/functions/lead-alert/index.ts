// Instant Telegram alert when a new lead lands in public.leads.
//
// Called best-effort by the browser right after a successful leads insert
// (supabase/src/lib/leadCapture.ts). verify_jwt=false via
// supabase/config.toml because the caller is an anonymous visitor — the
// browser has no JWT to offer.
//
// Anti-abuse (the browser cannot be trusted):
//   1. Freshness: a matching lead row must actually exist in public.leads
//      within the last 10 minutes (service-role SELECT). Fabricated payloads
//      with no real insert are dropped silently. Real leads from the 2026-10-19
//      QuoteLeadCard flow always insert first, so legit alerts always pass.
//   2. Flood guard: more than 12 leads in the last 2 minutes → skip the
//      individual alert (the 10:00 daily digest still reports the burst).
//   3. Per-IP rate limit (10/min) via _shared/edgeHelpers.
//
// Reliability contract: best effort. Telegram outages or missing secrets
// must never affect the visitor's page (the browser ignores this response)
// and never lose the lead — the leads table row and the daily digest
// (api/cron/daily.js) remain the source of truth.
//
// Secrets (Deno env, set via `supabase secrets set` or the dashboard):
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Self-contained helpers (inlined from ../_shared/edgeHelpers.ts) so the
// function deploys as a single file via API-based tooling. If you change
// _shared helpers, mirror here.
const ALLOWED_ORIGINS = [
  "https://loadsaathi.in",
  "https://www.loadsaathi.in",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

function getRequestIp(req: Request): string {
  // Prefer platform-set peer identity when present; only fall back to the
  // client-suppliable X-Forwarded-For first hop.
  return (
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAP_CAP = 10_000;

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  if (rateLimitMap.size > RATE_LIMIT_MAP_CAP) {
    const expired: string[] = [];
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) expired.push(key);
    }
    for (const key of expired) rateLimitMap.delete(key);
    if (rateLimitMap.size > RATE_LIMIT_MAP_CAP) {
      const oldest = [...rateLimitMap.entries()].sort(
        (a, b) => a[1].resetAt - b[1].resetAt,
      );
      for (let i = 0; i < oldest.length && rateLimitMap.size > RATE_LIMIT_MAP_CAP; i++) {
        rateLimitMap.delete(oldest[i][0]);
      }
    }
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

function errorResponse(
  message: string,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers });
}

function optionsResponse(headers: Record<string, string>): Response {
  return new Response(null, { status: 204, headers });
}

interface LeadAlertPayload {
  leadId?: string;
  phone?: string;
  name?: string;
  source?: string;
  page_path?: string;
  message?: string;
}

const FRESH_WINDOW_MS = 10 * 60 * 1000; // row must exist within this window
const FLOOD_COUNT = 12; // leads within the flood window that suppress alerts
const FLOOD_WINDOW_MS = 2 * 60 * 1000;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

// Telegram parse_mode=HTML — escape anything that could break markup.
function tgEsc(s: unknown): string {
  const str = String(s ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function handler(req: Request): Promise<Response> {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return optionsResponse(cors);
  if (req.method !== "POST") return errorResponse("Method not allowed", 405, cors);

  const ip = getRequestIp(req);
  if (!checkRateLimit(ip, 10, 60_000)) {
    return json({ ok: false, reason: "rate_limited" }, 200);
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!botToken || !chatId) {
    // Not configured yet — quiet no-op. The browser ignores this response.
    return json({ ok: false, reason: "telegram_not_configured" }, 200);
  }
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, reason: "service_credentials_missing" }, 200);
  }

  let payload: LeadAlertPayload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400, cors);
  }

  // --- Substantiation: a real lead row must exist recently ---------------
  const admin = createClient(supabaseUrl, serviceKey);
  const since = new Date(Date.now() - FRESH_WINDOW_MS).toISOString();
  const { data: recent, error: recentErr } = await admin
    .from("leads")
    .select("id, phone, source, page_path, message")
    .gte("created_at", since)
    .limit(50);

  if (recentErr) {
    console.error("[lead-alert] leads read failed:", recentErr.message);
    return json({ ok: false, reason: "db_error" }, 200);
  }

  const rows = recent ?? [];
  const phone = (payload.phone ?? "").trim();
  const message = (payload.message ?? "").trim();

  // Substantiation: prefer an exact inserted-row binding (the id returned by
  // the insert). Without an id, require full equality on (source, page_path)
  // plus phone or message against a single row — a bare (source, page_path)
  // pair match is no longer sufficient.
  let backed = false;
  if (payload.leadId) {
    const { data: hit } = await admin
      .from("leads")
      .select("id")
      .eq("id", payload.leadId)
      .gte("created_at", since)
      .maybeSingle();
    backed = !!hit;
  } else {
    backed =
      rows.findIndex(
        (r) =>
          r.source === (payload.source ?? "") &&
          r.page_path === (payload.page_path ?? "") &&
          (phone.length > 0 ? r.phone === phone : true) &&
          (message.length > 0 ? (r.message ?? "").trim() === message : true) &&
          (phone.length > 0 || message.length > 0),
      ) >= 0;
  }

  if (!backed) {
    // No matching recent insert — treat as fabricated and stay silent
    // (don't announce the skip loudly; keep the reason opaque).
    return json({ ok: false }, 200);
  }

  // --- Flood guard --------------------------------------------------------
  const floodSince = new Date(Date.now() - FLOOD_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", floodSince);
  if ((count ?? 0) > FLOOD_COUNT) {
    return json({ ok: false, reason: "flood_suppressed" }, 200);
  }

  // --- Send ----------------------------------------------------------------
  const text =
    `🚨 <b>New lead${payload.source ? ` — ${tgEsc(payload.source)}` : ""}</b>\n` +
    (payload.message ? `<pre>${tgEsc(payload.message)}</pre>` : "") +
    `🕐 ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

  try {
    const send = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const sent = await send.json();
    return json({ ok: Boolean(sent?.ok) }, 200);
  } catch (err) {
    console.error("[lead-alert] telegram send failed:", (err as Error).message);
    return json({ ok: false, reason: "telegram_error" }, 200);
  }
}

// The edge runtime serves only what Deno.serve registers — a bare exported
// handler leaves it accepting connections without ever responding.
Deno.serve(async (req: Request): Promise<Response> => {
  return handler(req);
});
