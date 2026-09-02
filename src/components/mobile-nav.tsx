"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Section = { slug: string; name: string; color: string };

export function MobileNav({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => setOpen(false), [pathname]);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-line hover:bg-bg"
      >
        <span className="relative block h-3.5 w-4" aria-hidden="true">
          <span
            className={`absolute left-0 block h-0.5 w-4 bg-ink transition-transform ${
              open ? "top-1.5 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 top-1.5 block h-0.5 w-4 bg-ink transition-opacity ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 block h-0.5 w-4 bg-ink transition-transform ${
              open ? "top-1.5 -rotate-45" : "top-3"
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          <button
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-ink/20"
          />
          <div
            id="mobile-nav-panel"
            className="absolute left-0 right-0 top-full z-50 border-b border-line bg-surface p-4 shadow-lg"
          >
            <form action="/search" role="search" className="mb-3">
              <input
                type="search"
                name="q"
                aria-label="Search articles"
                placeholder="Search…"
                className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </form>
            <nav aria-label="Sections" className="grid grid-cols-2 gap-1">
              {sections.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${s.slug}`}
                  className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-bg"
                >
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
