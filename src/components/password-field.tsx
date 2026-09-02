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
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <span className="mt-1 flex items-stretch rounded-md border border-line focus-within:border-accent">
        <input
          name={name}
          type={show ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full rounded-l-md bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          aria-label={show ? "Hide password" : "Show password"}
          className="shrink-0 px-3 text-xs font-medium text-muted hover:text-ink"
        >
          {show ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}
