import { prisma } from "@/lib/prisma";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function escape(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      section: { select: { name: true } },
      author: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });

  const items = articles
    .map(
      (a) => `    <item>
      <title>${escape(a.title)}</title>
      <link>${SITE}/article/${a.slug}</link>
      <guid isPermaLink="true">${SITE}/article/${a.slug}</guid>
      <category>${escape(a.section.name)}</category>
      ${a.author.name ? `<dc:creator>${escape(a.author.name)}</dc:creator>` : ""}
      <pubDate>${new Date(a.publishedAt!).toUTCString()}</pubDate>
      <description>${escape(a.excerpt ?? "")}</description>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Coco Entertainment</title>
    <link>${SITE}</link>
    <description>Movies, TV, music, and celebrity news, reviews, and awards coverage.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
