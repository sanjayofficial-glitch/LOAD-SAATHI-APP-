// Cron: trigger the load-match-alert Supabase edge function, which scans
// recently posted trips and shipments, finds route matches, and inserts
// notification rows. The push-notifier (database webhook on `notifications`
// INSERT) then delivers web push alerts to subscribed users.
//
// Scheduled from vercel.json ("crons"). Runs every 15 minutes during
// business hours (09:00–21:00 IST = 03:30–15:30 UTC).
// Auth: when CRON_SECRET is set, require the Bearer token Vercel sends.

export const config = { runtime: 'nodejs' };

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return json(res, 503, { error: 'CRON_SECRET not configured' });
  }
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${secret}`) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return json(res, 500, { error: 'Supabase URL / service role key not configured' });
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/load-match-alert`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(60000),
    });
    const text = await upstream.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    if (!upstream.ok) {
      return json(res, 502, { error: 'load-match-alert failed', upstreamStatus: upstream.status, body });
    }
    return json(res, 200, body);
  } catch (err) {
    return json(res, 502, {
      error: 'load-match-alert request failed',
      message: String((err && err.message) || err),
    });
  }
}
