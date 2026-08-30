import Link from "next/link";
import { cldUrl } from "@/lib/cld-url";

type Card = {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  section: { name: string; slug: string; color: string };
  author: { id: string; name: string | null };
  coverMedia: { originalUrl: string; publicId: string | null; alt: string } | null;
};

const fmtDate = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export function ArticleCard({ article, size = "md" }: { article: Card; size?: "md" | "lg" }) {
  return (
    <article className="group flex flex-col">
      <Link
        href={`/article/${article.slug}`}
        className={`img-skeleton block overflow-hidden rounded-lg ${
          size === "lg" ? "aspect-[16/9]" : "aspect-[3/2]"
        }`}
      >
        {article.coverMedia && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cldUrl(article.coverMedia.publicId, {
              w: size === "lg" ? 1200 : 640,
              fallbackUrl: article.coverMedia.originalUrl,
            })}
            alt={article.coverMedia.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </Link>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <Link href={`/${article.section.slug}`} style={{ color: article.section.color }}>
          {article.section.name}
        </Link>
        <span className="text-muted">· {fmtDate(article.publishedAt)}</span>
      </div>
      <h3 className={`font-display mt-1.5 font-bold leading-[1.15] ${size === "lg" ? "text-3xl" : "text-xl"}`}>
        <Link href={`/article/${article.slug}`} className="hover:text-accent">
          {article.title}
        </Link>
      </h3>
      {article.excerpt && (
        <p className={`mt-2 line-clamp-2 text-muted ${size === "lg" ? "text-lg" : "text-base"}`}>
          {article.excerpt}
        </p>
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
