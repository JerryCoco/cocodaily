import Link from "next/link";
import type { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff, canPublish } from "@/lib/auth-helpers";
import { StatusBadge } from "@/components/studio/status-badge";

export const dynamic = "force-dynamic";

const STATUS_ORDER: ArticleStatus[] = [
  "IN_REVIEW",
  "SCHEDULED",
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];

export default async function StudioHome({ searchParams }: PageProps<"/studio">) {
  const user = await requireStaff();
  const { status } = await searchParams;
  const statusFilter =
    typeof status === "string" && STATUS_ORDER.includes(status as ArticleStatus)
      ? (status as ArticleStatus)
      : undefined;

  // Writers see only their own; editors see everything.
  const where = {
    ...(canPublish(user.role) ? {} : { authorId: user.id }),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const articles = await prisma.article.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      publishedAt: true,
      scheduledFor: true,
      section: { select: { name: true } },
      author: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Articles</h1>
        <Link
          href="/studio/articles/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          New article
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <FilterLink label="All" active={!statusFilter} href="/studio" />
        {STATUS_ORDER.map((s) => (
          <FilterLink
            key={s}
            label={s.replace("_", " ").toLowerCase()}
            active={statusFilter === s}
            href={`/studio?status=${s}`}
          />
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Section</th>
              <th className="px-4 py-2 font-medium">Author</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0 hover:bg-bg">
                <td className="px-4 py-2">
                  <Link href={`/studio/articles/${a.id}/edit`} className="font-medium text-accent">
                    {a.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-muted">{a.section.name}</td>
                <td className="px-4 py-2 text-muted">{a.author.name}</td>
                <td className="px-4 py-2"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-2 text-muted">
                  {new Date(a.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Nothing here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 capitalize ${
        active ? "border-ink bg-ink text-white" : "border-line text-muted hover:bg-bg"
      }`}
    >
      {label}
    </Link>
  );
}
