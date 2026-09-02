import Link from "next/link";
import { getSections } from "@/lib/queries";
import { HeaderAccount } from "./header-account";
import { MobileNav } from "./mobile-nav";

// Stays static/ISR-friendly — the auth-dependent bit is <HeaderAccount/>, a
// client component that reads /api/auth/session on its own.
export async function SiteHeader() {
  const sections = await getSections();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70">
      {/* masthead rule */}
      <div className="h-[3px] bg-accent" />

      <div className="mx-auto flex max-w-5xl items-center gap-x-6 px-4 py-3 md:py-4">
        <Link
          href="/"
          className="font-display text-[1.6rem] font-extrabold leading-none tracking-tight md:text-3xl"
        >
          Coco
        </Link>

        <nav
          aria-label="Sections"
          className="hidden gap-5 text-sm font-medium text-muted md:flex"
        >
          {sections.map((s) => (
            <Link key={s.slug} href={`/${s.slug}`} className="nav-underline hover:text-ink">
              {s.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <form action="/search" role="search" className="hidden sm:block">
            <input
              type="search"
              name="q"
              aria-label="Search articles"
              placeholder="Search…"
              className="w-40 rounded-md border border-line bg-bg px-3 py-1.5 text-sm outline-none transition-[width,border-color] focus:w-56 focus:border-accent"
            />
          </form>
          <HeaderAccount />
          <MobileNav sections={sections} />
        </div>
      </div>
    </header>
  );
}
