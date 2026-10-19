// Daily Telegram digest for the founder.
//
// Vercel cron (see vercel.json "crons") GETs this route each morning at
// 10:00 IST. The route pulls a 24-hour ops snapshot from the Supabase edge
// function `ops-daily-digest` (exact diesel-cron pattern: platform handles
// service-role access inside the function, we authenticate with the anon
// key), also pings the production sitemap as a liveness check, then posts
// the formatted digest to the configured Telegram chat.
// Secrets live in Vercel env vars: CRON_SECRET, VITE_*/SUPABASE_* (anon),
// TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.

export const config = { runtime: 'nodejs', maxDuration: 30 };

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

const SITE_URL = 'https://loadsaathi.in';

const tgEsc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Masks contact details for a cloud-backed chat: phone keeps last 4, email local-part keeps first 2. */
function maskContact(kind, raw) {
  const v = String(raw || '');
  if (!v) return '';
  if (kind === 'email') {
    const [local, domain] = v.split('@');
    return `${local.slice(0, 2)}${local.length > 2 ? '***' : ''}@${domain}`;
  }
  return `+91•••••${v.slice(-4)}`;
}

async function pingSitemap() {
  const started = Date.now();
  try {
    const res = await fetch(`${SITE_URL}/sitemap.xml`, {
      method: 'HEAD',
      headers: { 'User-Agent': 'LoadSaathiCron/1.0 (+https://loadsaathi.in)' },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, status: res.status, ms: Date.now() - started };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - started, error: String((err && err.message) || err) };
  }
}

function sourceLabel(source) {
  const map = {
    quote_lead_card: 'quote cards',
    quote_wa_quick: 'WA quick',
    whatsapp_fab_owner: 'WhatsApp',
    contact_form: 'contact',
  };
  return map[source] || (source || 'other');
}

function leadLine(row) {
  const contact = row.email
    ? `✉ ${maskContact('email', row.email)}`
    : row.phone
      ? `📱 ${maskContact('phone', row.phone)}`
      : 'no contact';
  const name = (row.name || '').trim() || '—';
  const at = String(row.created_at || '').slice(11, 16);
  return `• ${tgEsc(name)} · ${contact} · ${tgEsc(sourceLabel(row.source))} · <i>${tgEsc(at)} UTC</i>`;
}

function digestText(data, ping) {
  const today = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const leads = data.leads || { total: 0, withEmail: 0, bySource: {}, rows: [] };
  const trips = data.trips || { total: 0, rows: [] };
  const shipments = data.shipments || { total: 0, rows: [] };
  const diesel = data.diesel;

  const srcSummary = Object.entries(leads.bySource || {})
    .map(([k, n]) => `${tgEsc(sourceLabel(k))}: ${n}`)
    .join(' · ');

  const route = (r) => `${r.origin_city || '?'}→${r.destination_city || '?'}`;
  const tripLines = (trips.rows || []).slice(0, 3).map((r) => `• ${tgEsc(route(r))} (${tgEsc(r.status || '')})`);
  const shipLines = (shipments.rows || []).slice(0, 3).map((r) => `• ${tgEsc(route(r))} ${r.weight_tonnes ? `· ${r.weight_tonnes}t` : ''}`);

  const lines = [
    `📊 <b>LoadSaathi daily digest — ${tgEsc(today)}</b>`,
    '',
    `<b>Leads (last 24h): ${leads.total}</b>${leads.total !== 0 && leads.withEmail !== undefined ? ` (${leads.withEmail} with email ✉)` : ''}`,
    srcSummary ? `<i>${srcSummary}</i>` : '<i>wall silent — lows calm the hustle</i>',
    ...(leads.rows || []).slice(0, 5).map(leadLine),
    '',
    `<b>Marketplace (24h)</b>`,
    `Trucks posted: ${trips.total}  ·  Loads posted: ${shipments.total}`,
    `Trip requests: ${data.shipmentRequests ?? 0}  ·  Messages: ${data.messages ?? 0}`,
    ...(tripLines.length ? tripLines : []),
    ...(shipLines.length ? ['<i>— loads —</i>', ...shipLines] : []),
    '',
    `⛽ ${diesel
      ? `${tgEsc(diesel.state)} diesel ₹${tgEsc(diesel.diesel_price)}/L${diesel.effective_date ? ` (eff ${tgEsc(diesel.effective_date)})` : ''}`
      : 'no diesel update today'}`,
    `Price history entries: ${data.priceHistory ?? 0}`,
    '',
    `🗺 <a href="${SITE_URL}/sitemap.xml">sitemap</a>: ${ping.ok ? `✅ ${ping.status} (${ping.ms} ms)` : `⚠️ ${ping.status || ping.error || 'unreachable'} (${ping.ms} ms)`}`,
    `🕐 sent ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  ];
  return lines.join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${secret}`) {
      return json(res, 401, { error: 'Unauthorized' });
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!supabaseUrl || !anonKey) {
    return json(res, 500, { error: 'Supabase URL / anon key not configured' });
  }
  if (!botToken || !chatId) {
    return json(res, 500, { error: 'Telegram bot token / chat id not configured' });
  }

  let snapshot;
  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/ops-daily-digest`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(25000),
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      return json(res, 502, { error: 'ops-daily-digest failed', upstreamStatus: upstream.status, body: text.slice(0, 400) });
    }
    try {
      snapshot = JSON.parse(text);
    } catch {
      return json(res, 502, { error: 'ops-daily-digest returned non-JSON', body: text.slice(0, 200) });
    }
  } catch (err) {
    return json(res, 502, { error: 'ops-daily-digest request failed', message: String((err && err.message) || err) });
  }

  const ping = await pingSitemap();

  try {
    const send = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        text: digestText(snapshot, ping),
      }),
      signal: AbortSignal.timeout(10000),
    });
    const sent = await send.json();
    if (!sent.ok) {
      return json(res, 502, { error: 'Telegram sendMessage failed', telegram: sent });
    }
    return json(res, 200, { ok: true, sitemap: ping, message_id: sent.result && sent.result.message_id });
  } catch (err) {
    return json(res, 502, { error: 'Telegram request failed', message: String((err && err.message) || err) });
  }
}
