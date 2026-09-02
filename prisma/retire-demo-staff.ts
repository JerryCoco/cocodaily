/**
 * Neutralise the demo staff logins that `db:seed` created
 * (ada@coco.test / tunde@coco.test / chika@coco.test / sam@coco.test).
 *
 * For each: if it has no articles, revisions or comments -> delete it.
 * Otherwise keep it as a content author but scramble its password to a random
 * value no one holds, so it can never be logged into again.
 *
 * Run once against the live DB after switching to self-registration:
 *   npm run db:retire-demo-staff
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAILS = ["ada@coco.test", "tunde@coco.test", "chika@coco.test", "sam@coco.test"];

async function main() {
  for (const email of EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        _count: { select: { articles: true, comments: true } },
      },
    });
    if (!user) {
      console.log(`skip ${email} (not found)`);
      continue;
    }

    const revisions = await prisma.revision.count({ where: { editorId: user.id } });
    const attached = user._count.articles + user._count.comments + revisions;

    if (attached === 0) {
      await prisma.savedArticle.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`deleted ${email} (no content)`);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10) },
      });
      console.log(`locked ${email} (kept as author of ${attached} item(s))`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
