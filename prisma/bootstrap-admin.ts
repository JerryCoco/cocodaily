/**
 * Create (or promote) an ADMIN account with a random temporary password and
 * email it to them. Content is untouched. Safe to re-run — it re-issues a new
 * temp password each time.
 *
 * Usage (PowerShell):
 *   $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_NAME="Your Name"; npm run db:bootstrap-admin
 *
 * SMTP_* must be set for the email to actually send; otherwise the temp
 * password is printed to this console only.
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendMail } from "../src/lib/mail";
import { adminTempPassword } from "../src/lib/mail-templates";

const prisma = new PrismaClient();

function tempPassword(): string {
  // 18 url-safe chars, no ambiguous lookalikes
  return randomBytes(18)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .replace(/[0OlI1]/g, "x")
    .slice(0, 18);
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Set ADMIN_EMAIL to a valid address.");
    process.exit(1);
  }
  const name = process.env.ADMIN_NAME?.trim() || email.split("@")[0];
  const pw = tempPassword();
  const passwordHash = await bcrypt.hash(pw, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash, name },
    create: { email, name, role: "ADMIN", passwordHash },
  });

  const sent = await sendMail({
    to: email,
    ...adminTempPassword({ name, email, tempPassword: pw }),
  });

  console.log(`\nADMIN ready: ${email} (id ${user.id})`);
  console.log(`Temporary password: ${pw}`);
  console.log(
    sent
      ? "Emailed the temp password."
      : "Email not sent (SMTP_* unset) — use the password above, then change it at /account/password.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
