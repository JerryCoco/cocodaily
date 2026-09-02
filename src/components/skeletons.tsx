/** Shared loading placeholders. The shimmer comes from `.img-skeleton` in globals.css. */

function Line({ w = "100%", h = 12 }: { w?: string; h?: number }) {
  return (
    <span
      className="img-skeleton block rounded"
      style={{ width: w, height: h }}
      aria-hidden
    />
  );
}

export function CardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className={`img-skeleton rounded-lg ${large ? "aspect-[16/9]" : "aspect-[3/2]"}`}
        aria-hidden
      />
      <Line w="38%" h={10} />
      <Line w={large ? "80%" : "95%"} h={large ? 26 : 18} />
      <Line w="60%" h={large ? 26 : 18} />
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-label="Loading articles"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-3xl" role="status" aria-label="Loading article">
      <Line w="30%" h={10} />
      <div className="mt-4 flex flex-col gap-3">
        <Line w="92%" h={38} />
        <Line w="70%" h={38} />
      </div>
      <div className="mt-5 flex gap-3">
        <Line w="120px" h={12} />
        <Line w="90px" h={12} />
      </div>
      <div className="img-skeleton mt-6 aspect-[16/9] rounded-lg" aria-hidden />
      <div className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Line key={i} w={i % 3 === 2 ? "72%" : "100%"} h={14} />
        ))}
      </div>
    </div>
  );
}
