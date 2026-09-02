"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { allow, limiters } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { newsletterConfirm, newsletterWelcome } from "@/lib/mail-templates";

const emailSchema = z.string().trim().toLowerCase().email();

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const confirmUrl = (t: string) => `${SITE}/newsletter/confirm?token=${t}`;
const unsubUrl = (t: string) => `${SITE}/newsletter/unsubscribe?token=${t}`;

export async function subscribeNewsletter(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };
  const email = parsed.data;

  if (!(await allow(limiters.newsletter, `news:${email}`))) {
    return { ok: false, message: "Too many attempts. Try again later." };
  }

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing?.confirmedAt) {
    return { ok: true, message: "You're already on the list." };
  }

  // Double opt-in: create (or reuse) an unconfirmed row and email a confirm link.
  const sub =
    existing ??
    (await prisma.newsletterSubscriber.create({ data: { email, confirmedAt: null } }));

  await sendMail({ to: email, ...newsletterConfirm(confirmUrl(sub.unsubToken)) });

  return { ok: true, message: "Almost there. Check your inbox to confirm." };
}

export async function confirmByToken(token: string) {
  const sub = await prisma.newsletterSubscriber.findUnique({ where: { unsubToken: token } });
  if (!sub) return { ok: false as const };

  if (!sub.confirmedAt) {
    await prisma.newsletterSubscriber.update({
      where: { id: sub.id },
      data: { confirmedAt: new Date() },
    });
    await sendMail({ to: sub.email, ...newsletterWelcome(unsubUrl(sub.unsubToken)) });
  }
  return { ok: true as const, email: sub.email };
}

export async function unsubscribeByToken(token: string) {
  const sub = await prisma.newsletterSubscriber.findUnique({ where: { unsubToken: token } });
  if (!sub) return { ok: false };
  await prisma.newsletterSubscriber.delete({ where: { id: sub.id } });
  return { ok: true, email: sub.email };
}
