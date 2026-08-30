import "server-only";
import { prisma } from "@/lib/prisma";

const PUBLISHED = {
  status: "PUBLISHED" as const,
  publishedAt: { lte: new Date() },
};

const cardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  section: { select: { name: true, slug: true, color: true } },
  author: { select: { id: true, name: true } },
  coverMedia: { select: { originalUrl: true, alt: true } },
} as const;

export function getSections() {
  return prisma.section.findMany({ orderBy: { name: "asc" } });
}

export async function getPublishedArticles(opts: {
  sectionSlug?: string;
  tagSlug?: string;
  authorId?: string;
  take?: number;
  skip?: number;
}) {
  const { sectionSlug, tagSlug, authorId, take = 12, skip = 0 } = opts;
  return prisma.article.findMany({
    where: {
      ...PUBLISHED,
      ...(sectionSlug ? { section: { slug: sectionSlug } } : {}),
      ...(authorId ? { authorId } : {}),
      ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    },
    select: cardSelect,
    orderBy: { publishedAt: "desc" },
    take,
    skip,
  });
}

export function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, ...PUBLISHED },
    select: {
      ...cardSelect,
      body: true,
      viewCount: true,
      updatedAt: true,
      author: { select: { id: true, name: true, bio: true, avatarUrl: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });
}

export async function getRelatedArticles(articleId: string, sectionSlug: string) {
  return prisma.article.findMany({
    where: { ...PUBLISHED, section: { slug: sectionSlug }, id: { not: articleId } },
    select: cardSelect,
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
}

export function getAuthor(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, bio: true, avatarUrl: true },
  });
}

/** Home page: a hero, a trending rail, and the latest per section. */
export async function getHomeData() {
  const [hero, trending, sections] = await Promise.all([
    prisma.article.findFirst({
      where: PUBLISHED,
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.article.findMany({
      where: PUBLISHED,
      select: cardSelect,
      orderBy: { viewCount: "desc" },
      take: 5,
    }),
    prisma.section.findMany({ orderBy: { name: "asc" } }),
  ]);

  const perSection = await Promise.all(
    sections.map(async (s) => ({
      section: s,
      articles: await prisma.article.findMany({
        where: { ...PUBLISHED, sectionId: s.id },
        select: cardSelect,
        orderBy: { publishedAt: "desc" },
        take: 4,
      }),
    })),
  );

  return { hero, trending, perSection: perSection.filter((g) => g.articles.length) };
}
