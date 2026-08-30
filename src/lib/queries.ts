import "server-only";
import { prisma } from "@/lib/prisma";
import { cachedJSON } from "@/lib/redis";

// A function, not a const — `new Date()` must be evaluated per call, not once
// at module load (otherwise articles published after server start stay hidden).
const published = () => ({
  status: "PUBLISHED" as const,
  publishedAt: { lte: new Date() },
});

const cardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  section: { select: { name: true, slug: true, color: true } },
  author: { select: { id: true, name: true } },
  coverMedia: { select: { originalUrl: true, publicId: true, alt: true } },
} as const;

export function getSections() {
  return prisma.section.findMany({ orderBy: { name: "asc" } });
}

export const PAGE_SIZE = 12;

/** One page of published articles + total count, for section / author / tag pages. */
export async function getArticlePage(opts: {
  sectionSlug?: string;
  tagSlug?: string;
  authorId?: string;
  page?: number;
}) {
  const { sectionSlug, tagSlug, authorId, page = 1 } = opts;
  const where = {
    ...published(),
    ...(sectionSlug ? { section: { slug: sectionSlug } } : {}),
    ...(authorId ? { authorId } : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
      take: PAGE_SIZE,
      skip: (Math.max(page, 1) - 1) * PAGE_SIZE,
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total, page: Math.max(page, 1), pages: Math.ceil(total / PAGE_SIZE) };
}

export function getPublishedArticles(opts: {
  sectionSlug?: string;
  tagSlug?: string;
  authorId?: string;
  take?: number;
  skip?: number;
}) {
  const { sectionSlug, tagSlug, authorId, take = 12, skip = 0 } = opts;
  return prisma.article.findMany({
    where: {
      ...published(),
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

export function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({ where: { slug }, select: { name: true, slug: true } });
}

export function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, ...published() },
    select: {
      ...cardSelect,
      body: true,
      plainText: true,
      viewCount: true,
      updatedAt: true,
      author: { select: { id: true, name: true, bio: true, avatarUrl: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });
}

export async function getRelatedArticles(articleId: string, sectionSlug: string) {
  return prisma.article.findMany({
    where: { ...published(), section: { slug: sectionSlug }, id: { not: articleId } },
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

/** Home page: a hero, a trending rail, and the latest per section.
 *  ISR already caches the rendered page; this Redis layer (60s) shields Neon
 *  from the query burst when `revalidatePath("/")` fires on every publish and
 *  every view-count flush. Dates come back as ISO strings — callers coerce. */
export async function getHomeData() {
  return cachedJSON("home:data:v1", 60, computeHomeData);
}

async function computeHomeData() {
  const [hero, trending, sections] = await Promise.all([
    prisma.article.findFirst({
      where: published(),
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.article.findMany({
      where: published(),
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
        where: { ...published(), sectionId: s.id },
        select: cardSelect,
        orderBy: { publishedAt: "desc" },
        take: 4,
      }),
    })),
  );

  return { hero, trending, perSection: perSection.filter((g) => g.articles.length) };
}
