# AsyncKeel Landing Page

Marketing landing page for [AsyncKeel](https://github.com/asynckeel-max/asynckeel) — a production-ready FastAPI boilerplate for indie developers.

## Current Positioning
- Beta status: collecting early-bird waitlist signups
- Pricing: Indie only
- Early-bird: $49 one-time for first 100 signups (regular price $79 after beta)

## Tech Stack
- [Astro](https://astro.build) — Static site framework
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS

## Development

```bash
npm install
npm run dev
```

## Waitlist Backend

The landing form posts to `PUBLIC_WAITLIST_API_URL` if the env var is set, and falls back to the built-in Astro endpoint `/api/waitlist` for local development only.

### Production (Cloudflare Worker + D1)

**In production, you must set `PUBLIC_WAITLIST_API_URL`** to the deployed Cloudflare Worker URL. The built-in Astro endpoint uses in-memory storage and is not suitable for production.

See [`worker/README.md`](./worker/README.md) for full setup instructions, including:
- Creating the D1 database
- Applying the schema
- Deploying the Worker
- Configuring a custom domain (`api.asynckeel.com`)
- Setting `PUBLIC_WAITLIST_API_URL` in Vercel

### Local development

If `PUBLIC_WAITLIST_API_URL` is not set, forms post to `/api/waitlist` (Astro endpoint).

Optional local persistence:

```bash
WAITLIST_STORAGE_FILE=.data/waitlist.json npm run dev
```

## Deploy

One-click deploy to Vercel or Netlify. Point to `asynckeel-max/asynckeel-landing` repo.

## Related
- [asynckeel](https://github.com/asynckeel-max/asynckeel) — The boilerplate itself
- [asynckeel-hub](https://github.com/asynckeel-max/asynckeel-hub) — Marketing & community hub
