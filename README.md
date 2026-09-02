# Coco Daily

A full-stack news platform: a fast, SEO-strong public site with an editorial CMS
behind it. Staff draft, review, schedule and publish stories; readers browse by
section, search, comment, save articles and subscribe to a briefing.

**Live:** https://cocodaily.vercel.app &nbsp;·&nbsp; **Newsroom:** `/studio`

> Portfolio project. Demo content is pulled from The Guardian's Open Platform and
> Ghanaian newsroom RSS feeds, shown as attributed excerpts that link back to the
> original — the platform is the work, not the copy.

---

## What it does

**Public site**
- Curated home page — lead story, trending rail, latest per section
- Sections (Ghana, Africa, World, Business, Tech, Sport, Culture), author pages,
  tag pages — all paginated
- Full-text search (PostgreSQL `tsvector` + GIN, relevance-ranked)
- Reader accounts: comment, save-for-later, newsletter subscribe / one-click
  unsubscribe
- RSS feed, `sitemap.xml`, `robots.txt`, `NewsArticle` JSON-LD, Open Graph,
  reading-time estimates

**Newsroom CMS** (`/studio`, role-gated)
- Tiptap rich-text editor; body stored as structured JSON, not HTML
- Workflow: `draft → in review → scheduled → published → archived`, enforced
  per role (writers touch only their own drafts; editors publish anything)
- Revision history with restore; scheduled publishing via cron
- Cover-image upload straight to Cloudinary (alt text required), delivered
  through `f_auto,q_auto` transform URLs
- Comment moderation queue with spam heuristics
- Analytics dashboard — views over 30 days, top articles, subscriber growth,
  comment breakdown (hand-rolled SVG charts, no chart library)

## Architecture highlights

| Concern | Approach |
|---|---|
| **Read-heavy traffic** | Article/section pages are ISR-cached; publishing fires `revalidatePath` so a change is live in seconds without a rebuild |
| **View counts** | Increment in Redis per request; a cron flushes them to Postgres in a batch — a viral article never writes to the DB on the hot path |
| **Auth on the edge** | Split Auth.js config — `auth.config.ts` (no adapter/bcrypt) runs in `proxy.ts`; the full config with the Prisma adapter runs only in Node |
| **Rich-text safety** | Tiptap JSON rendered through a fixed allow-list of node types — never `dangerouslySetInnerHTML` on pasted content |
| **Abuse** | Upstash sliding-window rate limits on register / comment / newsletter / upload |
| **Media** | Signed upload route → Cloudinary; only `public_id` + dimensions stored; responsive sizes are URL transforms |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 + PostgreSQL (Neon) ·
Redis (Upstash) · Auth.js v5 · Tailwind CSS v4 · Cloudinary · Tiptap ·
deployed on Vercel.

## Run it locally

```bash
git clone https://github.com/JerryCoco/coco-news
cd coco-news
npm install
cp .env.example .env        # fill in the values below
npm run db:migrate          # apply the schema
npm run db:seed             # demo content, or:
GUARDIAN_API_KEY=xxx npm run db:import-feeds   # real content from live feeds
npm run dev                 # http://localhost:3000
```

**Environment** (`.env`)

| Key | For |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Neon Postgres (pooled + direct) |
| `AUTH_SECRET` | Auth.js session signing |
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, RSS, OG |
| `CLOUDINARY_*` + `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | image storage |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | caching + rate limiting |
| `CRON_SECRET` | bearer token for the cron routes |
| `GUARDIAN_API_KEY` | optional — content import only |

Seeded staff login: `ada@coco.test` / `password123` (change before sharing).

## Scripts

| | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | synthetic demo content |
| `npm run db:import-feeds` | real content from Guardian + Ghana RSS |
| `npm run db:studio` | Prisma Studio |

## Deploy

See [`DEPLOY.md`](./DEPLOY.md) — Vercel + Neon + Upstash + Cloudinary, all free
tiers. Cron cadence note included (Vercel Hobby throttles cron to daily).
