"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestReset } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestReset, null);

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="font-display text-2xl font-extrabold">Forgot password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your email and we&apos;ll send a link to set a new one.
      </p>

      {state && (
        <p
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            state.ok ? "bg-emerald-500/10 text-emerald-700" : "bg-accent/10 text-accent"
          }`}
        >
          {state.message}
        </p>
      )}

      <form action={action} className="mt-6 flex flex-col gap-4">
        <label className="text-sm">
          <span className="text-muted">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
