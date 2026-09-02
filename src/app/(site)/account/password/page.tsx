"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordField } from "@/components/password-field";
import { changePassword } from "./actions";

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
        <PasswordField name="current" label="Current password" required autoComplete="current-password" />
        <PasswordField name="next" label="New password" required minLength={10} autoComplete="new-password" />
        <PasswordField name="confirm" label="Confirm new password" required minLength={10} autoComplete="new-password" />
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
