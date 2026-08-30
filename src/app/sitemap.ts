import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, sections, authors] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    }),
    prisma.section.findMany({ select: { slug: true } }),
    prisma.user.findMany({
      where: { articles: { some: { status: "PUBLISHED" } } },
      select: { id: true },
    }),
  ]);

  return [
    { url: SITE, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/search`, changeFrequency: "weekly", priority: 0.3 },
    ...sections.map((s) => ({
      url: `${SITE}/${s.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...authors.map((a) => ({
      url: `${SITE}/author/${a.id}`,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
    ...articles.map((a) => ({
      url: `${SITE}/article/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
