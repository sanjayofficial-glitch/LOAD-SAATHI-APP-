// Instant quote email — fired when a visitor submits a lead with an email.
//
// Triggered from Supabase by the on-insert webhook on public.leads
// (migration 20261019140001), which POSTs the lead row here with a Bearer
// CRON_SECRET header. Sends two emails through Resend:
//   1. lead-facing instant quote acknowledgement (same-minute value loop)
//   2. founder-facing "new lead" notification (custodian copy)
// Secrets come from Vercel env vars (RESEND_API_KEY, CRON_SECRET) — they are
// never read from files.

export const config = { runtime: 'nodejs', maxDuration: 25 };

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', 'https://loadsaathi.in');
  res.end(JSON.stringify(body));
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BRAND = 'LoadSaathi';
const SITE_URL = 'https://loadsaathi.in';
const SUPPORT_EMAIL = 'support@loadsaathi.in';
const PHONE_DISPLAY = '+91-83289-98031';
const PHONE_E164 = '+918328998031';
const OFFICE = 'FTBI, NIT Rourkela, Sector 1, Rourkela, Odisha 769008';
const FROM = `${BRAND} Quotes <quotes@mail.loadsaathi.in>`;
const SHIPPER_FEE = 'a transaction fee on completed shipments — see the pricing page for the published schedule';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SOURCE_LABELS = {
  quote_lead_card: 'freight quote request',
  quote_wa_quick: 'WhatsApp quick chat',
  whatsapp_fab_owner: 'WhatsApp chat',
  contact_form: 'contact form message',
};

function sourceLabel(source) {
  return SOURCE_LABELS[source] || (source ? String(source) : 'website enquiry');
}

/** Extracts the richer context rows our lead-capture cards prepend to message. */
function extractContext(message) {
  const m = String(message || '');
  return {
    route: (m.match(/^Route:\s*(.+)$/m) || [])[1] || '',
    weight: (m.match(/^Weight:\s*(.+)$/m) || [])[1] || '',
    estimate: (m.match(/^Estimate shown:\s*(.+)$/m) || [])[1] || '',
  };
}

function chip(label, value) {
  return `<tr>
          <td style="padding:4px 12px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#5f6368;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
          <td style="padding:4px 12px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#202124;">${esc(value)}</td>
        </tr>`;
}

function buildLeadHtml(lead) {
  const ctx = extractContext(lead.message);
  const who = esc(lead.name || 'there');
  const contactLines = [
    chip('Enquiry', sourceLabel(lead.source)),
    lead.phone ? chip('Phone', lead.phone) : '',
    lead.email ? chip('Email', lead.email) : '',
    ctx.route ? chip('Route', ctx.route) : '',
    ctx.weight ? chip('Weight', ctx.weight) : '',
    ctx.estimate ? chip('Indicative estimate', ctx.estimate) : '',
    lead.page_path ? chip('Page', lead.page_path) : '',
  ].filter(Boolean).join('\n');

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f5f7;padding:24px 8px;">
    <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3e6ea;">
      <tr>
        <td style="background:#0b3d2e;padding:20px 24px;">
          <span style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;">🚚 ${esc(BRAND)}</span>
          <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#c9e3d7;margin-top:4px;">India's AI-Powered Freight Marketplace</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 24px 8px;">
          <h1 style="margin:0 0 12px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:22px;color:#1a1a2e;">Your quote request is in 📋</h1>
          <p style="margin:0 0 16px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#3c4043;">
            Hello ${who}! Thanks for reaching out. Here is what we received:
          </p>
          <table role="presentation" width="100%" style="background:#f8f9fa;border-radius:8px;margin:0 0 18px;">${contactLines}</table>
          <p style="margin:0 0 14px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#3c4043;">
            <strong>What happens next</strong>
          </p>
          <p style="margin:0 0 6px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#3c4043;">
            1️⃣ Within business hours our team matches your load against verified trucks on the lane and confirms live rates.<br>
            2️⃣ LoadSaathi's platform fee: ${esc(SHIPPER_FEE)} — no hidden charges.<br>
            3️⃣ Once you confirm a truck, you get live GPS tracking until delivery.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;">
            <tr>
              <td style="border-radius:8px;background:#16a34a;">
                <a href="https://wa.me/${PHONE_E164.replace('+', '')}"
                   style="display:inline-block;padding:12px 22px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Chat with your load manager</a>
              </td>
              <td style="width:10px;">&nbsp;</td>
              <td style="border-radius:8px;background:#0b3d2e;">
                <a href="tel:${PHONE_E164}"
                   style="display:inline-block;padding:12px 22px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Call ${esc(PHONE_DISPLAY)}</a>
              </td>
            </tr>
          </table>
          <p style="margin:10px 0 0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#5f6368;">
            Prefer comparing rates first? Browse live lanes and price ranges at <a href="${SITE_URL}" style="color:#0b7a3e;">${SITE_URL}</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 24px 24px;border-top:1px solid #eef1f4;">
          <p style="margin:0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#9aa0a6;">
            ${esc(BRAND)} · ${esc(OFFICE)}<br>
            You received this because you requested a freight quote at ${esc(SITE_URL.replace('https://', ''))} with this email address.
            Not you? <a href="mailto:${SUPPORT_EMAIL}?subject=Remove%20me%20from%20lead%20emails" style="color:#9aa0a6;">Tell us and we'll remove it</a>.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildLeadText(lead) {
  const ctx = extractContext(lead.message);
  return [
    `Your ${BRAND} quote request is in`,
    '',
    `Thanks${lead.name ? `, ${lead.name}` : ''}! Here is what we received:`,
    `- Enquiry: ${sourceLabel(lead.source)}`,
    lead.phone ? `- Phone: ${lead.phone}` : '',
    lead.email ? `- Email: ${lead.email}` : '',
    ctx.route ? `- Route: ${ctx.route}` : '',
    ctx.weight ? `- Weight: ${ctx.weight}` : '',
    ctx.estimate ? `- Indicative estimate: ${ctx.estimate}` : '',
    lead.page_path ? `- Page: ${lead.page_path}` : '',
    '',
    'Next: our team matches your load against verified trucks on the lane and',
    `confirms live rates. Platform fee: ${SHIPPER_FEE}.`,
    '',
    `Chat on WhatsApp: https://wa.me/${PHONE_E164.replace('+', '')}`,
    `Call: ${PHONE_DISPLAY}`,
    `Browse rates: ${SITE_URL}`,
    '',
    `${BRAND} · ${OFFICE}`,
  ].filter((l) => l !== undefined || l === '').join('\n');
}

function buildOwnerHtml(lead) {
  const ctx = extractContext(lead.message);
  return [
    '<html><body style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#202124;">',
    `<p><strong>New lead</strong> — ${esc(sourceLabel(lead.source))}</p>`,
    '<table role="presentation" cellpadding="6" style="border-collapse:collapse;">',
    lead.name ? `<tr><td><strong>Name</strong></td><td>${esc(lead.name)}</td></tr>` : '',
    lead.email ? `<tr><td><strong>Email</strong></td><td>${esc(lead.email)}</td></tr>` : '',
    lead.phone ? `<tr><td><strong>Phone</strong></td><td>${esc(lead.phone)}</td></tr>` : '',
    ctx.route ? `<tr><td><strong>Route</strong></td><td>${esc(ctx.route)}</td></tr>` : '',
    ctx.weight ? `<tr><td><strong>Weight</strong></td><td>${esc(ctx.weight)}</td></tr>` : '',
    ctx.estimate ? `<tr><td><strong>Estimate</strong></td><td>${esc(ctx.estimate)}</td></tr>` : '',
    lead.page_path ? `<tr><td><strong>Page</strong></td><td>${esc(lead.page_path)}</td></tr>` : '',
    lead.created_at ? `<tr><td><strong>At</strong></td><td>${esc(String(lead.created_at).slice(0, 16).replace('T', ' '))} UTC</td></tr>` : '',
    '</table>',
    lead.message ? `<pre style="white-space:pre-wrap;margin:14px 0 0;font-family:inherit;font-size:13px;background:#f8f9fa;padding:12px;border-radius:8px;">${esc(lead.message).slice(0, 1200)}</pre>` : '',
    `<p style="color:#5f6368;font-size:13px;">Ack email sent to ${esc(lead.email)}. Follow up from the <a href="${SITE_URL}/admin">command center</a>.</p>`,
    '</body></html>',
  ].filter(Boolean).join('\n');
}

async function sendResend(payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(body && body.message) || 'send failed'}`);
  }
  return body.id || null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  // Anonymous URL must never fire emails: require the shared secret.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return json(res, 401, { error: 'Unauthorized' });
  }
  if (!process.env.RESEND_API_KEY) {
    return json(res, 500, { error: 'RESEND_API_KEY not configured' });
  }

  let lead;
  try {
    lead = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
  } catch {
    return json(res, 422, { error: 'Invalid JSON body' });
  }
  const email = String(lead.email || '').trim();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json(res, 422, { error: 'Valid email required' });
  }

  // Bound every echoed field so a hostile payload cannot blow up rendering.
  const clip = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, n);
  const safeLead = {
    id: clip(lead.id, 40),
    created_at: clip(lead.created_at, 40),
    email,
    phone: clip(lead.phone, 24),
    name: clip(lead.name, 80),
    source: clip(lead.source, 40),
    page_path: clip(lead.page_path, 200),
    message: clip(lead.message, 2000),
  };
  const route = extractContext(safeLead.message).route;
  const subjectTail = route ? ` — ${route}` : '';

  try {
    const ackId = await sendResend({
      from: FROM,
      to: [safeLead.email],
      reply_to: SUPPORT_EMAIL,
      subject: `${BRAND}: your freight enquiry${subjectTail}`,
      html: buildLeadHtml(safeLead),
      text: buildLeadText(safeLead),
    });
    let ownerId = null;
    try {
      // Owner/notifications destination. Overridable per environment because
      // loadsaathi.in's root has no MX — point OWNER_EMAIL at a real inbox
      // (e.g. the founder's personal one) via Vercel env vars at any time;
      // the brand inbox stays the reply-to on the lead ack.
      ownerId = await sendResend({
        from: FROM,
        to: [process.env.OWNER_EMAIL || SUPPORT_EMAIL],
        subject: `New lead (${sourceLabel(safeLead.source)})${subjectTail}`,
        html: buildOwnerHtml(safeLead),
      });
    } catch (ownerErr) {
      // The lead acknowledgement already went out — report the owner-copy
      // failure in the response so ops can see it, without triggering any
      // retry (pg_net sends are fire-once).
      return json(res, 200, { ok: true, lead_id: safeLead.id, ack: ackId, owner_error: String(ownerErr.message || ownerErr) });
    }
    return json(res, 200, { ok: true, lead_id: safeLead.id, ack: ackId, owner: ownerId });
  } catch (err) {
    return json(res, 502, { error: 'Quote email send failed', message: String((err && err.message) || err) });
  }
}
