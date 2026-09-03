"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export function StudioNav({ items, orientation }: { items: Item[]; orientation: "side" | "top" }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/studio" ? pathname === "/studio" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Newsroom"
      className={
        orientation === "side"
          ? "mt-6 flex flex-col gap-0.5 text-sm"
          : "-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 text-sm"
      }
    >
      {items.map((it) => {
        const active = isActive(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`press whitespace-nowrap rounded-lg px-3 py-2 font-medium transition-colors ${
              active
                ? "bg-accent-tint text-accent"
                : "text-ink-soft hover:bg-bg hover:text-ink"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
