import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";
import { PasswordField } from "@/components/password-field";
import {
  AuthShell,
  FormNotice,
  TextField,
  primaryBtnClass,
  AuthFooterLink,
} from "@/components/ui/form-kit";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session) redirect("/");
  const sp = await searchParams;
  const from = sp.from ?? sp.callbackUrl; // Auth.js redirects use ?callbackUrl
  const error = sp.error;
  const notice = sp.reset
    ? "Password updated — sign in with your new one."
    : sp.upgraded
      ? "You're a contributor now — sign in to open the newsroom."
      : null;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: typeof from === "string" ? from : "/",
      });
    } catch (err) {
      if (err instanceof AuthError) redirect(`/login?error=1`);
      throw err;
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Readers and newsroom staff."
      footer={
        <div className="flex items-center justify-between gap-3">
          <AuthFooterLink href="/forgot-password">Forgot password?</AuthFooterLink>
          <span>
            New here? <AuthFooterLink href="/register">Create an account</AuthFooterLink>
          </span>
        </div>
      }
    >
      {notice && <FormNotice tone="ok">{notice}</FormNotice>}
      {error && <FormNotice tone="error">Wrong email or password.</FormNotice>}

      <form action={login} className="flex flex-col gap-4">
        <TextField name="email" label="Email" type="email" required autoComplete="email" />
        <PasswordField name="password" label="Password" required autoComplete="current-password" />
        <button type="submit" className={primaryBtnClass}>
          Sign in
        </button>
      </form>
    </AuthShell>
  );
}
