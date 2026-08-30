# Marquee — Entertainment News Platform

Flagship Project #1. Full spec:
`C:\Projects\big-01-entertainment-news-platform.md`.

An editorial CMS with a publishing workflow behind it and a fast, SEO-strong
public site in front. Not a markdown blog — a multi-author newsroom tool.

## Stack

Next.js 16 (App Router) · React 19 · Prisma 6 + PostgreSQL (Neon) · Auth.js v5 ·
Tailwind v4. Redis + Cloudflare R2 come in later weeks.

## Status — Week 1

Done:
- Prisma schema: `User`(role), `Section`, `Tag`, `Article`(status), `Revision`,
  `Media`, `Comment`, `SavedArticle`, `NewsletterSubscriber`, Auth.js models
- Auth.js v5 with a Credentials provider, JWT sessions, `role` on the session
- Public routes rendering from the DB: home (hero + trending + latest per
  section), `/[section]`, `/article/[slug]` (with `NewsArticle` JSON-LD),
  `/author/[id]`
- Strict allow-list Tiptap JSON -> React renderer (`src/lib/render-tiptap.tsx`)
- Design tokens in `globals.css` (`@theme`): neutrals, one accent, per-section
  colors, workflow status colors, editorial type scale
- Seed: 4 staff users, 6 sections, 8 tags, 44 articles (mostly published)

Next (Week 2): Tiptap editor + article create/edit, workflow state transitions,
revision history, media upload to R2.

## Setup

```bash
npm install
# put your Neon connection string in .env  (DATABASE_URL)
npm run db:migrate      # create tables
npm run db:seed         # demo content
npm run dev             # http://localhost:3000
```

Seeded staff login: `ada@marquee.test` / `password123`

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Next dev server |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | load demo content |
| `npm run db:studio` | Prisma Studio (browse the DB) |
| `npm run build` | production build |
