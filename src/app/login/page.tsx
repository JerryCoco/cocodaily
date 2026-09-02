import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";
import { PasswordField } from "@/components/password-field";

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
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="font-display text-2xl font-extrabold">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Readers and newsroom staff.</p>

      {notice && (
        <p className="mt-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">
          Wrong email or password.
        </p>
      )}

      <form action={login} className="mt-6 flex flex-col gap-4">
        <label className="block text-sm">
          <span className="text-muted">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <PasswordField name="password" label="Password" required autoComplete="current-password" />
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Sign in
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <Link href="/forgot-password" className="text-accent hover:underline">
          Forgot password?
        </Link>
        <span>
          New here?{" "}
          <Link href="/register" className="text-accent hover:underline">Create an account</Link>
        </span>
      </div>
    </div>
  );
}
