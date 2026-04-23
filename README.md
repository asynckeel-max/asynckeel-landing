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

- The landing form posts to `PUBLIC_WAITLIST_API_URL` if configured.
- If `PUBLIC_WAITLIST_API_URL` is not set, it posts to the built-in Astro endpoint: `/api/waitlist`.
- `POST /api/waitlist` returns waitlist `position`, `earlyBird`, and `tag` (`earlybird-49` for first 100 signups).

Optional local persistence for development:

```bash
WAITLIST_STORAGE_FILE=.data/waitlist.json npm run dev
```

## Deploy

One-click deploy to Vercel or Netlify. Point to `asynckeel-max/asynckeel-landing` repo.

## Related
- [asynckeel](https://github.com/asynckeel-max/asynckeel) — The boilerplate itself
- [asynckeel-hub](https://github.com/asynckeel-max/asynckeel-hub) — Marketing & community hub
