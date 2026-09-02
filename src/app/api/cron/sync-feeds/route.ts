import { revalidatePath } from "next/cache";
import { syncFeeds } from "@/lib/feed-sync";

/**
 * Pulls the latest Guardian + Ghana items and inserts the new ones (dedup on
 * Article.sourceUrl). Never deletes. Wired to a daily Vercel Cron in vercel.json;
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Open in dev when no secret.
 *
 * External fetches + inserts. Vercel Hobby caps this at 60s; an unfinished run
 * just resumes next time (dedup on sourceUrl means nothing doubles up). For a
 * heavier catch-up, run `npm run db:sync-feeds` locally.
 */
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { added, scanned } = await syncFeeds();

  if (added > 0) {
    revalidatePath("/");
    for (const s of ["ghana", "africa", "world", "business", "tech", "sport", "culture"]) {
      revalidatePath(`/${s}`);
    }
  }

  return Response.json({ added, scanned, at: new Date().toISOString() });
}
