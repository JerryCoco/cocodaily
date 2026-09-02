"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mail";
import { passwordChanged } from "@/lib/mail-templates";

const schema = z
  .object({
    token: z.string().min(1),
    next: z.string().min(10, "New password must be at least 10 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export async function resetPassword(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const { token, next } = parsed.data;

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.expiresAt < new Date()) {
    return { error: "This link is invalid or has expired. Request a new one." };
  }

  const user = await prisma.user.findUnique({
    where: { email: row.email },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    await prisma.passwordResetToken.deleteMany({ where: { email: row.email } });
    return { error: "Account not found." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  await prisma.passwordResetToken.deleteMany({ where: { email: row.email } });
  await sendMail({ to: user.email, ...passwordChanged(user.name ?? "there") });

  redirect("/login?reset=1");
}
