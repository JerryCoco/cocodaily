import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-muted">
          <p className="font-bold text-ink">Marquee</p>
          <p>Entertainment news, reviews, and awards coverage.</p>
          <p className="mt-2">
            <Link href="/feed.xml" className="hover:text-ink">RSS</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
