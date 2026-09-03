"use client";

import { useActionState } from "react";
import { PasswordField } from "@/components/password-field";
import {
  AuthShell,
  FormNotice,
  primaryBtnClass,
  AuthFooterLink,
} from "@/components/ui/form-kit";
import { changePassword } from "./actions";

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState(changePassword, {});

  return (
    <AuthShell
      title="Change password"
      subtitle="Pick something at least 10 characters."
      footer={<AuthFooterLink href="/">← Back to Coco</AuthFooterLink>}
    >
      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}
      {state.ok && <FormNotice tone="ok">Password updated.</FormNotice>}

      <form action={action} className="flex flex-col gap-4">
        <PasswordField
          name="current"
          label="Current password"
          required
          autoComplete="current-password"
        />
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
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
