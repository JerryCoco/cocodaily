import Link from "next/link";
import { requireStaff, canPublish } from "@/lib/auth-helpers";
import { signOut } from "@/auth";
import { StudioNav } from "@/components/studio/studio-nav";

export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const user = await requireStaff();
  const isEditor = canPublish(user.role);
  const isAdmin = user.role === "ADMIN";

  const items = [
    { href: "/studio", label: "Articles" },
    { href: "/studio/articles/new", label: "New article" },
    ...(isEditor
      ? [
          { href: "/studio/comments", label: "Comments" },
          { href: "/studio/analytics", label: "Analytics" },
        ]
      : []),
    ...(isAdmin ? [{ href: "/studio/users", label: "People" }] : []),
  ];

  const signOutForm = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button className="text-xs font-medium text-muted hover:text-accent">Sign out</button>
    </form>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <Link href="/" className="font-display text-xl font-extrabold">
          Coco
        </Link>
        <p className="mt-0.5 text-xs text-muted">Newsroom</p>

        <StudioNav items={items} orientation="side" />

        <div className="mt-auto border-t border-line pt-4">
          <p className="text-sm font-semibold">{user.name}</p>
          <span className="mt-1 inline-block rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium capitalize text-muted">
            {user.role.toLowerCase()}
          </span>
          <div className="mt-2">{signOutForm}</div>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <div className="sticky top-0 z-40 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <Link href="/" className="font-display text-lg font-extrabold">
              Coco
            </Link>
            <span className="text-xs text-muted">Newsroom</span>
          </div>
          {signOutForm}
        </div>
        <StudioNav items={items} orientation="top" />
      </div>

      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
