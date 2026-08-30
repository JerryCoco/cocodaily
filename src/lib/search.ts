import "server-only";
import { prisma } from "@/lib/prisma";

export type SearchHit = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  sectionName: string;
  sectionSlug: string;
  sectionColor: string;
  authorId: string;
  authorName: string | null;
};

const PAGE_SIZE = 12;

/** Postgres full-text search over title + excerpt + body text. Uses the
 *  generated `searchVector` tsvector column + GIN index. PUBLISHED only. */
export async function searchArticles(rawQuery: string, page = 1) {
  const q = rawQuery.trim();
  if (!q) return { hits: [] as SearchHit[], total: 0, page: 1, pages: 0, q };

  const offset = (Math.max(page, 1) - 1) * PAGE_SIZE;

  const [hits, countRows] = await Promise.all([
    prisma.$queryRaw<SearchHit[]>`
      SELECT a.id, a.title, a.slug, a.excerpt, a."publishedAt",
             s.name  AS "sectionName",
             s.slug  AS "sectionSlug",
             s.color AS "sectionColor",
             u.id    AS "authorId",
             u.name  AS "authorName"
      FROM "Article" a
      JOIN "Section" s ON s.id = a."sectionId"
      JOIN "User" u ON u.id = a."authorId"
      WHERE a.status = 'PUBLISHED'
        AND a."publishedAt" <= now()
        AND a."searchVector" @@ websearch_to_tsquery('english', ${q})
      ORDER BY ts_rank(a."searchVector", websearch_to_tsquery('english', ${q})) DESC,
               a."publishedAt" DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*)::bigint AS count
      FROM "Article" a
      WHERE a.status = 'PUBLISHED'
        AND a."publishedAt" <= now()
        AND a."searchVector" @@ websearch_to_tsquery('english', ${q})
    `,
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  return { hits, total, page: Math.max(page, 1), pages: Math.ceil(total / PAGE_SIZE), q };
}
