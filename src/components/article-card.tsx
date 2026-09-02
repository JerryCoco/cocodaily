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
  d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

export function ArticleCard({ article, size = "md" }: { article: Card; size?: "md" | "lg" }) {
  const cover = article.coverMedia;
  const cld = cover?.publicId ? cldUrl(cover.publicId, { w: size === "lg" ? 1600 : 800 }) : "";
  const src = cover ? cld || cover.originalUrl : null;
  const isCld = Boolean(cld);
  const lg = size === "lg";

  return (
    <article className="group flex flex-col">
      <Link
        href={`/article/${article.slug}`}
        className={`press img-skeleton relative block overflow-hidden rounded-card ring-1 ring-line/70 ${
          lg ? "aspect-[16/10]" : "aspect-[3/2]"
        }`}
      >
        {src ? (
          <Image
            src={src}
            alt={cover!.alt}
            fill
            sizes={
              lg
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            }
            placeholder="blur"
            blurDataURL={shimmerDataURL}
            priority={lg}
            unoptimized={isCld}
            className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.04]"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${article.section.color}14, ${article.section.color}05)`,
            }}
          />
        )}
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <Link
          href={`/${article.section.slug}`}
          className="kicker hover:opacity-70"
          style={{ color: article.section.color }}
        >
          {article.section.name}
        </Link>
        <span aria-hidden className="h-1 w-1 rounded-full bg-line-strong" />
        <span className="text-xs text-muted">{fmtDate(article.publishedAt)}</span>
      </div>

      <h3
        className={`font-display mt-1.5 font-bold ${lg ? "text-3xl" : "text-xl"}`}
      >
        <Link
          href={`/article/${article.slug}`}
          className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-300 hover:bg-[length:100%_1px] hover:text-accent"
        >
          {article.title}
        </Link>
      </h3>

      {article.excerpt && (
        <p
          className={`mt-2 line-clamp-2 text-ink-soft ${lg ? "text-lg" : "text-[15px]"}`}
        >
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
