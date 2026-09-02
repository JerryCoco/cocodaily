"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { allow, limiters } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { passwordReset } from "@/lib/mail-templates";
import { newToken, hashToken } from "@/lib/tokens";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const emailSchema = z.string().trim().toLowerCase().email();

const GENERIC = {
  ok: true,
  message: "If that email has an account, a reset link is on its way.",
};

export async function requestReset(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };
  const email = parsed.data;

  if (!(await allow(limiters.register, `reset:${email}`))) {
    return { ok: false, message: "Too many attempts. Try again later." };
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { name: true } });
  if (user) {
    const token = newToken();
    await prisma.passwordResetToken.deleteMany({ where: { email } }); // one live token per address
    await prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await sendMail({
      to: email,
      ...passwordReset({
        name: user.name ?? "there",
        url: `${SITE}/reset-password?token=${token}`,
      }),
    });
  }

  // Same answer whether or not the account exists — no user enumeration.
  return GENERIC;
}
