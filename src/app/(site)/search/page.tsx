import Link from "next/link";
import type { Metadata } from "next";
import { searchArticles } from "@/lib/search";
import { Pagination } from "@/components/pagination";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic";

const fmtDate = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { hits, total, pages } = await searchArticles(q, page);

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Search</h1>

      <form action="/search" className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search articles…"
          className="w-full max-w-lg rounded-lg border border-line bg-surface px-4 py-2 outline-none focus:border-accent"
        />
      </form>

      {q && (
        <p className="mt-4 text-sm text-muted">
          {total} result{total === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-line">
        {hits.map((h) => (
          <li key={h.id} className="py-4">
            <Link href={`/${h.sectionSlug}`} className="text-xs font-semibold uppercase tracking-wide" style={{ color: h.sectionColor }}>
              {h.sectionName}
            </Link>
            <h2 className="mt-1 text-xl font-bold">
              <Link href={`/article/${h.slug}`} className="hover:text-accent">{h.title}</Link>
            </h2>
            {h.excerpt && <p className="mt-1 text-muted">{h.excerpt}</p>}
            <p className="mt-1 text-xs text-muted">
              {h.authorName} · {fmtDate(h.publishedAt)}
            </p>
          </li>
        ))}
      </ul>

      {q && hits.length === 0 && (
        <p className="mt-8 text-muted">No matches. Try different words.</p>
      )}

      <Pagination page={page} pages={pages} basePath={`/search?q=${encodeURIComponent(q)}`} />
    </div>
  );
}
