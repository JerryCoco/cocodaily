import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getArticlePage } from "@/lib/queries";
import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";

export const revalidate = 300;

// Generated on first request, then ISR-cached for `revalidate` seconds — not
// prerendered at build. Keeps a Neon blip during the Vercel build from failing
// the whole deploy (section pages just warm up on their first hit instead).
export const dynamicParams = true;
export function generateStaticParams() {
  return [] as { section: string }[];
}

export async function generateMetadata({
  params,
}: PageProps<"/[section]">): Promise<Metadata> {
  const { section } = await params;
  const row = await prisma.section.findUnique({ where: { slug: section } });
  return { title: row ? row.name : "Not found" };
}

export default async function SectionPage({ params, searchParams }: PageProps<"/[section]">) {
  const { section } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const row = await prisma.section.findUnique({ where: { slug: section } });
  if (!row) notFound();

  const { items, pages } = await getArticlePage({ sectionSlug: section, page });

  return (
    <div>
      <header className="mb-8">
        <p className="kicker flex items-center gap-1.5 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
          Section
        </p>
        <h1 className="font-display mt-2 text-4xl font-extrabold md:text-5xl">{row.name}</h1>
        <span
          className="mt-3 block h-[3px] w-14 rounded"
          style={{ backgroundColor: row.color }}
        />
      </header>

      {items.length === 0 ? (
        <p className="text-muted">Nothing published in {row.name} yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} basePath={`/${section}`} />
    </div>
  );
}
