import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { ArticleCard } from "@/components/article-card";

export const metadata: Metadata = { title: "Saved articles" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await requireUser("/account/saved");

  const saves = await prisma.savedArticle.findMany({
    where: { userId: user.id, article: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    select: {
      article: {
        select: {
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          section: { select: { name: true, slug: true, color: true } },
          author: { select: { id: true, name: true } },
          coverMedia: { select: { originalUrl: true, publicId: true, alt: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="font-display mb-6 text-3xl font-extrabold">Saved articles</h1>
      {saves.length === 0 ? (
        <p className="text-muted">
          Nothing saved yet. Hit <span className="font-medium">☆ Save</span> on any article.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saves.map(({ article }) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
      <p className="mt-8 text-sm">
        <Link href="/" className="text-accent hover:underline">← Back to Coco News</Link>
      </p>
    </div>
  );
}
