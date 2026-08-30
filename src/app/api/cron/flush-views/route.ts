import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { drainViews, redisEnabled } from "@/lib/redis";

/**
 * Folds Redis view counters into Postgres. Wire to Vercel Cron every ~5 min
 * (vercel.json). Bearer $CRON_SECRET in prod; open in dev.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!redisEnabled) {
    return Response.json({ skipped: "redis not configured" });
  }

  const pending = await drainViews();
  if (pending.length === 0) return Response.json({ flushed: 0 });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction(
    pending.flatMap((p) => [
      prisma.article.update({
        where: { id: p.id },
        data: { viewCount: { increment: p.delta } },
      }),
      prisma.viewDaily.upsert({
        where: { articleId_day: { articleId: p.id, day: today } },
        create: { articleId: p.id, day: today, views: p.delta },
        update: { views: { increment: p.delta } },
      }),
    ]),
  );

  // trending on the home page is ordered by viewCount
  revalidatePath("/");

  return Response.json({
    flushed: pending.length,
    total: pending.reduce((n, p) => n + p.delta, 0),
    at: new Date().toISOString(),
  });
}
