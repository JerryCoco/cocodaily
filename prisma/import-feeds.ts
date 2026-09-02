/**
 * Populate Coco News with real, current content:
 *   • The Guardian Open Platform (World, Africa, Business, Tech, Sport, Culture)
 *   • Ghanaian newsroom RSS feeds (Ghana)
 *
 * Each article is stored as an excerpt + the opening of the piece + a clear
 * "read the full story at <source>" link. Curation style, with attribution.
 *
 * Usage:  GUARDIAN_API_KEY=yourkey npx tsx prisma/import-feeds.ts
 *
 * Resilient: fetches everything first and aborts (touching nothing) if the
 * fetch came back near-empty; batches the per-article view-history rows into
 * one insert; skips (doesn't abort) on a transient write error.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import Parser from "rss-parser";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();
const KEY = process.env.GUARDIAN_API_KEY || "test";

// ---- section catalogue (this script owns it) ----------------------------
const SECTIONS = [
  { slug: "ghana", name: "Ghana", color: "#ce1126" },
  { slug: "africa", name: "Africa", color: "#d97706" },
  { slug: "world", name: "World", color: "#2563eb" },
  { slug: "business", name: "Business", color: "#059669" },
  { slug: "tech", name: "Tech", color: "#7c3aed" },
  { slug: "sport", name: "Sport", color: "#ea580c" },
  { slug: "culture", name: "Culture", color: "#db2777" },
];

const GUARDIAN: { params: string; section: string; take: number }[] = [
  // world
  { params: "section=world", section: "world", take: 40 },
  { params: "section=us-news", section: "world", take: 10 },
  { params: "section=environment", section: "world", take: 10 },
  // africa  (+ Guardian's own Ghana coverage feeds the Ghana section)
  { params: "tag=world/africa", section: "africa", take: 40 },
  { params: "tag=world/nigeria", section: "africa", take: 10 },
  { params: "tag=world/kenya", section: "africa", take: 8 },
  { params: "tag=world/ghana", section: "ghana", take: 20 },
  // business
  { params: "section=business", section: "business", take: 35 },
  { params: "section=money", section: "business", take: 10 },
  // tech
  { params: "section=technology", section: "tech", take: 35 },
  { params: "section=games", section: "tech", take: 8 },
  // sport
  { params: "section=sport", section: "sport", take: 30 },
  { params: "section=football", section: "sport", take: 15 },
  // culture
  { params: "section=culture", section: "culture", take: 20 },
  { params: "section=film", section: "culture", take: 12 },
  { params: "section=music", section: "culture", take: 10 },
  { params: "section=books", section: "culture", take: 8 },
  { params: "section=tv-and-radio", section: "culture", take: 8 },
];

// Ghanaian newsrooms with a working RSS feed (verified 2026-09). rss-parser
// follows the http->https redirects some of these use.
const GHANA_FEEDS = [
  "https://www.myjoyonline.com/feed/",
  "https://www.myjoyonline.com/business/feed/",
  "https://www.myjoyonline.com/sports/feed/",
  "https://3news.com/feed/",
  "https://www.adomonline.com/feed/",
  "https://www.graphic.com.gh/news?format=feed&type=rss",
  "https://gbcghanaonline.com/feed/",
  "https://starrfm.com.gh/feed/",
  "https://www.ghanabusinessnews.com/feed/",
  "https://norvanreports.com/feed/",
];

// ---- helpers ----------------------------------------------------------------
const stripTags = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const bigImage = (u?: string) => (u ? u.replace(/\/\d+\.jpg(\?.*)?$/i, "/1000.jpg") : null);
const firstImg = (html?: string) => html?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Draft = {
  title: string;
  excerpt: string;
  paras: string[];
  image: string | null;
  sourceName: string;
  sourceUrl: string;
  byline: string;
  publishedAt: Date;
  section: string;
};

function toDoc(paras: string[], sourceName: string, sourceUrl: string): Prisma.InputJsonValue {
  const content: Prisma.InputJsonValue[] = paras
    .slice(0, 6)
    .map((text) => ({ type: "paragraph", content: [{ type: "text", text }] }));
  content.push({
    type: "paragraph",
    content: [
      { type: "text", text: "Read the full story at " },
      { type: "text", marks: [{ type: "link", attrs: { href: sourceUrl } }], text: sourceName },
      { type: "text", text: "." },
    ],
  });
  return { type: "doc", content };
}

// ---- fetch: Guardian -------------------------------------------------------
type GResult = {
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  fields?: { headline?: string; trailText?: string; bodyText?: string; thumbnail?: string; byline?: string };
};

async function guardian(params: string, section: string, take: number): Promise<Draft[]> {
  const url =
    `https://content.guardianapis.com/search?${params}&order-by=newest&page-size=${Math.min(take + 5, 50)}` +
    `&show-fields=headline,trailText,bodyText,thumbnail,byline&api-key=${KEY}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const json = (await res.json()) as { response?: { results?: GResult[] } };
      const out: Draft[] = [];
      for (const r of json.response?.results ?? []) {
        const f = r.fields ?? {};
        const body = (f.bodyText || "").trim();
        if (body.length < 200) continue;
        out.push({
          title: f.headline || r.webTitle,
          excerpt: stripTags(f.trailText || body).slice(0, 280),
          paras: body.split(/\n+/).map((p) => p.trim()).filter(Boolean),
          image: bigImage(f.thumbnail),
          sourceName: "The Guardian",
          sourceUrl: r.webUrl,
          byline: (f.byline || "Guardian staff").replace(/^by\s+/i, "").split(/\s+in\s+/i)[0].trim(),
          publishedAt: new Date(r.webPublicationDate),
          section,
        });
        if (out.length >= take) break;
      }
      return out;
    }
    if (res.status === 429 && attempt < 4) {
      console.warn(`  ! guardian ${params} 429 — retry in ${attempt * 5}s`);
      await sleep(attempt * 5000);
      continue;
    }
    console.warn(`  ! guardian ${params} -> HTTP ${res.status}`);
    return [];
  }
  return [];
}

// ---- fetch: Ghana RSS ----------------------------------------------------
const rss = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "CocoNewsBot/1.0 (+https://coco-news.vercel.app)" },
  customFields: { item: [["content:encoded", "contentEncoded"], ["media:content", "mediaContent", { keepArray: true }]] },
});

async function ghanaFeeds(perFeed = 14): Promise<Draft[]> {
  const out: Draft[] = [];
  for (const feedUrl of GHANA_FEEDS) {
    try {
      const feed = await rss.parseURL(feedUrl);
      const sourceName = feed.title?.replace(/\s*[-|].*$/, "").trim() || new URL(feedUrl).hostname;
      let n = 0;
      for (const item of feed.items ?? []) {
        if (n >= perFeed) break;
        const html = (item as { contentEncoded?: string }).contentEncoded || item.content || "";
        const text = stripTags(html || item.contentSnippet || "");
        if (!item.title || !item.link || text.length < 120) continue;
        const media = (item as { mediaContent?: { $?: { url?: string } }[] }).mediaContent?.[0]?.$?.url;
        out.push({
          title: item.title.trim(),
          excerpt: (item.contentSnippet || text).slice(0, 280),
          paras: text.split(/(?<=\.)\s+(?=[A-Z])/).map((p) => p.trim()).filter((p) => p.length > 30),
          image:
            item.enclosure?.url ||
            media ||
            firstImg(html) ||
            `https://picsum.photos/seed/${slugify(item.title).slice(0, 30)}/1200/675`,
          sourceName,
          sourceUrl: item.link,
          byline: item.creator || (item as { author?: string }).author || sourceName,
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
          section: "ghana",
        });
        n++;
      }
      console.log(`  rss ${sourceName}: ${n}`);
    } catch (e) {
      console.warn(`  ! rss ${feedUrl} -> ${(e as Error).message.slice(0, 80)}`);
    }
  }
  return out;
}

// ---- authors ------------------------------------------------------------
const authorCache = new Map<string, string>();
async function authorId(name: string) {
  const clean = (name || "Coco Wire").slice(0, 80);
  const email = `${slugify(clean) || "wire"}@coco.contrib`;
  const hit = authorCache.get(email);
  if (hit) return hit;
  const u = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: clean, email, role: "WRITER", bio: "Contributor." },
    select: { id: true },
  });
  authorCache.set(email, u.id);
  return u.id;
}

const midnightDaysAgo = (n: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

// ---- main -------------------------------------------------------------------
async function main() {
  console.log(`Coco News import — Guardian key: ${KEY === "test" ? "test (rate-limited)" : "provided"}`);

  console.log("fetching…");
  const drafts: Draft[] = [];
  for (const g of GUARDIAN) {
    drafts.push(...(await guardian(g.params, g.section, g.take)));
    await sleep(1200);
  }
  drafts.push(...(await ghanaFeeds()));

  // de-dupe: feeds overlap (e.g. a MyJoy story in both the main and sports feed)
  const byUrl = new Map<string, Draft>();
  for (const d of drafts) {
    const key = d.sourceUrl || `${d.section}:${d.title}`;
    if (!byUrl.has(key)) byUrl.set(key, d);
  }
  const unique = [...byUrl.values()];

  if (unique.length < 15) {
    console.error(`Only ${unique.length} articles fetched (need >=15) — aborting, database untouched.`);
    return;
  }
  console.log(`fetched ${drafts.length} (${unique.length} unique) — rebuilding…`);

  // sections
  for (const s of SECTIONS) {
    await prisma.section.upsert({ where: { slug: s.slug }, update: { name: s.name, color: s.color }, create: s });
  }

  // clear content, then drop any section no longer in the catalogue
  await prisma.$transaction([
    prisma.viewDaily.deleteMany(),
    prisma.articleTag.deleteMany(),
    prisma.revision.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.savedArticle.deleteMany(),
    prisma.article.deleteMany(),
    prisma.media.deleteMany(),
  ]);
  await prisma.section.deleteMany({ where: { slug: { notIn: SECTIONS.map((s) => s.slug) } } });

  const sec = new Map(
    (await prisma.section.findMany({ select: { id: true, slug: true } })).map((s) => [s.slug, s.id]),
  );
  const seen = new Set<string>();
  let made = 0;

  for (const d of unique) {
    const sectionId = sec.get(d.section);
    if (!sectionId || d.paras.length === 0) continue;
    let slug = slugify(d.title).slice(0, 72);
    if (!slug || seen.has(slug)) slug = `${slug}-${made}`;
    seen.add(slug);

    try {
      const author = await authorId(d.byline);
      const plain = d.paras.join(" ");
      const viewCount = 150 + Math.floor(Math.random() * 5500);

      const article = await prisma.article.create({
        data: {
          title: d.title,
          slug,
          excerpt: d.excerpt || plain.slice(0, 200),
          body: toDoc(d.paras, d.sourceName, d.sourceUrl),
          plainText: plain,
          status: "PUBLISHED",
          publishedAt: d.publishedAt,
          viewCount,
          section: { connect: { id: sectionId } },
          author: { connect: { id: author } },
          coverMedia: d.image ? { create: { originalUrl: d.image, alt: d.title } } : undefined,
        },
        select: { id: true },
      });

      // 30-day view history in ONE insert
      const rows: { articleId: string; day: Date; views: number }[] = [];
      let remaining = viewCount;
      for (let i = 29; i >= 0 && remaining > 0; i--) {
        const w = (30 - i) / 30;
        const take = Math.min(remaining, Math.round((viewCount / 16) * w * (0.4 + Math.random())));
        if (take <= 0) continue;
        remaining -= take;
        rows.push({ articleId: article.id, day: midnightDaysAgo(i), views: take });
      }
      if (rows.length) await prisma.viewDaily.createMany({ data: rows });
      made++;
    } catch (e) {
      console.warn(`  ! skipped "${d.title.slice(0, 50)}" -> ${(e as Error).message.slice(0, 90)}`);
    }
  }

  const counts = await prisma.article.groupBy({ by: ["sectionId"], _count: true });
  const nameOf = new Map(
    (await prisma.section.findMany({ select: { id: true, name: true } })).map((s) => [s.id, s.name]),
  );
  console.log(`\ndone — ${made} articles:`);
  counts.forEach((c) => console.log(`  ${nameOf.get(c.sectionId)}: ${c._count}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
