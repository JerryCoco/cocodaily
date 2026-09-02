import { PrismaClient, type ArticleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SECTIONS = [
  { name: "Ghana", slug: "ghana", color: "#ce1126" },
  { name: "Africa", slug: "africa", color: "#d97706" },
  { name: "World", slug: "world", color: "#2563eb" },
  { name: "Business", slug: "business", color: "#059669" },
  { name: "Tech", slug: "tech", color: "#7c3aed" },
  { name: "Sport", slug: "sport", color: "#ea580c" },
  { name: "Culture", slug: "culture", color: "#db2777" },
];

const STAFF = [
  { name: "Ama Serwaa", email: "ada@coco.test", role: "EDITOR" as const, bio: "Editor-in-chief. Runs the desk." },
  { name: "Kojo Mensah", email: "tunde@coco.test", role: "WRITER" as const, bio: "Business and markets reporter." },
  { name: "Nana Adjei", email: "chika@coco.test", role: "WRITER" as const, bio: "Politics and Africa correspondent." },
  { name: "Sam Reyes", email: "sam@coco.test", role: "ADMIN" as const, bio: "Founder. Keeps the lights on." },
];

const TAGS = ["analysis", "explainer", "exclusive", "interview", "live", "opinion", "data", "profile"];

const HEADLINES = [
  "Cedi steadies as central bank signals a hold on rates",
  "Inside the port expansion set to reshape regional trade",
  "A quiet revolution in the country's mobile-money rails",
  "Parliament returns to a packed order paper and a thin majority",
  "The startup turning cocoa waste into a export business",
  "Drought pushes food prices to a two-year high",
  "How a small town became the country's solar test bed",
  "The diaspora bond that raised more than anyone expected",
  "A landmark ruling reshapes land disputes overnight",
  "Regional leaders meet as a border standoff drags on",
  "The league's breakout season, explained in five charts",
  "Why this year's budget leans hard on domestic revenue",
  "A new undersea cable promises faster, cheaper internet",
  "The health drive that cut malaria cases by a third",
  "Fintechs push into lending as banks pull back",
  "A generation of engineers is choosing to stay",
  "The heritage site caught between tourism and preservation",
  "Election officials trial a new voter-verification system",
  "The film that put the local industry on the festival map",
  "Farmers adopt drought-resistant seed as rains fail again",
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
