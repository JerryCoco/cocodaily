# Coco — Entertainment News Platform

Flagship Project #1. Full spec:
`C:\Projects\big-01-entertainment-news-platform.md`.

An editorial CMS with a publishing workflow behind it and a fast, SEO-strong
public site in front. Not a markdown blog — a multi-author newsroom tool.

## Stack

Next.js 16 (App Router) · React 19 · Prisma 6 + PostgreSQL (Neon) · Redis
(Upstash) · Auth.js v5 · Tailwind v4 · Cloudinary (images).

## Status

**All 6 build weeks done.** Only the Vercel deploy remains — see `DEPLOY.md`.

**Data & auth** — Prisma schema (User+role, Section, Tag, Article+status,
Revision, Media, Comment, SavedArticle, NewsletterSubscriber, Auth.js models) on
Neon. Auth.js v5 split config (`auth.config.ts` edge-safe + `auth.ts`),
Credentials + JWT, `role` on the session. `proxy.ts` gates `/studio`.

**Public site** — home (hero + trending + per-section rails), `/[section]`,
`/article/[slug]` (`NewsArticle` JSON-LD, OG, reading time), `/author/[id]`,
`/tag/[slug]`, all paginated. `/search` — Postgres full-text search (generated
`searchVector` tsvector + GIN index, weighted title/excerpt/body,
`ts_rank`-ordered). `/feed.xml` RSS, `sitemap.xml`, `robots.txt`. Strict
allow-list Tiptap JSON → React renderer.

**Newsroom CMS** (`/studio`) — article list with status filters, Tiptap editor,
create/edit with server actions (zod, unique slug, tag upsert), workflow state
machine (`draft → in review → scheduled → published → archived`) with per-role
rules, revision history + restore, on-demand `revalidatePath` on
publish/edit. **Cover-image upload** — auth-gated `/api/media/upload` streams to
Cloudinary (folder `coco/`), alt text required; `cldUrl()` builds
`f_auto,q_auto,w_*` transform URLs for cards and heroes; paste-a-URL still works
as a fallback. `/api/cron/publish` flips due scheduled articles (Vercel Cron in
`vercel.json`). **Analytics** (`/studio/analytics`, editor-only) — views over 30
days (from a `ViewDaily` rollup the flush cron writes), top articles, subscriber
growth, comment breakdown, most-saved; hand-rolled SVG charts, no chart lib.

**Caching / Redis (Upstash)** — article views count in Redis (`<ViewPing>` →
`/api/articles/[id]/view`), `/api/cron/flush-views` folds them into Postgres
every 5 min so views never hit the DB on the hot path. `getHomeData()` has a 60s
Redis read-through cache. Sliding-window rate limits on comments / newsletter /
register / uploads. All Redis calls no-op without the Upstash env vars.

**Readers** — `/register` + `/login` (Auth.js Credentials, role `READER`).
Newsletter subscribe (footer) + one-click `/newsletter/unsubscribe`.
Save-for-later (`☆`/`★` on articles → `/account/saved`). Comments: signed-in
readers post, `src/lib/spam.ts` heuristics + a trust rule route new comments to a
moderation queue (`/studio/comments`, editor-only) with approve / reject / spam /
delete. The article page stays ISR — reader-specific bits load client-side from
`/api/reader/context`.

**Design** — tokens in `globals.css` `@theme` (neutrals, one accent, per-section
colors, CMS status colors, editorial type scale) + **Fraunces** display serif on
headlines.

Seed: 4 staff, 6 sections, 8 tags, 44 articles (~37 published). Staff login:
`ada@coco.test` / `password123`.

**Next:** deploy to Vercel (`DEPLOY.md`), then swap the seeded passwords.

## Setup

```bash
npm install
# put your Neon connection string in .env  (DATABASE_URL)
npm run db:migrate      # create tables
npm run db:seed         # demo content
npm run dev             # http://localhost:3000
```

Seeded staff login: `ada@coco.test` / `password123` (`/studio` for the CMS)

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Next dev server |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | load demo content |
| `npm run db:studio` | Prisma Studio (browse the DB) |
| `npm run build` | production build |
