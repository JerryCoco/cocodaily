import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Flips due SCHEDULED articles to PUBLISHED. Wire to Vercel Cron (every minute):
 *   vercel.json -> { "crons": [{ "path": "/api/cron/publish", "schedule": "* * * * *" }] }
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. In dev (no secret set) it's open.
 * Project #3 (the job queue) later replaces this polling endpoint.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const due = await prisma.article.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
    select: { id: true, slug: true, authorId: true, section: { select: { slug: true } } },
  });

  for (const a of due) {
    await prisma.article.update({
      where: { id: a.id },
      data: { status: "PUBLISHED", publishedAt: new Date(), scheduledFor: null },
    });
    revalidatePath("/");
    revalidatePath(`/${a.section.slug}`);
    revalidatePath(`/article/${a.slug}`);
    revalidatePath(`/author/${a.authorId}`);
  }

  return Response.json({ published: due.length, at: new Date().toISOString() });
}
