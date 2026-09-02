import "server-only";
import { prisma } from "@/lib/prisma";

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function fillDays(rows: { day: string; value: number }[], days: number) {
  const map = new Map(rows.map((r) => [r.day, r.value]));
  const out: { day: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKey(d);
    out.push({ day: key, value: map.get(key) ?? 0 });
  }
  return out;
}

export async function getAnalyticsOverview() {
  const [agg, published, subscribers, comments, pending, saves] = await Promise.all([
    prisma.article.aggregate({ _sum: { viewCount: true } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.newsletterSubscriber.count({ where: { confirmedAt: { not: null } } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.savedArticle.count(),
  ]);
  const totalViews = agg._sum.viewCount ?? 0;
  return {
    totalViews,
    published,
    subscribers,
    comments,
    pendingComments: pending,
    saves,
    avgViews: published ? Math.round(totalViews / published) : 0,
    subsPerThousandViews: totalViews ? +((subscribers / totalViews) * 1000).toFixed(1) : 0,
  };
}

export async function getViewsSeries(days = 30) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  const rows = await prisma.viewDaily.groupBy({
    by: ["day"],
    where: { day: { gte: since } },
    _sum: { views: true },
  });
  return fillDays(
    rows.map((r) => ({ day: dayKey(r.day), value: r._sum.views ?? 0 })),
    days,
  );
}

export async function getSubscriberSeries(days = 30) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  const subs = await prisma.newsletterSubscriber.findMany({
    where: { createdAt: { gte: since }, confirmedAt: { not: null } },
    select: { createdAt: true },
  });
  const counts = new Map<string, number>();
  for (const s of subs) {
    const k = dayKey(s.createdAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return fillDays(
    [...counts].map(([day, value]) => ({ day, value })),
    days,
  );
}

export async function getTopArticles(limit = 10) {
  return prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: {
      title: true,
      slug: true,
      viewCount: true,
      section: { select: { name: true, color: true } },
    },
    orderBy: { viewCount: "desc" },
    take: limit,
  });
}

export async function getCommentBreakdown() {
  const rows = await prisma.comment.groupBy({ by: ["status"], _count: true });
  return rows.map((r) => ({ status: r.status, count: r._count }));
}

export async function getTopSaved(limit = 5) {
  const grouped = await prisma.savedArticle.groupBy({
    by: ["articleId"],
    _count: true,
    orderBy: { _count: { articleId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];
  const articles = await prisma.article.findMany({
    where: { id: { in: grouped.map((g) => g.articleId) } },
    select: { id: true, title: true, slug: true },
  });
  const byId = new Map(articles.map((a) => [a.id, a]));
  return grouped
    .map((g) => ({ ...byId.get(g.articleId), saves: g._count }))
    .filter((x): x is { id: string; title: string; slug: string; saves: number } => !!x.id);
}
