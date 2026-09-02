import Link from "next/link";
import Image from "next/image";
import { cldUrl } from "@/lib/cld-url";
import { shimmerDataURL } from "@/lib/shimmer";

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
  const cover = article.coverMedia;
  const cld = cover?.publicId
    ? cldUrl(cover.publicId, { w: size === "lg" ? 1600 : 800 })
    : "";
  const src = cover ? cld || cover.originalUrl : null;
  const isCld = Boolean(cld);

  return (
    <article className="group flex flex-col">
      <Link
        href={`/article/${article.slug}`}
        className={`img-skeleton relative block overflow-hidden rounded-lg ${
          size === "lg" ? "aspect-[16/9]" : "aspect-[3/2]"
        }`}
      >
        {src && (
          <Image
            src={src}
            alt={cover!.alt}
            fill
            sizes={
              size === "lg"
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            }
            placeholder="blur"
            blurDataURL={shimmerDataURL}
            priority={size === "lg"}
            unoptimized={isCld}
            className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.04]"
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
        <Link href={`/article/${article.slug}`} className="transition-colors hover:text-accent">
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
