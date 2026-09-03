"use client";

import { use, useActionState } from "react";
import { PasswordField } from "@/components/password-field";
import {
  AuthShell,
  FormNotice,
  primaryBtnClass,
  AuthFooterLink,
} from "@/components/ui/form-kit";
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
      <AuthShell title="Reset link missing">
        <p className="text-sm text-muted">
          Open the link from your email, or{" "}
          <AuthFooterLink href="/forgot-password">request a new one</AuthFooterLink>.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="At least 10 characters.">
      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <PasswordField
          name="next"
          label="New password"
          required
          minLength={10}
          autoComplete="new-password"
        />
        <PasswordField
          name="confirm"
          label="Confirm new password"
          required
          minLength={10}
          autoComplete="new-password"
        />
        <button type="submit" disabled={pending} className={primaryBtnClass}>
          {pending ? "Saving…" : "Set new password"}
        </button>
      </form>
    </AuthShell>
  );
}
