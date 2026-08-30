import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAuthor, getPublishedArticles } from "@/lib/queries";
import { ArticleCard } from "@/components/article-card";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/author/[id]">): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthor(id);
  return { title: author?.name ?? "Author" };
}

export default async function AuthorPage({ params }: PageProps<"/author/[id]">) {
  const { id } = await params;
  const author = await getAuthor(id);
  if (!author) notFound();

  const articles = await getPublishedArticles({ authorId: id, take: 24 });

  return (
    <div>
      <header className="mb-8 flex items-center gap-4">
        {author.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatarUrl} alt={author.name ?? ""} className="h-16 w-16 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-3xl font-extrabold">{author.name}</h1>
          {author.bio && <p className="mt-1 text-muted">{author.bio}</p>}
        </div>
      </header>

      {articles.length === 0 ? (
        <p className="text-muted">No published articles.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
