import Link from "next/link";
import { getSections } from "@/lib/queries";

export async function SiteHeader() {
  const sections = await getSections();
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          Marquee
        </Link>
        <nav className="hidden gap-4 text-sm font-medium text-muted sm:flex">
          {sections.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="hover:text-ink"
              style={{ ["--tw-underline" as string]: s.color }}
            >
              {s.name}
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          className="ml-auto rounded-md border border-line px-3 py-1.5 text-sm hover:bg-bg"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
