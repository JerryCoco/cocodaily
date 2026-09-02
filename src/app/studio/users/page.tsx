import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { setUserRole } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "People" };

const ROLES: Role[] = ["READER", "WRITER", "EDITOR", "ADMIN"];
const ACTIVE_MS = 15 * 60_000;

const day = (d: Date | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const seenLabel = (d: Date | null) => {
  if (!d) return "never";
  const diff = Date.now() - new Date(d).getTime();
  if (diff < ACTIVE_MS) return "active now";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

export default async function UsersPage() {
  const me = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    orderBy: [{ lastSeenAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      lastSeenAt: true,
      _count: { select: { articles: true } },
    },
  });

  const activeCount = users.filter(
    (u) => u.lastSeenAt && Date.now() - new Date(u.lastSeenAt).getTime() < ACTIVE_MS,
  ).length;

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">People</h1>
      <p className="mt-1 text-sm text-muted">
        {users.length} accounts · {activeCount} active in the last 15 minutes. Sessions are
        stateless, so &ldquo;active&rdquo; means last seen loading the site.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-4 font-semibold">Person</th>
              <th className="py-2 pr-4 font-semibold">Role</th>
              <th className="py-2 pr-4 font-semibold">Articles</th>
              <th className="py-2 pr-4 font-semibold">Joined</th>
              <th className="py-2 pr-4 font-semibold">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u.id === me.id;
              const active =
                u.lastSeenAt && Date.now() - new Date(u.lastSeenAt).getTime() < ACTIVE_MS;
              return (
                <tr key={u.id} className="border-b border-line align-middle">
                  <td className="py-3 pr-4">
                    <div className="font-medium">
                      {u.name ?? "—"}
                      {isMe && <span className="ml-1 text-xs text-muted">(you)</span>}
                    </div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <form action={setUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        disabled={isMe}
                        className="rounded-md border border-line bg-surface px-2 py-1 text-sm disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.toLowerCase()}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={isMe}
                        className="rounded-md border border-line px-2 py-1 text-xs hover:bg-bg disabled:opacity-40"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{u._count.articles}</td>
                  <td className="py-3 pr-4 text-muted">{day(u.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <span className={active ? "font-medium text-emerald-600" : "text-muted"}>
                      {seenLabel(u.lastSeenAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
