import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { getSections } from "@/lib/queries";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const sections = await getSections();
  const year = new Date().getFullYear();

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:py-10">
        {children}
      </main>

      <footer className="mt-8 border-t border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1.4fr]">
            <div>
              <p className="font-display text-xl font-extrabold">Coco</p>
              <p className="mt-1.5 max-w-xs text-sm text-muted">
                News from Ghana and around the world, in one feed.
              </p>
            </div>

            <nav
              aria-label="Footer sections"
              className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm"
            >
              {sections.map((s) => (
                <Link key={s.slug} href={`/${s.slug}`} className="text-muted hover:text-ink">
                  {s.name}
                </Link>
              ))}
            </nav>

            <NewsletterSignup />
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} Cocodaily. Headlines curated from The Guardian and Ghanaian newsrooms.
            </p>
            <div className="flex gap-4">
              <Link href="/contribute" className="hover:text-ink">
                Write for Coco
              </Link>
              <Link href="/feed.xml" className="hover:text-ink">
                RSS
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
