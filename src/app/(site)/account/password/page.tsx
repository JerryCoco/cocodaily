"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePassword } from "./actions";

const field =
  "mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent";

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState(changePassword, {});

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl font-extrabold">Change password</h1>
      <p className="mt-1 text-sm text-muted">Pick something at least 10 characters.</p>

      {state.error && (
        <p className="mt-4 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          Password updated.
        </p>
      )}

      <form action={action} className="mt-6 flex flex-col gap-4">
        <label className="text-sm">
          <span className="text-muted">Current password</span>
          <input name="current" type="password" required className={field} />
        </label>
        <label className="text-sm">
          <span className="text-muted">New password</span>
          <input name="next" type="password" required minLength={10} className={field} />
        </label>
        <label className="text-sm">
          <span className="text-muted">Confirm new password</span>
          <input name="confirm" type="password" required minLength={10} className={field} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        <Link href="/" className="text-accent hover:underline">← Back to Coco</Link>
      </p>
    </div>
  );
}
