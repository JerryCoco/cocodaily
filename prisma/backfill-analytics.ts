// One-off: spread each article's existing viewCount across the last 30 days so
// the analytics charts have history. Safe to re-run (clears ViewDaily first).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function dayUTC(offset: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offset);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.viewDaily.deleteMany();

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, viewCount: true },
  });

  let rows = 0;
  for (const a of articles) {
    let remaining = a.viewCount;
    for (let i = 29; i >= 0 && remaining > 0; i--) {
      // weight toward recent days
      const weight = (30 - i) / 30;
      const take = Math.min(
        remaining,
        Math.round((a.viewCount / 20) * weight * (0.5 + Math.random())),
      );
      if (take <= 0) continue;
      remaining -= take;
      await prisma.viewDaily.create({
        data: { articleId: a.id, day: dayUTC(i), views: take },
      });
      rows++;
    }
    if (remaining > 0) {
      await prisma.viewDaily.upsert({
        where: { articleId_day: { articleId: a.id, day: dayUTC(0) } },
        create: { articleId: a.id, day: dayUTC(0), views: remaining },
        update: { views: { increment: remaining } },
      });
      rows++;
    }
  }
  console.log(`backfilled ${rows} ViewDaily rows for ${articles.length} articles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
