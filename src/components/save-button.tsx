"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSave } from "@/app/(site)/article/[slug]/actions";

export function SaveButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ signedIn: boolean; saved: boolean } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    fetch(`/api/reader/context?articleId=${articleId}`)
      .then((r) => r.json())
      .then((d) => setState({ signedIn: !!d.signedIn, saved: !!d.saved }))
      .catch(() => setState({ signedIn: false, saved: false }));
  }, [articleId]);

  function onClick() {
    if (!state?.signedIn) {
      router.push("/login?from=" + encodeURIComponent(location.pathname));
      return;
    }
    start(async () => {
      const res = await toggleSave(articleId);
      setState((s) => (s ? { ...s, saved: res.saved } : s));
    });
  }

  const saved = state?.saved ?? false;
  return (
    <button
      onClick={onClick}
      disabled={pending || state === null}
      aria-pressed={saved}
      className={`rounded-md border px-3 py-1 text-sm font-medium disabled:opacity-50 ${
        saved ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:bg-bg"
      }`}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
