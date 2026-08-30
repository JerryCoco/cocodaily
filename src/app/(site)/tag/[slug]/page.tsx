import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTagBySlug, getArticlePage } from "@/lib/queries";
import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  return { title: tag ? `#${tag.name}` : "Tag" };
}

export default async function TagPage({ params, searchParams }: PageProps<"/tag/[slug]">) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const { items, pages } = await getArticlePage({ tagSlug: slug, page });

  return (
    <div>
      <h1 className="font-display mb-6 text-4xl font-extrabold">
        <span className="text-muted">#</span>
        {tag.name}
      </h1>
      {items.length === 0 ? (
        <p className="text-muted">Nothing tagged #{tag.name} yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} basePath={`/tag/${slug}`} />
    </div>
  );
}
