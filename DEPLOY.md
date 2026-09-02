# Deploying Coco News to Vercel

## 1. Import the repo

1. Push `main` to GitHub.
2. [vercel.com](https://vercel.com) → **Add New… → Project** → import
   `JerryCoco/coco-news`.
3. Framework preset: **Next.js** (auto-detected). Leave build/output settings
   default — `package.json`'s `build` script already runs
   `prisma generate && prisma migrate deploy && next build`.

## 2. Environment variables

Add every one of these in **Project → Settings → Environment Variables**
(Production + Preview). Values come from your local `.env`.

| Var | Notes |
|---|---|
| `DATABASE_URL` | Neon **pooled** string (`-pooler`, `?sslmode=require&pgbouncer=true`) |
| `DIRECT_URL` | Neon **unpooled** string — used by `prisma migrate deploy` |
| `AUTH_SECRET` | keep the same, or `npx auth secret` for a fresh one |
| `NEXT_PUBLIC_SITE_URL` | set to your Vercel URL after the first deploy, then redeploy |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | same as `CLOUDINARY_CLOUD_NAME` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | from Upstash → REST API |
| `CRON_SECRET` | generate a fresh random value (`openssl rand -hex 16`); Vercel Cron sends it as `Authorization: Bearer` |

## 3. Deploy, then fix the site URL

First deploy will succeed but `NEXT_PUBLIC_SITE_URL` is still `localhost`.
Copy the real URL Vercel gives you, set `NEXT_PUBLIC_SITE_URL` to it, and
**Redeploy**.

## 4. Cron jobs

`vercel.json` declares two crons:

- `/api/cron/publish` — flips scheduled articles live (`* * * * *`)
- `/api/cron/flush-views` — folds Redis view counts into Postgres (`*/5 * * * *`)

**Vercel Hobby (free) throttles crons to once per day.** For real cadence
either upgrade to Pro, or drive the endpoints from a free external scheduler
([cron-job.org](https://cron-job.org) or a GitHub Actions workflow) hitting:

```
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-APP/api/cron/publish
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-APP/api/cron/flush-views
```

## 5. Post-deploy checklist

- [ ] Home page loads, articles render
- [ ] `/studio` → sign in as `ada@coco.test` / `password123`
- [ ] Create + publish an article → appears on the front page
- [ ] Upload a cover image → lands in Cloudinary `coco/`
- [ ] Register a reader, post a comment → shows in `/studio/comments`
- [ ] Hit `/api/cron/flush-views` with the Bearer token → `{ flushed: … }`
- [ ] **Change the seeded passwords** (or delete the seed users) before sharing
      the URL publicly

## Databases already provisioned

- **Postgres:** Neon project `entertainment-news` (`us-east-2`)
- **Redis:** Upstash `coco` (`us-east-2`)
- **Images:** Cloudinary cloud `axlbympk`, folder `coco/`
