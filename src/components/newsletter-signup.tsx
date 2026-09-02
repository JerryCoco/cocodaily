"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/newsletter/actions";

export function NewsletterSignup() {
  const [state, action, pending] = useActionState(subscribeNewsletter, null);

  return (
    <div>
      <p className="font-display text-lg font-bold">The Coco briefing</p>
      <p className="mt-1 text-sm text-muted">
        The day&apos;s essential stories, once every morning.
      </p>
      <form action={action} className="mt-3 flex max-w-sm gap-2">
        <input
          type="email"
          name="email"
          required
          aria-label="Email address for the newsletter"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="press shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </form>
      {state && (
        <p className={`mt-2 text-xs ${state.ok ? "text-emerald-700" : "text-accent"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}
