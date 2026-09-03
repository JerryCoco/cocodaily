"use client";

import { useActionState } from "react";
import { PasswordField } from "@/components/password-field";
import {
  AuthShell,
  FormNotice,
  TextField,
  primaryBtnClass,
  AuthFooterLink,
} from "@/components/ui/form-kit";
import { registerReader } from "./actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerReader, { error: "" });

  return (
    <AuthShell
      title="Create an account"
      subtitle="To comment, save articles, and get the briefing."
      footer={
        <span>
          Already have one? <AuthFooterLink href="/login">Sign in</AuthFooterLink>
        </span>
      }
    >
      {state?.error && <FormNotice tone="error">{state.error}</FormNotice>}

      <form action={action} className="flex flex-col gap-4">
        <TextField name="name" label="Name" required autoComplete="name" />
        <TextField name="email" label="Email" type="email" required autoComplete="email" />
        <PasswordField
          name="password"
          label="Password"
          required
          minLength={8}
          autoComplete="new-password"
        />

        <label className="flex items-start gap-3 rounded-xl border border-line bg-bg px-4 py-3.5 text-sm">
          <input name="contributor" type="checkbox" className="mt-0.5 h-4 w-4 accent-accent" />
          <span>
            <span className="font-semibold">I want to write for Coco</span>
            <span className="mt-0.5 block text-xs text-muted">
              Get a contributor account. Draft articles right away; an editor publishes them.
            </span>
          </span>
        </label>

        <button type="submit" disabled={pending} className={primaryBtnClass}>
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
