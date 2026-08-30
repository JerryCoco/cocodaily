import Link from "next/link";
import type { CommentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff, canPublish } from "@/lib/auth-helpers";
import { CommentModRow } from "@/components/studio/comment-mod-row";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comments" };

const TABS: { label: string; value: CommentStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Spam", value: "SPAM" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default async function CommentsQueue({ searchParams }: PageProps<"/studio/comments">) {
  const user = await requireStaff();
  if (!canPublish(user.role)) {
    return <p className="text-muted">Only editors can moderate comments.</p>;
  }

  const { status } = await searchParams;
  const active = TABS.some((t) => t.value === status)
    ? (status as CommentStatus)
    : "PENDING";

  const [rows, counts] = await Promise.all([
    prisma.comment.findMany({
      where: { status: active },
      select: {
        id: true,
        body: true,
        createdAt: true,
        status: true,
        user: { select: { name: true } },
        article: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.comment.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: CommentStatus) =>
    counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Comments</h1>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/studio/comments?status=${t.value}`}
            className={`rounded-full border px-3 py-1 ${
              active === t.value
                ? "border-ink bg-ink text-white"
                : "border-line text-muted hover:bg-bg"
            }`}
          >
            {t.label} ({countFor(t.value)})
          </Link>
        ))}
      </div>

      <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface px-4">
        {rows.map((r) => (
          <CommentModRow
            key={r.id}
            row={{
              id: r.id,
              body: r.body,
              createdAt: r.createdAt.toISOString(),
              status: r.status,
              author: r.user.name ?? "Reader",
              articleTitle: r.article.title,
              articleSlug: r.article.slug,
            }}
          />
        ))}
        {rows.length === 0 && (
          <li className="py-8 text-center text-sm text-muted">Nothing here.</li>
        )}
      </ul>
    </div>
  );
}
