import { incrementView } from "@/lib/redis";

/** Fired once per article view by <ViewPing/>. Counts in Redis; the
 *  /api/cron/flush-views job folds these into Postgres periodically. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (id) {
    // fire-and-forget; a dropped view is fine
    incrementView(id).catch(() => {});
  }
  return new Response(null, { status: 204 });
}
