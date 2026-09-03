import Link from "next/link";
import type { ReactNode } from "react";

/** Shared field styling — crisp, generous touch targets. */
export const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/10";

export const primaryBtnClass =
  "press w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60";

/** Centered card wrapper for auth / account forms. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto mt-6 w-full max-w-[26rem] sm:mt-12">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.12)] sm:p-8">
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-4 px-1 text-sm text-muted">{footer}</div>}
    </div>
  );
}

export function FormNotice({ tone, children }: { tone: "ok" | "error"; children: ReactNode }) {
  return (
    <p
      className={`mb-4 rounded-xl px-3.5 py-2.5 text-sm ${
        tone === "ok"
          ? "bg-emerald-500/10 text-emerald-700"
          : "bg-accent/10 text-accent"
      }`}
    >
      {children}
    </p>
  );
}

export function TextField({
  name,
  label,
  type = "text",
  required,
  autoComplete,
  defaultValue,
  inputMode,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  inputMode?: "email" | "text" | "numeric";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        inputMode={inputMode}
        className={fieldClass}
      />
    </label>
  );
}

export function AuthFooterLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="font-medium text-accent hover:underline">
      {children}
    </Link>
  );
}
