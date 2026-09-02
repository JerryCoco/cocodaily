"use client";

import Link from "next/link";
import { use } from "react";
import { useActionState } from "react";
import { PasswordField } from "@/components/password-field";
import { resetPassword } from "./actions";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = use(searchParams);
  const [state, action, pending] = useActionState(resetPassword, {});

  if (!token) {
    return (
      <div className="mx-auto mt-16 max-w-sm px-4">
        <h1 className="font-display text-2xl font-extrabold">Reset link missing</h1>
        <p className="mt-2 text-sm text-muted">
          Open the link from your email, or{" "}
          <Link href="/forgot-password" className="text-accent hover:underline">
            request a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="font-display text-2xl font-extrabold">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted">At least 10 characters.</p>

      {state.error && (
        <p className="mt-4 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">{state.error}</p>
      )}

      <form action={action} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <PasswordField name="next" label="New password" required minLength={10} autoComplete="new-password" />
        <PasswordField name="confirm" label="Confirm new password" required minLength={10} autoComplete="new-password" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Set new password"}
        </button>
      </form>
    </div>
  );
}
