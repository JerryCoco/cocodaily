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
        No articles published yet. Run <code>npm run db:import-feeds</code>, or sign in and
        publish one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <h1 className="sr-only">Cocodaily: top stories from Ghana and around the world</h1>

      {/* Hero + trending */}
      <section className="grid gap-8 md:grid-cols-[1.9fr_1fr] md:gap-10">
        <ArticleCard article={hero} size="lg" />

        <div className="border-t border-line pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <h2 className="kicker mb-4 flex items-center gap-2 text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Trending
          </h2>
          <ol className="flex flex-col divide-y divide-line">
            {trending.map((a, i) => (
              <li key={a.slug} className="group flex gap-4 py-3.5 first:pt-0">
                <span className="font-display text-xl font-bold text-line-strong tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/article/${a.slug}`}
                    className="font-display font-semibold leading-snug transition-colors group-hover:text-accent"
                  >
                    {a.title}
                  </Link>
                  <p
                    className="kicker mt-1 flex items-center gap-1.5"
                    style={{ color: a.section.color }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: a.section.color }}
                    />
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
        <section key={section.slug} className="reveal">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold">{section.name}</h2>
              <span
                className="mt-1.5 block h-[3px] w-10 rounded"
                style={{ backgroundColor: section.color }}
              />
            </div>
            <Link
              href={`/${section.slug}`}
              className="group shrink-0 pb-1 text-sm font-medium text-muted hover:text-ink"
            >
              More{" "}
              <span className="inline-block transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
