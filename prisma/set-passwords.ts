/**
 * One-off: change the seeded staff passwords WITHOUT touching any content.
 *
 * Usage (PowerShell):
 *   $env:STAFF_PASSWORD="your-strong-pass"; npm run db:set-passwords
 *
 * Per-account overrides (any subset):
 *   $env:PW_ADA="..."; $env:PW_TUNDE="..."; $env:PW_CHIKA="..."; $env:PW_SAM="..."; npm run db:set-passwords
 *
 * Only updates User.passwordHash for the four demo logins. Safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ACCOUNTS: { key: string; email: string }[] = [
  { key: "PW_ADA", email: "ada@coco.test" },
  { key: "PW_TUNDE", email: "tunde@coco.test" },
  { key: "PW_CHIKA", email: "chika@coco.test" },
  { key: "PW_SAM", email: "sam@coco.test" },
];

async function main() {
  const blanket = process.env.STAFF_PASSWORD?.trim();
  const targets = ACCOUNTS.map((a) => ({
    email: a.email,
    password: (process.env[a.key]?.trim() || blanket || "").trim(),
  })).filter((t) => t.password.length > 0);

  if (targets.length === 0) {
    console.error(
      "Nothing to do. Set STAFF_PASSWORD (applies to all) or PW_ADA / PW_TUNDE / PW_CHIKA / PW_SAM."
    );
    process.exit(1);
  }

  for (const t of targets) {
    if (t.password.length < 10) {
      console.error(`Refusing to set a password under 10 chars for ${t.email}.`);
      process.exit(1);
    }
  }

  for (const t of targets) {
    const passwordHash = await bcrypt.hash(t.password, 10);
    const res = await prisma.user.updateMany({
      where: { email: t.email },
      data: { passwordHash },
    });
    console.log(
      res.count > 0 ? `updated ${t.email}` : `skipped ${t.email} (no such user)`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
