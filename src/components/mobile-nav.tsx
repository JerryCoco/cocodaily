"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Section = { slug: string; name: string; color: string };

export function MobileNav({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

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
        className="press flex h-10 w-10 items-center justify-center rounded-lg border border-line hover:bg-bg"
      >
        <span className="relative block h-3.5 w-[18px]" aria-hidden="true">
          <span
            className={`absolute left-0 block h-[2px] w-full rounded bg-ink transition-all duration-200 ${
              open ? "top-1.5 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 top-1.5 block h-[2px] w-full rounded bg-ink transition-opacity duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 block h-[2px] w-full rounded bg-ink transition-all duration-200 ${
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
            className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[1px]"
          />
          <div
            id="mobile-nav-panel"
            className="panel-in absolute inset-x-0 top-full z-50 border-b border-line bg-surface px-4 pb-5 pt-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.18)]"
          >
            <form action="/search" role="search" className="mb-4">
              <input
                type="search"
                name="q"
                autoComplete="off"
                aria-label="Search articles"
                placeholder="Search Cocodaily…"
                className="w-full rounded-lg border border-line bg-bg px-3.5 py-2.5 text-base outline-none focus:border-accent"
              />
            </form>

            <p className="kicker mb-2 text-muted">Sections</p>
            <nav aria-label="Sections" className="grid grid-cols-2 gap-2">
              {sections.map((s) => {
                const active = pathname === `/${s.slug}`;
                return (
                  <Link
                    key={s.slug}
                    href={`/${s.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`press flex items-center gap-2.5 rounded-lg border px-3 py-3 text-[15px] font-medium ${
                      active
                        ? "border-accent bg-accent-tint text-ink"
                        : "border-line hover:bg-bg"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-line pt-3 text-sm">
              <Link href="/contribute" className="font-medium text-accent hover:underline">
                Write for Coco →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
