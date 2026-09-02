import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const RANK: Record<Role, number> = { READER: 0, WRITER: 1, EDITOR: 2, ADMIN: 3 };

/** Session user or null. */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Require any signed-in user (READER included). Redirects to /login otherwise. */
export async function requireUser(from = "/") {
  const user = await getSessionUser();
  if (!user) redirect(`/login?from=${encodeURIComponent(from)}`);
  return user;
}

/** Require any signed-in staff (WRITER+). Redirects to /login otherwise.
 *  Falls back to a DB check when the JWT role is stale — e.g. a reader who
 *  just upgraded to contributor this session (their token catches up on next
 *  sign-in). */
export async function requireStaff() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from=/studio");
  if (RANK[user.role] >= RANK.WRITER) return user;

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (fresh && RANK[fresh.role] >= RANK.WRITER) return { ...user, role: fresh.role };
  redirect("/login?from=/studio");
}

/** Require at least `min` role. Throws (caught by the nearest error boundary)
 *  so it can be used inside server actions, not just page loads. */
export async function requireRole(min: Role) {
  const user = await getSessionUser();
  if (!user || RANK[user.role] < RANK[min]) {
    throw new Error("Forbidden: insufficient role");
  }
  return user;
}

export function canPublish(role: Role) {
  return RANK[role] >= RANK.EDITOR;
}
