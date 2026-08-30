"use server";

import { revalidatePath } from "next/cache";
import type { CommentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

type Action = "approve" | "reject" | "spam" | "delete";

export async function moderateComment(id: string, action: Action) {
  await requireRole("EDITOR");

  if (action === "delete") {
    await prisma.comment.delete({ where: { id } });
  } else {
    const status: CommentStatus =
      action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "SPAM";
    const c = await prisma.comment.update({
      where: { id },
      data: { status },
      select: { article: { select: { slug: true } } },
    });
    if (status === "APPROVED") revalidatePath(`/article/${c.article.slug}`);
  }

  revalidatePath("/studio/comments");
  return { ok: true };
}
