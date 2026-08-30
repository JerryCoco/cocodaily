import Link from "next/link";

type Card = {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  section: { name: string; slug: string; color: string };
  author: { id: string; name: string | null };
  coverMedia: { originalUrl: string; alt: string } | null;
};

const fmtDate = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export function ArticleCard({ article, size = "md" }: { article: Card; size?: "md" | "lg" }) {
  return (
    <article className="group flex flex-col">
      <Link href={`/article/${article.slug}`} className="block overflow-hidden rounded-lg bg-line">
        {article.coverMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverMedia.originalUrl}
            alt={article.coverMedia.alt}
            className={`w-full object-cover transition-transform group-hover:scale-[1.02] ${
              size === "lg" ? "aspect-[16/9]" : "aspect-[3/2]"
            }`}
          />
        ) : (
          <div className={size === "lg" ? "aspect-[16/9]" : "aspect-[3/2]"} />
        )}
      </Link>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <Link href={`/${article.section.slug}`} style={{ color: article.section.color }}>
          {article.section.name}
        </Link>
        <span className="text-muted">· {fmtDate(article.publishedAt)}</span>
      </div>
      <h3 className={`mt-1 font-bold leading-tight ${size === "lg" ? "text-3xl" : "text-xl"}`}>
        <Link href={`/article/${article.slug}`} className="hover:text-accent">
          {article.title}
        </Link>
      </h3>
      {article.excerpt && (
        <p className="mt-2 line-clamp-2 text-base text-muted">{article.excerpt}</p>
      )}
      {article.author.name && (
        <p className="mt-2 text-sm text-muted">
          By{" "}
          <Link href={`/author/${article.author.id}`} className="hover:text-ink">
            {article.author.name}
          </Link>
        </p>
      )}
    </article>
  );
}
