import Parser from "rss-parser";
import { PrismaClient, Prisma } from "@prisma/client";
import { prisma as sharedPrisma } from "./prisma";
import { slugify } from "./slug";

/**
 * Incremental feed sync: pull the latest items from The Guardian + Ghanaian
 * newsrooms and INSERT only the ones we don't already have (matched on
 * Article.sourceUrl). Never deletes. Safe to run on a schedule.
 *
 * The full wipe-and-rebuild lives in prisma/import-feeds.ts and owns the
 * section catalogue; this only appends.
 */

const KEY = process.env.GUARDIAN_API_KEY || "test";

const GUARDIAN: { params: string; section: string; take: number }[] = [
  { params: "section=world", section: "world", take: 12 },
  { params: "tag=world/africa", section: "africa", take: 12 },
  { params: "tag=world/ghana", section: "ghana", take: 8 },
  { params: "section=business", section: "business", take: 10 },
  { params: "section=technology", section: "tech", take: 10 },
  { params: "section=sport", section: "sport", take: 10 },
  { params: "section=culture", section: "culture", take: 8 },
];

const GHANA_FEEDS = [
  "https://www.myjoyonline.com/feed/",
  "https://www.myjoyonline.com/business/feed/",
  "https://www.myjoyonline.com/sports/feed/",
  "https://3news.com/feed/",
  "https://www.adomonline.com/feed/",
  "https://www.graphic.com.gh/news?format=feed&type=rss",
  "https://gbcghanaonline.com/feed/",
  "https://starrfm.com.gh/feed/",
];

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
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
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
  } catch {
    return [];
  }
}

const rss = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "CocoNewsBot/1.0 (+https://cocodaily.vercel.app)" },
  customFields: {
    item: [["content:encoded", "contentEncoded"], ["media:content", "mediaContent", { keepArray: true }]],
  },
});

async function ghanaFeeds(perFeed = 8): Promise<Draft[]> {
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
    } catch {
      // one dead feed shouldn't stop the sync
    }
  }
  return out;
}

export async function syncFeeds(client?: PrismaClient): Promise<{ added: number; scanned: number }> {
  const db = client ?? sharedPrisma;

  const drafts: Draft[] = [];
  for (const g of GUARDIAN) {
    drafts.push(...(await guardian(g.params, g.section, g.take)));
    await sleep(400); // Guardian dev tier allows 12 req/s; keep well under
  }
  drafts.push(...(await ghanaFeeds()));

  // de-dupe this batch by URL
  const batch = new Map<string, Draft>();
  for (const d of drafts) if (d.sourceUrl && !batch.has(d.sourceUrl)) batch.set(d.sourceUrl, d);
  const scanned = batch.size;
  if (scanned === 0) return { added: 0, scanned: 0 };

  const known = new Set(
    (
      await db.article.findMany({
        where: { sourceUrl: { in: [...batch.keys()] } },
        select: { sourceUrl: true },
      })
    ).map((a) => a.sourceUrl),
  );

  const sections = new Map(
    (await db.section.findMany({ select: { id: true, slug: true } })).map((s) => [s.slug, s.id]),
  );
  const authorCache = new Map<string, string>();
  async function authorId(name: string) {
    const clean = (name || "Coco Wire").slice(0, 80);
    const email = `${slugify(clean) || "wire"}@coco.contrib`;
    const hit = authorCache.get(email);
    if (hit) return hit;
    const u = await db.user.upsert({
      where: { email },
      update: {},
      create: { name: clean, email, role: "WRITER", bio: "Contributor." },
      select: { id: true },
    });
    authorCache.set(email, u.id);
    return u.id;
  }

  let added = 0;
  const seenSlugs = new Set<string>();
  for (const d of batch.values()) {
    if (known.has(d.sourceUrl)) continue;
    const sectionId = sections.get(d.section);
    if (!sectionId || d.paras.length === 0) continue;

    let slug = slugify(d.title).slice(0, 72);
    if (!slug || seenSlugs.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;
    seenSlugs.add(slug);

    try {
      // extra guard against a slug that already exists from a past import
      const clash = await db.article.findUnique({ where: { slug }, select: { id: true } });
      if (clash) slug = `${slug}-${Date.now().toString(36)}`;

      const plain = d.paras.join(" ");
      await db.article.create({
        data: {
          title: d.title,
          slug,
          excerpt: d.excerpt || plain.slice(0, 200),
          body: toDoc(d.paras, d.sourceName, d.sourceUrl),
          plainText: plain,
          status: "PUBLISHED",
          publishedAt: d.publishedAt,
          viewCount: 20 + Math.floor(Math.random() * 300),
          sourceUrl: d.sourceUrl,
          section: { connect: { id: sectionId } },
          author: { connect: { id: await authorId(d.byline) } },
          coverMedia: d.image ? { create: { originalUrl: d.image, alt: d.title } } : undefined,
        },
      });
      added++;
    } catch {
      // skip a bad row, keep going
    }
  }

  return { added, scanned };
}
