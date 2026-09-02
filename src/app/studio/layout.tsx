import Link from "next/link";
import { requireStaff, canPublish } from "@/lib/auth-helpers";
import { signOut } from "@/auth";

export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const user = await requireStaff();
  const isEditor = canPublish(user.role);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-line bg-surface px-4 py-6">
        <Link href="/" className="font-display text-xl font-extrabold">
          Coco News
        </Link>
        <p className="mt-1 text-xs text-muted">Newsroom</p>

        <nav className="mt-6 flex flex-col gap-1 text-sm">
          <Link href="/studio" className="rounded-md px-3 py-2 hover:bg-bg">Articles</Link>
          <Link href="/studio/articles/new" className="rounded-md px-3 py-2 hover:bg-bg">New article</Link>
          {isEditor && (
            <>
              <Link href="/studio/comments" className="rounded-md px-3 py-2 hover:bg-bg">Comments</Link>
              <Link href="/studio/analytics" className="rounded-md px-3 py-2 hover:bg-bg">Analytics</Link>
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-line pt-4 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted">{user.role.toLowerCase()}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="mt-2 text-xs text-muted hover:text-accent">Sign out</button>
          </form>
        </div>
      </aside>

      <main id="main" className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
