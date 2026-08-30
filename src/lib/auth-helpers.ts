import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

/** Require any signed-in staff (WRITER+). Redirects to /login otherwise. */
export async function requireStaff() {
  const user = await getSessionUser();
  if (!user || RANK[user.role] < RANK.WRITER) redirect("/login?from=/studio");
  return user;
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
