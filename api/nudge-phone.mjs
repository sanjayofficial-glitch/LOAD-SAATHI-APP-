/**
 * Safe phone-number completion nudge for onboarded users with no saved phone.
 *
 * Safe by design:
 *  - NO database writes, NO deletions, NO app changes.
 *  - Sends only when run with RESEND_API_KEY set.
 *  - Per-recipient try/catch — one failure never blocks the others.
 *  - Set NUDGE_PHONE_LIMIT to cap how many go out in one run (e.g. 10).
 *
 * Usage:
 *   $env:RESEND_API_KEY="re_..." ; node api/nudge-phone.mjs
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const BRAND = 'LoadSaathi';
const FROM = 'LoadSaathi <quotes@mail.loadsaathi.in>';
const REPLY_TO = 'support@loadsaathi.in';
const SITE_URL = 'https://loadsaathi.in';
const PROFILE_URL = `${SITE_URL}/profile`;

/** Onboarded users who have no phone number saved (excludes admins). */
const RECIPIENTS = [
  { email: 'sriharimugri87@gmail.com', name: 'SRIHARI MUGRI' },
  { email: 'mrarya725@gmail.com', name: 'MR ARYA' },
  { email: 'shankarrocks.patra@gmail.com', name: 'Shankar Fruits' },
  { email: 'suvamsahoo11@gmail.com', name: 'Suvam Sahoo' },
  { email: 'dinkargoel1985@gmail.com', name: 'DINKAR GOEL' },
  { email: 'acc.vedlogistics@gmail.com', name: 'Santidhya Mangal' },
  { email: 'behera.dhaneswar007@gmail.com', name: 'Abhijit Behera' },
  { email: 'brundabannag726@gmail.com', name: 'Brundaban Nag' },
  { email: 'sahuuchhab791@gmail.com', name: 'Sanjukta Sahoo' },
  { email: 'anand870aa@gmail.com', name: 'Anand' },
  { email: 'archanau983@gmail.com', name: 'Archana' },
  { email: 'darshanp82@gmail.com', name: 'Darshan Parekh' },
  { email: 'rohantayal2244@gmail.com', name: 'Rohan Tayal' },
  { email: 'nuraliwadhwaniya13@gmail.com', name: 'Nurali Wadhwaniya' },
  { email: 'noman7ashraf@gmail.com', name: 'Noman Ashraf' },
  { email: 'eswaramuthu423@gmail.com', name: 'Muthu Mani' },
  { email: 'cmsteelsrkl@gmail.com', name: 'Chetan Agarwal' },
  { email: 'kowshikthota43@gmail.com', name: 'Kowshik Thota' },
  { email: 'ajanakiram8@gmail.com', name: 'A Janakiram' },
  { email: 'bargelatarun02@gmail.com', name: 'Bargela Tarun' },
  { email: 'makhnalal3@gmail.com', name: 'Makhna Lal' },
  { email: 'naren123123123123@gmail.com', name: 'Naren' },
  { email: 'liju280@gmail.com', name: 'Alwin Liju' },
  { email: 'sales@cmcoldchain.com', name: 'CHFMART Logistics' },
  { email: 'rahulranchisinha@gmail.com', name: 'Rahul Sinha' },
  { email: 'daga.shrenik@gmail.com', name: 'Shrenik Daga' },
  { email: 'bbuvhancheerla19@gmail.com', name: 'Bhuvan Cheerla' },
  { email: 'makkarharshit502@gmail.com', name: 'Harshit Makkar' },
  { email: 'ravyafashionrkl@gmail.com', name: 'Sanjaya Sahu' },
  { email: 'raiirfan7898@gmail.com', name: 'Irfan Rai' },
  { email: 'sauravprasaad@gmail.com', name: 'Saurav Swain' },
  { email: 'daaku088@gmail.com', name: 'Dinesh' },
  { email: 'asifkhan20122003@gmail.com', name: 'ASIF KHAN' },
  { email: 'sobhitsriwas@gmail.com', name: 'Sobhit Sriwas' },
  { email: 'srtransportsudt@gmail.com', name: 'srtransports' },
  { email: 'aashish22092001@gmail.com', name: 'Aashish Sridhar' },
  { email: 'mayurkalal2580@gmail.com', name: 'Mayur Kalal' },
  { email: 'mrsuresh3868@gmail.com', name: 'Suresh Lamani' },
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
    '<p>You&rsquo;re set up on LoadSaathi, but your profile is missing a <strong>phone number</strong>.</p>',
    '<p>Adding it takes 30 seconds and means truckers/shippers can reach you directly about a load or trip — profiles with a phone get contacted far more often.</p>',
    '<p style="margin:22px 0;">',
    `<a href="${PROFILE_URL}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">Add my phone number</a>`,
    '</p>',
    '<p style="color:#5f6368;font-size:13px;">Not comfortable sharing a number? You can ignore this email — your account keeps working either way.</p>',
    '<hr style="border:none;border-top:1px solid #eee;margin:22px 0;" />',
    `<p style="color:#9aa0a6;font-size:12px;">You received this because you have a LoadSaathi account. Questions? Reply to ${REPLY_TO}</p>`,
    '</div></body></html>',
  ].filter(Boolean).join('\n');
}

async function send(recipient) {
  const body = {
    from: FROM,
    reply_to: REPLY_TO,
    to: [recipient.email],
    subject: 'Complete your LoadSaathi profile — add your phone number',
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

  const limit = Number(process.env.NUDGE_PHONE_LIMIT);
  const batch = Number.isFinite(limit) && limit > 0 ? RECIPIENTS.slice(0, limit) : RECIPIENTS;
  console.log(`sending to ${batch.length} of ${RECIPIENTS.length} recipients`);

  let ok = 0;
  let failed = 0;
  for (const recipient of batch) {
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
