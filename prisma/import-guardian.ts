/**
 * Fill the site with real, current entertainment content from The Guardian's
 * Open Platform (free). Each article is stored as an excerpt + the opening of
 * the piece + a clear "read the full story at The Guardian" link — curation
 * style, with attribution, not a full republish.
 *
 * Usage:  GUARDIAN_API_KEY=yourkey npx tsx prisma/import-guardian.ts
 *         (falls back to the public "test" key, which is heavily rate-limited)
 *
 * Safe to re-run: clears articles/media/comments/views first, keeps sections,
 * tags, users, and newsletter subscribers.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();
const KEY = process.env.GUARDIAN_API_KEY || "test";
const BASE = "https://content.guardianapis.com/search";

// Guardian query -> Coco section slug
const SOURCES: { params: string; section: string; take: number }[] = [
  { params: "section=film", section: "movies", take: 9 },
  { params: "section=tv-and-radio", section: "tv", take: 9 },
  { params: "section=music", section: "music", take: 9 },
  { params: "section=culture&tag=lifeandstyle/celebrity", section: "celebrity", take: 7 },
  { params: "tag=tone/reviews&section=culture|film|music|tv-and-radio", section: "reviews", take: 8 },
  { params: "tag=culture/awards-and-prizes,film/oscars", section: "awards", take: 6 },
];

type GResult = {
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  fields?: {
    headline?: string;
    trailText?: string;
    bodyText?: string;
    thumbnail?: string;
    byline?: string;
  };
};

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "").trim();
const bigImage = (url?: string) =>
  url ? url.replace(/\/\d+\.jpg(\?.*)?$/i, "/1000.jpg") : null;

function toDoc(bodyText: string, sourceUrl: string) {
  const paras = bodyText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 6); // opening of the piece only

  const content: Prisma.InputJsonValue[] = paras.map((text) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  }));
  content.push({
    type: "paragraph",
    content: [
      { type: "text", text: "Read the complete article at " },
      {
        type: "text",
        marks: [{ type: "link", attrs: { href: sourceUrl } }],
        text: "The Guardian",
      },
      { type: "text", text: "." },
    ],
  });
  return { type: "doc", content } as Prisma.InputJsonValue;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchSource(params: string, take: number): Promise<GResult[]> {
  const url =
    `${BASE}?${params}&order-by=newest&page-size=${take}` +
    `&show-fields=headline,trailText,bodyText,thumbnail,byline&api-key=${KEY}`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const json = (await res.json()) as { response?: { results?: GResult[] } };
      return json.response?.results ?? [];
    }
    if (res.status === 429 && attempt < 4) {
      const wait = attempt * 5000;
      console.warn(`  ! ${params} -> 429, retrying in ${wait / 1000}s (attempt ${attempt})`);
      await sleep(wait);
      continue;
    }
    console.warn(`  ! ${params} -> HTTP ${res.status}, giving up`);
    return [];
  }
  return [];
}

async function upsertAuthor(byline?: string) {
  const name = (byline || "Coco Wire").replace(/^by\s+/i, "").split(/\s+in\s+/i)[0].trim();
  const email = `${slugify(name) || "wire"}@coco.contrib`;
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, role: "WRITER", bio: "Contributor." },
    select: { id: true },
  });
}

const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

async function main() {
  console.log(`Guardian import (key: ${KEY === "test" ? "test / rate-limited" : "provided"})`);

  const sections = await prisma.section.findMany({ select: { id: true, slug: true } });
  const sectionId = new Map(sections.map((s) => [s.slug, s.id]));

  // Fetch everything FIRST. Only touch the database if we actually got enough
  // usable results — never wipe existing content on a failed fetch.
  console.log("fetching from The Guardian…");
  const fetched: { src: (typeof SOURCES)[number]; results: GResult[] }[] = [];
  for (const src of SOURCES) {
    fetched.push({ src, results: await fetchSource(src.params, src.take + 4) });
    await sleep(1500); // be gentle on the shared "test" key's rate limit
  }
  const totalUsable = fetched.reduce(
    (n, f) => n + f.results.filter((r) => (r.fields?.bodyText?.length ?? 0) > 200).length,
    0,
  );
  if (totalUsable < 10) {
    console.error(
      `Only ${totalUsable} usable articles fetched (need >=10) — aborting without touching the database.`,
    );
    console.error("The Guardian's shared 'test' key is likely rate-limited. Try again in a few minutes,");
    console.error("or get a free key: https://open-platform.theguardian.com/access/ and re-run with");
    console.error("  GUARDIAN_API_KEY=yourkey npm run db:import-guardian");
    return;
  }

  console.log(`fetched ${totalUsable} usable articles — clearing existing content…`);
  await prisma.$transaction([
    prisma.viewDaily.deleteMany(),
    prisma.articleTag.deleteMany(),
    prisma.revision.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.savedArticle.deleteMany(),
    prisma.article.deleteMany(),
    prisma.media.deleteMany(),
  ]);

  let made = 0;
  const seenSlugs = new Set<string>();

  for (const { src, results } of fetched) {
    const secId = sectionId.get(src.section);
    if (!secId) continue;
    let added = 0;

    for (const r of results) {
      if (added >= src.take) break;
      const f = r.fields ?? {};
      const title = f.headline || r.webTitle;
      const body = (f.bodyText || "").trim();
      const thumb = bigImage(f.thumbnail);
      if (!title || body.length < 200 || !thumb) continue;

      let slug = slugify(title).slice(0, 70);
      if (!slug || seenSlugs.has(slug)) slug = `${slug}-${made}`;
      seenSlugs.add(slug);

      const author = await upsertAuthor(f.byline);
      const viewCount = 200 + Math.floor(Math.random() * 6000);

      const article = await prisma.article.create({
        data: {
          title,
          slug,
          excerpt: stripTags(f.trailText || body.slice(0, 200)).slice(0, 280),
          body: toDoc(body, r.webUrl),
          plainText: body,
          status: "PUBLISHED",
          publishedAt: new Date(r.webPublicationDate),
          viewCount,
          section: { connect: { id: secId } },
          author: { connect: { id: author.id } },
          coverMedia: { create: { originalUrl: thumb, alt: title } },
        },
      });

      // spread views across the last 30 days for the analytics chart
      let remaining = viewCount;
      for (let i = 29; i >= 0 && remaining > 0; i--) {
        const w = (30 - i) / 30;
        const take = Math.min(remaining, Math.round((viewCount / 18) * w * (0.4 + Math.random())));
        if (take <= 0) continue;
        remaining -= take;
        await prisma.viewDaily.create({
          data: { articleId: article.id, day: daysAgo(i), views: take },
        });
      }
      added++;
      made++;
    }
    console.log(`  ${src.section}: +${added}`);
  }

  console.log(`\ndone — ${made} articles imported from The Guardian.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
