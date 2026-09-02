"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { sendMail } from "@/lib/mail";
import { passwordChanged } from "@/lib/mail-templates";

type State = { error?: string; ok?: boolean };

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(10, "New password must be at least 10 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    message: "New passwords don't match",
    path: ["confirm"],
  });

export async function changePassword(_prev: State, formData: FormData): Promise<State> {
  const user = await requireUser("/account/password");

  const parsed = schema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, passwordHash: true },
  });
  if (!row?.passwordHash) return { error: "This account has no password set." };

  const ok = await bcrypt.compare(parsed.data.current, row.passwordHash);
  if (!ok) return { error: "Current password is wrong." };

  if (await bcrypt.compare(parsed.data.next, row.passwordHash)) {
    return { error: "New password must be different from the old one." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.next, 10) },
  });

  await sendMail({ to: row.email, ...passwordChanged(row.name ?? "there") });

  return { ok: true };
}
