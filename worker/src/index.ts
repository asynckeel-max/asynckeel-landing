// Each domain label is restricted to [^\s@.] so there is no ambiguity for the
// regex engine to exploit, avoiding polynomial backtracking (ReDoS).
const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const EARLY_BIRD_LIMIT = 100;
const EARLY_BIRD_TAG = 'earlybird-49';

// Simple in-memory rate-limit store (best-effort; resets on worker restart/isolation)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max requests per IP per window

interface Env {
  DB: D1Database;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return (
    origin === 'https://asynckeel.com' ||
    origin === 'https://www.asynckeel.com' ||
    origin.endsWith('.vercel.app')
  );
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : 'https://asynckeel.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: Record<string, unknown>, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin),
    },
  });
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const ip =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      'unknown';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // GET /health
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true }, 200, origin);
    }

    // POST /waitlist
    if (request.method === 'POST' && url.pathname === '/waitlist') {
      // Rate limit check
      if (isRateLimited(ip)) {
        return json({ ok: false, error: 'Too many requests. Please try again later.' }, 429, origin);
      }

      let payload: { email?: string; company?: string };
      try {
        payload = await request.json();
      } catch {
        return json({ ok: false, error: 'Invalid JSON payload' }, 400, origin);
      }

      // Honeypot: bots fill the `company` field; legitimate users leave it empty
      if (payload.company) {
        // Silently accept (do not reveal the honeypot to scrapers)
        return json({ ok: true, position: 1, earlyBird: true, tag: EARLY_BIRD_TAG }, 200, origin);
      }

      const normalizedEmail = payload.email?.trim().toLowerCase();
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        return json({ ok: false, error: 'Invalid email address' }, 400, origin);
      }

      // Insert or ignore duplicate, then fetch position
      await env.DB.prepare(
        'INSERT OR IGNORE INTO waitlist (email) VALUES (?)',
      )
        .bind(normalizedEmail)
        .run();

      const row = await env.DB.prepare(
        'SELECT id FROM waitlist WHERE email = ?',
      )
        .bind(normalizedEmail)
        .first<{ id: number }>();

      const position = row?.id ?? 1;
      const earlyBird = position <= EARLY_BIRD_LIMIT;

      return json(
        {
          ok: true,
          position,
          earlyBird,
          tag: earlyBird ? EARLY_BIRD_TAG : null,
        },
        200,
        origin,
      );
    }

    return json({ ok: false, error: 'Not found' }, 404, origin);
  },
};
