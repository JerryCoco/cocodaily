import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

/** Per-viewer state for an article: signed-in?, saved?, and the approved
 *  comments. Called client-side so the article page itself stays ISR-cached. */
export async function GET(req: Request) {
  const articleId = new URL(req.url).searchParams.get("articleId");
  if (!articleId) return Response.json({ error: "articleId required" }, { status: 400 });

  const user = await getSessionUser();

  const [saved, comments] = await Promise.all([
    user
      ? prisma.savedArticle.findUnique({
          where: { userId_articleId: { userId: user.id, articleId } },
          select: { articleId: true },
        })
      : Promise.resolve(null),
    prisma.comment.findMany({
      where: { articleId, status: "APPROVED" },
      select: { id: true, body: true, createdAt: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return Response.json(
    {
      signedIn: !!user,
      saved: !!saved,
      comments: comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: c.user.name ?? "Reader",
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
