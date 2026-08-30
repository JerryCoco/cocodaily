"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/actions/auth";

type Session = { user?: { name?: string | null; role?: string } };

export function HeaderAccount() {
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setSession(d ?? {}))
      .catch(() => setSession({}));
  }, []);

  if (session === null) return <div className="h-8 w-20" />; // reserve space
  const user = session.user;

  if (!user) {
    return (
      <Link href="/login" className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-bg">
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-bg"
      >
        {(user.name ?? "Account").split(" ")[0]} ▾
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-line bg-surface py-1 text-sm shadow-card"
          onMouseLeave={() => setOpen(false)}
        >
          <Link href="/account/saved" className="block px-3 py-2 hover:bg-bg">
            Saved articles
          </Link>
          {user.role && user.role !== "READER" && (
            <Link href="/studio" className="block px-3 py-2 hover:bg-bg">Newsroom</Link>
          )}
          <form action={signOutAction}>
            <button className="block w-full px-3 py-2 text-left text-muted hover:bg-bg hover:text-accent">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
