"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerReader } from "./actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerReader, { error: "" });

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="font-display text-2xl font-extrabold">Create an account</h1>
      <p className="mt-1 text-sm text-muted">
        To comment, save articles, and get the newsletter.
      </p>

      {state?.error && (
        <p className="mt-4 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">{state.error}</p>
      )}

      <form action={action} className="mt-6 flex flex-col gap-4">
        <label className="text-sm">
          <span className="text-muted">Name</span>
          <input name="name" required className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
        </label>
        <label className="text-sm">
          <span className="text-muted">Email</span>
          <input name="email" type="email" required className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
        </label>
        <label className="text-sm">
          <span className="text-muted">Password</span>
          <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        Already have one?{" "}
        <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
