// Daily cron: trigger the fetch-diesel-price Supabase edge function, which
// reads the live diesel price source and upserts rows into `fuel_prices`.
// When the live source is unavailable the function re-upserts last-known
// rows — it does NOT apply any synthetic uplift (an earlier 0.5% step-up
// compounded on every run and was removed). Scheduled from vercel.json ("crons").
// Auth: when CRON_SECRET is set in project env, require the Bearer token
// Vercel sends with cron requests; otherwise the route stays open for manual runs.

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
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return json(res, 500, { error: 'Supabase URL / anon key not configured' });
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/fetch-diesel-price`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(45000),
    });
    const text = await upstream.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    if (!upstream.ok) {
      return json(res, 502, { error: 'fetch-diesel-price failed', upstreamStatus: upstream.status, body });
    }
    return json(res, 200, body);
  } catch (err) {
    return json(res, 502, {
      error: 'fetch-diesel-price request failed',
      message: String((err && err.message) || err),
    });
  }
}
