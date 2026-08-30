import { PrismaClient, type ArticleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SECTIONS = [
  { name: "Movies", slug: "movies", color: "#7c3aed" },
  { name: "TV", slug: "tv", color: "#2563eb" },
  { name: "Music", slug: "music", color: "#db2777" },
  { name: "Celebrity", slug: "celebrity", color: "#d97706" },
  { name: "Reviews", slug: "reviews", color: "#059669" },
  { name: "Awards", slug: "awards", color: "#b45309" },
];

const STAFF = [
  { name: "Ada Obi", email: "ada@coco.test", role: "EDITOR" as const, bio: "Editor-in-chief. Covers film and awards season." },
  { name: "Tunde Bello", email: "tunde@coco.test", role: "WRITER" as const, bio: "Staff writer on music and nightlife." },
  { name: "Chika Nwosu", email: "chika@coco.test", role: "WRITER" as const, bio: "TV and streaming reporter." },
  { name: "Sam Reyes", email: "sam@coco.test", role: "ADMIN" as const, bio: "Founder. Keeps the lights on." },
];

const TAGS = ["interview", "box-office", "trailer", "review", "red-carpet", "streaming", "exclusive", "ranked"];

const HEADLINES = [
  "The sequel nobody asked for is quietly the best film of the year",
  "Inside the writers' room of this season's breakout drama",
  "A pop star reinvents herself, again — and it works",
  "Five minutes with the director everyone is talking about",
  "The streaming wars have a new front, and it's animation",
  "Why this low-budget horror is outgrossing the blockbusters",
  "An awards campaign that started a year too early",
  "The soundtrack is the real star of this one",
  "A reunion tour, a legal fight, and one very expensive guitar",
  "This documentary will change how you see the franchise",
  "The comedy special that split the internet in half",
  "How a canceled show found a second life abroad",
  "The biopic gets the music right and the timeline wrong",
  "A festival breakout lands the biggest deal of the year",
  "The finale everyone predicted, executed better than anyone expected",
  "Casting news that quietly rewrites the whole sequel",
  "The director's cut is three hours longer and somehow tighter",
  "A veteran actor's quietest performance is their loudest statement",
  "The album leaked, the tour sold out anyway",
  "Behind the year's most divisive needle drop",
];

const para = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });

const body = (title: string) => ({
  type: "doc",
  content: [
    para(`${title.split(" ").slice(0, 6).join(" ")} — and the reaction has been immediate.`),
    para("Reporting this week points to a shift that has been building for months. Sources close to the production, who were not authorized to speak publicly, describe a project that changed shape repeatedly before landing on the version audiences are now seeing."),
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "What actually happened" }] },
    para("The short version: expectations were low, the budget was lower, and the result has outperformed nearly every comparable release in its window. Industry watchers are already revising their forecasts for the rest of the quarter."),
    { type: "blockquote", content: [para("\"We knew we had something. We didn't know we had this.\"")] },
    para("Whether the momentum holds is another question. The next few weeks will tell us if this is a genuine turning point or a well-timed anomaly."),
  ],
});

function flatten(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: string; content?: unknown[] };
  let out = n.text ?? "";
  if (Array.isArray(n.content)) out += " " + n.content.map(flatten).join(" ");
  return out;
}
const plainOf = (title: string) => flatten(body(title)).replace(/\s+/g, " ").trim();

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

async function main() {
  console.log("clearing…");
  await prisma.$transaction([
    prisma.articleTag.deleteMany(),
    prisma.revision.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.savedArticle.deleteMany(),
    prisma.article.deleteMany(),
    prisma.media.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.section.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);
  const users = await Promise.all(
    STAFF.map((u) => prisma.user.create({ data: { ...u, passwordHash } })),
  );
  const sections = await Promise.all(
    SECTIONS.map((s) => prisma.section.create({ data: s })),
  );
  const tags = await Promise.all(
    TAGS.map((name) => prisma.tag.create({ data: { name, slug: slugify(name) } })),
  );

  const writers = users.filter((u) => u.role === "WRITER" || u.role === "EDITOR");

  let n = 0;
  for (let i = 0; i < 44; i++) {
    const title = `${pick(HEADLINES)}${i > HEADLINES.length ? ` (${i})` : ""}`;
    const slug = `${slugify(title)}-${i}`;
    const section = pick(sections);
    const author = pick(writers);

    // Mostly published, a few in other states.
    let status: ArticleStatus = "PUBLISHED";
    let publishedAt: Date | null = daysAgo(Math.floor(Math.random() ** 2 * 30));
    let scheduledFor: Date | null = null;
    const r = Math.random();
    if (r > 0.9) { status = "DRAFT"; publishedAt = null; }
    else if (r > 0.85) { status = "IN_REVIEW"; publishedAt = null; }
    else if (r > 0.8) { status = "SCHEDULED"; publishedAt = null; scheduledFor = daysAgo(-2); }

    await prisma.article.create({
      data: {
        title,
        slug,
        excerpt: "A closer look at the week's biggest entertainment story and what it means next.",
        body: body(title),
        plainText: plainOf(title),
        status,
        publishedAt,
        scheduledFor,
        viewCount: Math.floor(Math.random() * 5000),
        section: { connect: { id: section.id } },
        author: { connect: { id: author.id } },
        coverMedia: {
          create: {
            originalUrl: `https://picsum.photos/seed/coco${i}/1200/675`,
            alt: title,
            width: 1200,
            height: 675,
          },
        },
        tags: {
          create: [...new Set([pick(tags).id, pick(tags).id])].map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
    });
    if (status === "PUBLISHED") n++;
  }

  console.log(`seeded ${users.length} users, ${sections.length} sections, 44 articles (${n} published)`);
  console.log("staff login: ada@coco.test / password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
