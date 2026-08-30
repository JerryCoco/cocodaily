import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getPublishedArticles } from "@/lib/queries";
import { ArticleCard } from "@/components/article-card";

export const revalidate = 300;

export async function generateStaticParams() {
  const sections = await prisma.section.findMany({ select: { slug: true } });
  return sections.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[section]">): Promise<Metadata> {
  const { section } = await params;
  const row = await prisma.section.findUnique({ where: { slug: section } });
  return { title: row ? row.name : "Not found" };
}

export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const row = await prisma.section.findUnique({ where: { slug: section } });
  if (!row) notFound();

  const articles = await getPublishedArticles({ sectionSlug: section, take: 24 });

  return (
    <div>
      <h1
        className="mb-6 border-b-2 pb-2 text-4xl font-extrabold"
        style={{ borderColor: row.color }}
      >
        {row.name}
      </h1>
      {articles.length === 0 ? (
        <p className="text-muted">Nothing published in {row.name} yet.</p>
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
