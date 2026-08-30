import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAuthor, getArticlePage } from "@/lib/queries";
import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/author/[id]">): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthor(id);
  return { title: author?.name ?? "Author" };
}

export default async function AuthorPage({ params, searchParams }: PageProps<"/author/[id]">) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const author = await getAuthor(id);
  if (!author) notFound();

  const { items, pages } = await getArticlePage({ authorId: id, page });

  return (
    <div>
      <header className="mb-8 flex items-center gap-4">
        {author.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatarUrl} alt={author.name ?? ""} className="h-16 w-16 rounded-full object-cover" />
        )}
        <div>
          <h1 className="font-display text-3xl font-extrabold">{author.name}</h1>
          {author.bio && <p className="mt-1 text-muted">{author.bio}</p>}
        </div>
      </header>

      {items.length === 0 ? (
        <p className="text-muted">No published articles.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} basePath={`/author/${id}`} />
    </div>
  );
}
