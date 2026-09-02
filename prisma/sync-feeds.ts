/**
 * Incremental feed sync from the command line. Appends new Guardian + Ghana
 * stories, never deletes. Run it whenever, or let the daily cron
 * (/api/cron/sync-feeds) do it.
 *
 *   $env:GUARDIAN_API_KEY="yourkey"; npm run db:sync-feeds
 */
import { PrismaClient } from "@prisma/client";
import { syncFeeds } from "../src/lib/feed-sync";

const prisma = new PrismaClient();

syncFeeds(prisma)
  .then(({ added, scanned }) => console.log(`sync-feeds: +${added} new of ${scanned} scanned`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
