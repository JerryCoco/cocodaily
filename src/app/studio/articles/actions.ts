"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma, type ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { requireStaff, canPublish } from "@/lib/auth-helpers";
import { revalidateArticle } from "@/lib/revalidate";
import { tiptapToPlainText } from "@/lib/tiptap-text";

const articleInput = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().optional(),
  excerpt: z.string().max(280).optional().or(z.literal("")),
  sectionId: z.string().min(1, "Pick a section"),
  tags: z.array(z.string().min(1)).max(8).default([]),
  coverMediaId: z.string().optional(), // set when the image was uploaded via /api/media/upload
  coverImageUrl: z.string().url().optional().or(z.literal("")), // fallback: pasted URL
  coverAlt: z.string().optional().or(z.literal("")),
  body: z.unknown(),
});

/** Tiptap document JSON, coerced for Prisma's JSON column. */
function asDoc(body: unknown): Prisma.InputJsonValue {
  if (!body || typeof body !== "object" || (body as { type?: unknown }).type !== "doc") {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  return body as Prisma.InputJsonValue;
}

export type ArticleInput = z.input<typeof articleInput>;
export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = slugify(base) || "article";
  for (let i = 0; ; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await prisma.article.findFirst({
      where: { slug: candidate, NOT: ignoreId ? { id: ignoreId } : undefined },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
}

async function upsertTagIds(names: string[]) {
  const ids: string[] = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name: name.trim(), slug },
      select: { id: true },
    });
    ids.push(tag.id);
  }
  return ids;
}

export async function saveArticle(raw: ArticleInput): Promise<SaveResult> {
  const user = await requireStaff();
  const parsed = articleInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const tagIds = await upsertTagIds(data.tags);

  // ---- update ----
  if (data.id) {
    const existing = await prisma.article.findUnique({
      where: { id: data.id },
      include: { section: true, coverMedia: true },
    });
    if (!existing) return { ok: false, error: "Article not found" };
    if (!canPublish(user.role) && existing.authorId !== user.id) {
      return { ok: false, error: "You can only edit your own drafts" };
    }

    // snapshot the pre-edit state
    await prisma.revision.create({
      data: {
        article: { connect: { id: existing.id } },
        editor: { connect: { id: user.id } },
        title: existing.title,
        body: asDoc(existing.body),
      },
    });

    const slug =
      data.slug && slugify(data.slug) !== existing.slug
        ? await uniqueSlug(data.slug, existing.id)
        : existing.slug;

    let coverMediaId = existing.coverMediaId;
    if (data.coverMediaId) {
      coverMediaId = data.coverMediaId; // uploaded image — Media row already exists
    } else if (
      data.coverImageUrl &&
      data.coverImageUrl !== existing.coverMedia?.originalUrl
    ) {
      const media = await prisma.media.create({
        data: { originalUrl: data.coverImageUrl, alt: data.coverAlt || data.title },
      });
      coverMediaId = media.id;
    } else if (!data.coverImageUrl && !existing.coverMedia?.publicId) {
      coverMediaId = null; // pasted URL cleared
    }

    const updated = await prisma.article.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        body: asDoc(data.body),
        plainText: tiptapToPlainText(data.body),
        section: { connect: { id: data.sectionId } },
        coverMedia: coverMediaId ? { connect: { id: coverMediaId } } : undefined,
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
      },
      include: { section: true },
    });

    if (updated.status === "PUBLISHED") {
      revalidateArticle({
        slug: updated.slug,
        sectionSlug: updated.section.slug,
        authorId: updated.authorId,
      });
    }
    revalidatePath("/studio");
    return { ok: true, id: updated.id };
  }

  // ---- create ----
  const slug = await uniqueSlug(data.slug || data.title);
  const created = await prisma.article.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      body: asDoc(data.body),
      plainText: tiptapToPlainText(data.body),
      status: "DRAFT",
      section: { connect: { id: data.sectionId } },
      author: { connect: { id: user.id } },
      coverMedia: data.coverMediaId
        ? { connect: { id: data.coverMediaId } }
        : data.coverImageUrl
          ? { create: { originalUrl: data.coverImageUrl, alt: data.coverAlt || data.title } }
          : undefined,
      tags: { create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) },
    },
  });
  revalidatePath("/studio");
  return { ok: true, id: created.id };
}

// ---------------------------------------------------------------------------

const TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  DRAFT: ["IN_REVIEW", "PUBLISHED", "SCHEDULED"],
  IN_REVIEW: ["DRAFT", "PUBLISHED", "SCHEDULED"],
  SCHEDULED: ["DRAFT", "PUBLISHED"],
  PUBLISHED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT", "PUBLISHED"],
};

export async function transitionArticle(
  id: string,
  to: ArticleStatus,
  scheduledFor?: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireStaff();
  const article = await prisma.article.findUnique({
    where: { id },
    include: { section: true },
  });
  if (!article) return { ok: false, error: "Not found" };

  if (!TRANSITIONS[article.status].includes(to)) {
    return { ok: false, error: `Can't move from ${article.status} to ${to}` };
  }

  const editor = canPublish(user.role);
  const writerOwnDraftMove =
    !editor &&
    article.authorId === user.id &&
    ((article.status === "DRAFT" && to === "IN_REVIEW") ||
      (article.status === "IN_REVIEW" && to === "DRAFT"));
  if (!editor && !writerOwnDraftMove) {
    return { ok: false, error: "Only an editor can publish, schedule, or archive" };
  }

  const patch: {
    status: ArticleStatus;
    publishedAt?: Date | null;
    scheduledFor?: Date | null;
  } = { status: to };

  if (to === "PUBLISHED") {
    patch.publishedAt = article.publishedAt ?? new Date();
    patch.scheduledFor = null;
  } else if (to === "SCHEDULED") {
    const when = scheduledFor ? new Date(scheduledFor) : null;
    if (!when || Number.isNaN(when.getTime()) || when <= new Date()) {
      return { ok: false, error: "Pick a future date/time to schedule" };
    }
    patch.scheduledFor = when;
  }

  await prisma.article.update({ where: { id }, data: patch });

  revalidateArticle({
    slug: article.slug,
    sectionSlug: article.section.slug,
    authorId: article.authorId,
  });
  revalidatePath("/studio");
  return { ok: true };
}

export async function restoreRevision(articleId: string, revisionId: string) {
  const user = await requireStaff();
  const [article, revision] = await Promise.all([
    prisma.article.findUnique({ where: { id: articleId }, include: { section: true } }),
    prisma.revision.findUnique({ where: { id: revisionId } }),
  ]);
  if (!article || !revision || revision.articleId !== articleId) {
    return { ok: false, error: "Not found" };
  }
  if (!canPublish(user.role) && article.authorId !== user.id) {
    return { ok: false, error: "Not allowed" };
  }

  // snapshot current, then apply the old one
  await prisma.revision.create({
    data: {
      article: { connect: { id: articleId } },
      editor: { connect: { id: user.id } },
      title: article.title,
      body: asDoc(article.body),
    },
  });
  await prisma.article.update({
    where: { id: articleId },
    data: { title: revision.title, body: asDoc(revision.body) },
  });

  if (article.status === "PUBLISHED") {
    revalidateArticle({
      slug: article.slug,
      sectionSlug: article.section.slug,
      authorId: article.authorId,
    });
  }
  revalidatePath(`/studio/articles/${articleId}/edit`);
  return { ok: true };
}

export async function deleteArticle(id: string) {
  const user = await requireStaff();
  if (!canPublish(user.role)) redirect("/studio?error=forbidden");
  const article = await prisma.article.findUnique({
    where: { id },
    include: { section: true },
  });
  if (!article) return;
  await prisma.article.delete({ where: { id } });
  revalidateArticle({
    slug: article.slug,
    sectionSlug: article.section.slug,
    authorId: article.authorId,
  });
  revalidatePath("/studio");
  redirect("/studio");
}
