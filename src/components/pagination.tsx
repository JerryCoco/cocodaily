import Link from "next/link";

/** Simple prev/next + page count. `basePath` gets `?page=` (or `&page=` if it
 *  already has a query string). */
export function Pagination({
  page,
  pages,
  basePath,
}: {
  page: number;
  pages: number;
  basePath: string;
}) {
  if (pages <= 1) return null;
  const sep = basePath.includes("?") ? "&" : "?";
  const href = (p: number) => `${basePath}${sep}page=${p}`;

  return (
    <nav className="mt-8 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="rounded-md border border-line px-3 py-1.5 hover:bg-bg">
          ← Newer
        </Link>
      ) : (
        <span className="rounded-md border border-line px-3 py-1.5 text-muted opacity-50">← Newer</span>
      )}
      <span className="text-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="rounded-md border border-line px-3 py-1.5 hover:bg-bg">
          Older →
        </Link>
      ) : (
        <span className="rounded-md border border-line px-3 py-1.5 text-muted opacity-50">Older →</span>
      )}
    </nav>
  );
}
