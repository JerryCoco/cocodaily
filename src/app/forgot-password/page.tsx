"use client";

import { useActionState } from "react";
import {
  AuthShell,
  FormNotice,
  TextField,
  primaryBtnClass,
  AuthFooterLink,
} from "@/components/ui/form-kit";
import { requestReset } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestReset, null);

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send a link to set a new one."
      footer={
        <span>
          Remembered it? <AuthFooterLink href="/login">Sign in</AuthFooterLink>
        </span>
      }
    >
      {state && <FormNotice tone={state.ok ? "ok" : "error"}>{state.message}</FormNotice>}

      <form action={action} className="flex flex-col gap-4">
        <TextField name="email" label="Email" type="email" required autoComplete="email" />
        <button type="submit" disabled={pending} className={primaryBtnClass}>
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
