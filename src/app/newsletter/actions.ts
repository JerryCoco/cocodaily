"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const emailSchema = z.string().trim().toLowerCase().email();

export async function subscribeNewsletter(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };
  const email = parsed.data;

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) {
    return { ok: true, message: "You're already on the list." };
  }

  // Single opt-in for now. Double opt-in (send a confirm link) waits on an email
  // provider; the unsubscribe token + page already work.
  await prisma.newsletterSubscriber.create({
    data: { email, confirmedAt: new Date() },
  });
  return { ok: true, message: "Subscribed. Check your inbox for the next issue." };
}

export async function unsubscribeByToken(token: string) {
  const sub = await prisma.newsletterSubscriber.findUnique({ where: { unsubToken: token } });
  if (!sub) return { ok: false };
  await prisma.newsletterSubscriber.delete({ where: { id: sub.id } });
  return { ok: true, email: sub.email };
}
