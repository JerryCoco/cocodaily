import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug, getRelatedArticles } from "@/lib/queries";
import { RenderTiptap } from "@/lib/render-tiptap";
import { readingTimeMinutes } from "@/lib/tiptap-text";
import { cldUrl } from "@/lib/cld-url";
import { ArticleCard } from "@/components/article-card";
import { SaveButton } from "@/components/save-button";
import { Comments } from "@/components/comments";

// Article HTML stays ISR-cached; reader-specific bits (save state, comments)
// load client-side from /api/reader/context so this page isn't forced dynamic.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/article/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Not found" };
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: "article",
      images: article.coverMedia ? [article.coverMedia.originalUrl] : undefined,
    },
  };
}

const fmtDate = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

export default async function ArticlePage({ params }: PageProps<"/article/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article.id, article.section.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: article.author.name ? [{ "@type": "Person", name: article.author.name }] : undefined,
    articleSection: article.section.name,
  };

  return (
    <article className="mx-auto max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href={`/${article.section.slug}`}
        className="text-sm font-bold uppercase tracking-wide"
        style={{ color: article.section.color }}
      >
        {article.section.name}
      </Link>
      <h1 className="font-display mt-2 text-4xl font-extrabold leading-[1.1]">{article.title}</h1>
      {article.excerpt && <p className="mt-3 text-xl text-muted">{article.excerpt}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-line py-3 text-sm text-muted">
        {article.author.name && (
          <Link href={`/author/${article.author.id}`} className="font-medium text-ink hover:text-accent">
            {article.author.name}
          </Link>
        )}
        <span>· {fmtDate(article.publishedAt)}</span>
        <span>· {readingTimeMinutes(article.plainText)} min read</span>
        <span className="ml-auto"><SaveButton articleId={article.id} /></span>
      </div>

      {article.coverMedia && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cldUrl(article.coverMedia.publicId, {
            w: 1400,
            fallbackUrl: article.coverMedia.originalUrl,
          })}
          alt={article.coverMedia.alt}
          className="mt-6 w-full rounded-lg"
        />
      )}

      <div className="mt-6">
        <RenderTiptap doc={article.body} />
      </div>

      {article.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map(({ tag }) => (
            <Link
              key={tag.slug}
              href={`/tag/${tag.slug}`}
              className="rounded-full bg-line px-3 py-1 text-sm text-muted hover:bg-line/70 hover:text-ink"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {article.author.bio && (
        <div className="mt-10 rounded-lg border border-line bg-surface p-4">
          <p className="text-sm font-bold">{article.author.name}</p>
          <p className="mt-1 text-sm text-muted">{article.author.bio}</p>
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display mb-4 text-2xl font-extrabold">More in {article.section.name}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}

      <Comments articleId={article.id} slug={article.slug} />
    </article>
  );
}
