import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff, canPublish } from "@/lib/auth-helpers";
import { ArticleForm } from "@/components/editor/article-form";
import { StatusBadge } from "@/components/studio/status-badge";
import { WorkflowControls } from "@/components/studio/workflow-controls";
import { RevisionList } from "@/components/studio/revision-list";

export const metadata = { title: "Edit article" };

export default async function EditArticlePage({ params }: PageProps<"/studio/articles/[id]/edit">) {
  const user = await requireStaff();
  const { id } = await params;

  const [article, sections] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: {
        section: true,
        coverMedia: true,
        tags: { include: { tag: true } },
        revisions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { editor: { select: { name: true } } },
        },
      },
    }),
    prisma.section.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();
  const isAuthor = article.authorId === user.id;
  if (!canPublish(user.role) && !isAuthor) {
    return <p className="text-muted">You can only edit your own articles.</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/studio" className="text-sm text-muted hover:text-ink">← Articles</Link>
        <StatusBadge status={article.status} />
        {article.status === "PUBLISHED" && (
          <Link
            href={`/article/${article.slug}`}
            target="_blank"
            className="text-sm text-accent hover:underline"
          >
            View live ↗
          </Link>
        )}
      </div>

      <ArticleForm
        sections={sections}
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          sectionId: article.sectionId,
          body: article.body,
          tags: article.tags.map((t) => t.tag.name),
          cover: {
            mediaId: article.coverMedia?.publicId ? article.coverMediaId ?? undefined : undefined,
            url: article.coverMedia?.originalUrl ?? "",
            publicId: article.coverMedia?.publicId ?? undefined,
            alt: article.coverMedia?.alt ?? "",
          },
        }}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Workflow</h2>
          <WorkflowControls
            articleId={article.id}
            status={article.status}
            canPublish={canPublish(user.role)}
            isAuthor={isAuthor}
          />
          {article.scheduledFor && (
            <p className="mt-2 text-xs text-muted">
              Scheduled for {new Date(article.scheduledFor).toLocaleString()}
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
            Revisions
          </h2>
          <RevisionList
            articleId={article.id}
            revisions={article.revisions.map((r) => ({
              id: r.id,
              title: r.title,
              createdAt: r.createdAt.toISOString(),
              editorName: r.editor.name,
            }))}
          />
        </section>
      </div>
    </div>
  );
}
