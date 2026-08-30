"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CommentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { scoreComment } from "@/lib/spam";
import { allow, limiters } from "@/lib/rate-limit";

// ---- save for later -------------------------------------------------------

export async function toggleSave(articleId: string): Promise<{ saved: boolean }> {
  const user = await requireUser();
  const key = { userId_articleId: { userId: user.id, articleId } };
  const existing = await prisma.savedArticle.findUnique({ where: key });
  if (existing) {
    await prisma.savedArticle.delete({ where: key });
    revalidatePath("/account/saved");
    return { saved: false };
  }
  await prisma.savedArticle.create({ data: { userId: user.id, articleId } });
  revalidatePath("/account/saved");
  return { saved: true };
}

// ---- comments -----------------------------------------------------------

const bodySchema = z.string().trim().min(2, "Say a little more").max(4000);

export async function postComment(
  articleId: string,
  slug: string,
  raw: string,
): Promise<{ ok: boolean; status?: CommentStatus; error?: string }> {
  const user = await requireUser();
  if (!(await allow(limiters.comment, `comment:${user.id}`))) {
    return { ok: false, error: "You're commenting too fast — try again in a few minutes." };
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const body = parsed.data;

  const verdict = scoreComment(body);
  let status: CommentStatus = "PENDING";
  if (verdict === "spam") {
    status = "SPAM";
  } else if (verdict === "clean") {
    const [approvedCount, u] = await Promise.all([
      prisma.comment.count({ where: { userId: user.id, status: "APPROVED" } }),
      prisma.user.findUnique({ where: { id: user.id }, select: { createdAt: true } }),
    ]);
    const trusted =
      approvedCount > 0 &&
      !!u &&
      Date.now() - u.createdAt.getTime() > 24 * 60 * 60 * 1000;
    status = trusted ? "APPROVED" : "PENDING";
  }

  await prisma.comment.create({
    data: { articleId, userId: user.id, body, status },
  });

  if (status === "APPROVED") revalidatePath(`/article/${slug}`);
  revalidatePath("/studio/comments");
  return { ok: true, status };
}
