"use client";

import { useState } from "react";

type Props = {
  name: string;
  label: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
};

/** Password input with a show/hide toggle. */
export function PasswordField({ name, label, required, minLength, autoComplete }: Props) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      <span className="flex items-stretch rounded-xl border border-line bg-surface transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
        <input
          name={name}
          type={show ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full rounded-l-xl bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted/70"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          aria-label={show ? "Hide password" : "Show password"}
          className="shrink-0 px-3.5 text-xs font-semibold text-muted hover:text-ink"
        >
          {show ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}
