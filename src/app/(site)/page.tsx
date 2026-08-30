import Link from "next/link";
import { getHomeData } from "@/lib/queries";
import { ArticleCard } from "@/components/article-card";

// Rebuilt on demand when an editor publishes (revalidateTag), plus a slow
// time-based fallback. See big-01 "Rendering + caching strategy".
export const revalidate = 300;

export default async function HomePage() {
  const { hero, trending, perSection } = await getHomeData();

  if (!hero) {
    return (
      <p className="text-muted">
        No articles published yet. Run <code>npm run seed</code>, or sign in and publish one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-14">
      <h1 className="sr-only">Coco — latest entertainment news</h1>
      {/* Hero + trending */}
      <section className="grid gap-10 md:grid-cols-[1.9fr_1fr]">
        <ArticleCard article={hero} size="lg" />
        <div className="md:border-l md:border-line md:pl-8">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Trending
          </h2>
          <ol className="flex flex-col divide-y divide-line">
            {trending.map((a, i) => (
              <li key={a.slug} className="flex gap-4 py-4 first:pt-0">
                <span className="font-display text-2xl font-bold text-line">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <Link
                    href={`/article/${a.slug}`}
                    className="font-display font-semibold leading-snug hover:text-accent"
                  >
                    {a.title}
                  </Link>
                  <p
                    className="mt-1 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: a.section.color }}
                  >
                    {a.section.name}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Latest per section */}
      {perSection.map(({ section, articles }) => (
        <section key={section.slug}>
          <div
            className="mb-5 flex items-baseline justify-between border-b-2 pb-2"
            style={{ borderColor: section.color }}
          >
            <h2 className="font-display text-2xl font-extrabold">{section.name}</h2>
            <Link
              href={`/${section.slug}`}
              className="text-sm font-medium text-muted hover:text-ink"
            >
              More →
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
