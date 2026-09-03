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

  const fmtDay = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold md:text-3xl">Articles</h1>
        <Link
          href="/studio/articles/new"
          className="press shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          New article
        </Link>
      </div>

      <div className="mt-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm md:mx-0 md:flex-wrap md:px-0">
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

      {articles.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line bg-surface px-4 py-12 text-center text-sm text-muted">
          Nothing here yet.
        </p>
      ) : (
        <>
          {/* Cards (mobile) */}
          <ul className="mt-4 flex flex-col gap-2 md:hidden">
            {articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/studio/articles/${a.id}/edit`}
                  className="press block rounded-2xl border border-line bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-snug">{a.title}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {a.section.name} · {a.author.name} · {fmtDay(a.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Table (desktop) */}
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Section</th>
                  <th className="px-4 py-3 font-semibold">Author</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0 hover:bg-bg">
                    <td className="px-4 py-3">
                      <Link
                        href={`/studio/articles/${a.id}/edit`}
                        className="font-semibold hover:text-accent"
                      >
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{a.section.name}</td>
                    <td className="px-4 py-3 text-muted">{a.author.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{fmtDay(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function FilterLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`press shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 capitalize ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line text-muted hover:bg-bg hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
