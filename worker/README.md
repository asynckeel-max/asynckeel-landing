# AsyncKeel Waitlist Worker

Cloudflare Worker + D1 backend for the AsyncKeel waitlist.

## Endpoints

| Method | Path       | Description                        |
|--------|------------|------------------------------------|
| POST   | /waitlist  | Sign up an email to the waitlist   |
| GET    | /health    | Health check — returns `{ ok: true }` |

### POST /waitlist

**Request body** (JSON):

```json
{ "email": "user@example.com" }
```

The client also sends `"company": ""` (honeypot). Bots that fill this field are silently accepted but not stored.

**Response** (JSON):

```json
{ "ok": true, "position": 42, "earlyBird": true, "tag": "earlybird-49" }
```

- `position` — signup order number
- `earlyBird` — `true` for the first 100 signups
- `tag` — `"earlybird-49"` if early-bird, else `null`

---

## One-time Setup

### 1. Install dependencies

```bash
cd worker
npm install
```

### 2. Log in to Cloudflare

```bash
npx wrangler login
```

### 3. Create the D1 database

```bash
npm run db:create
```

Copy the `database_id` from the output. It looks like:
`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 4. Update wrangler.toml

Open `worker/wrangler.toml` and replace the placeholder:

```toml
[[d1_databases]]
binding = "DB"
database_name = "asynckeel_waitlist"
database_id = "YOUR_DATABASE_ID_HERE"   # <-- replace this
```

### 5. Apply the schema

Local (for `wrangler dev`):

```bash
npm run db:migrate
```

Remote (production D1):

```bash
npm run db:migrate:remote
```

### 6. Test locally

```bash
npm run dev
```

Try it:

```bash
curl -X POST http://localhost:8787/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","company":""}'
```

### 7. Deploy

```bash
npm run deploy
```

Your worker will be live at:
`https://asynckeel-waitlist-worker.<your-subdomain>.workers.dev`

---

## Domain options

### Option A — workers.dev URL (default)

After deploy, note the URL printed by wrangler and set it as the Vercel env var:

```
PUBLIC_WAITLIST_API_URL=https://asynckeel-waitlist-worker.<your-subdomain>.workers.dev
```

### Option B — Custom domain `api.asynckeel.com` (recommended)

Since `asynckeel.com` is already on Cloudflare:

1. Go to **Cloudflare Dashboard → Workers & Pages → asynckeel-waitlist-worker → Settings → Domains & Routes**.
2. Click **Add** → **Custom Domain** → enter `api.asynckeel.com`.
3. Cloudflare automatically creates a DNS record and provisions a TLS certificate.

Then set in Vercel:

```
PUBLIC_WAITLIST_API_URL=https://api.asynckeel.com
```

---

## Set Vercel environment variable

In the Vercel dashboard for `asynckeel-landing`:

1. **Settings → Environment Variables**
2. Add `PUBLIC_WAITLIST_API_URL` = your worker URL (from Option A or B above)
3. Re-deploy (or trigger via CLI: `vercel --prod`)

---

## View signups

Using wrangler:

```bash
npx wrangler d1 execute asynckeel_waitlist --remote \
  --command "SELECT id, email, created_at FROM waitlist ORDER BY id ASC;"
```

Early-bird signups (first 100):

```bash
npx wrangler d1 execute asynckeel_waitlist --remote \
  --command "SELECT id, email, created_at FROM waitlist WHERE id <= 100 ORDER BY id ASC;"
```

Or use the **Cloudflare Dashboard → D1 → asynckeel_waitlist → Console**.

---

## Security notes

- **CORS** is restricted to `https://asynckeel.com`, `https://www.asynckeel.com`, and `*.vercel.app` (preview deploys).
- Emails are **never returned** in API responses.
- A **honeypot** field (`company`) silently discards bot submissions.
- Basic **IP rate-limiting** (5 requests / minute, in-memory, best-effort) guards against burst abuse.
- For stronger rate-limiting, enable [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/) on the `api.asynckeel.com` route.
