/**
 * Safe re-engagement nudge for users who signed up but never picked a role.
 *
 * Safe by design:
 *  - NO database writes, NO deletions, NO app changes.
 *  - Sends only when you run it with RESEND_API_KEY set.
 *  - One email per recipient, per-recipient try/catch — one failure never
 *    blocks the others.
 *
 * Usage:
 *   $env:RESEND_API_KEY="re_..." ; node api/nudge-onboarding.mjs
 * (or set RESEND_API_KEY in your environment / Vercel first)
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const BRAND = 'LoadSaathi';
const FROM = 'LoadSaathi <quotes@mail.loadsaathi.in>';
const REPLY_TO = 'support@loadsaathi.in';
const SITE_URL = 'https://loadsaathi.in';
const CHOOSE_ROLE_URL = `${SITE_URL}/choose-role`;

/** The 4 users who signed up but never completed role selection. */
const RECIPIENTS = [
  { email: 'maqsood7867867869@gmail.com', name: 'Manzile' },
  { email: 'yashladdha95.yl@gmail.com', name: 'Yash' },
  { email: 'abhikanha12345@gmail.com', name: 'Abhilash' },
  { email: 'amitkumarpusty2506@gmail.com', name: 'Amit' },
];

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );

function buildHtml(name) {
  return [
    '<html><body style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#202124;margin:0;padding:24px;">',
    '<div style="max-width:520px;margin:0 auto;">',
    '<p style="font-size:20px;font-weight:700;color:#ea580c;margin:0 0 6px;">LoadSaathi</p>',
    `<p>Hi ${esc(name)},</p>`,
    '<p>You created a LoadSaathi account a little while ago but haven&rsquo;t yet chosen whether you&rsquo;re a <strong>Shipper</strong> or a <strong>Trucker</strong>.</p>',
    '<p>That one step unlocks your dashboard — post a load or find trips, compare rates, and get matched in minutes.</p>',
    '<p style="margin:22px 0;">',
    `<a href="${CHOOSE_ROLE_URL}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">Choose my role</a>`,
    '</p>',
    '<p style="color:#5f6368;font-size:13px;">No truck or goods yet? That&rsquo;s fine — you can still take a look around the marketplace.</p>',
    '<hr style="border:none;border-top:1px solid #eee;margin:22px 0;" />',
    `<p style="color:#9aa0a6;font-size:12px;">You received this because you registered on ${SITE_URL}. If this wasn&rsquo;t you, you can ignore this email. Questions? Reply to ${REPLY_TO}</p>`,
    '</div></body></html>',
  ].filter(Boolean).join('\n');
}

async function send(recipient) {
  const body = {
    from: FROM,
    reply_to: REPLY_TO,
    to: [recipient.email],
    subject: 'Finish setting up your LoadSaathi account',
    html: buildHtml(recipient.name),
  };
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  const parsed = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(parsed && parsed.message) || 'send failed'}`);
  }
  return parsed.id || null;
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set — nothing was sent.');
    process.exitCode = 1;
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const recipient of RECIPIENTS) {
    try {
      const id = await send(recipient);
      ok += 1;
      console.log(`sent -> ${recipient.email} (${id})`);
    } catch (err) {
      failed += 1;
      console.error(`FAILED -> ${recipient.email}: ${err.message}`);
    }
  }
  console.log(`done. sent=${ok} failed=${failed}`);
}

main();
