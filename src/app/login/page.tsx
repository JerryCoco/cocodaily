import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session) redirect("/");
  const { from, error } = await searchParams;

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
      <h1 className="text-2xl font-extrabold">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Staff access to the newsroom.</p>

      {error && (
        <p className="mt-4 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">
          Wrong email or password.
        </p>
      )}

      <form action={login} className="mt-6 flex flex-col gap-4">
        <label className="text-sm">
          <span className="text-muted">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Password</span>
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Sign in
        </button>
      </form>

      <p className="mt-4 text-xs text-muted">
        Seeded editor: <code>ada@marquee.test</code> / <code>password123</code>
      </p>
    </div>
  );
}
