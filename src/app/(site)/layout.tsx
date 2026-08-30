import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { NewsletterSignup } from "@/components/newsletter-signup";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-ink">Coco</p>
            <p className="mt-1 text-sm text-muted">
              Entertainment news, reviews, and awards coverage.
            </p>
            <p className="mt-3 text-sm">
              <Link href="/feed.xml" className="text-muted hover:text-ink">RSS</Link>
            </p>
          </div>
          <NewsletterSignup />
        </div>
      </footer>
    </>
  );
}
