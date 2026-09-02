"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(["READER", "WRITER", "EDITOR", "ADMIN"]),
});

export async function setUserRole(formData: FormData) {
  const me = await requireRole("ADMIN");
  const parsed = schema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;

  // An admin can't change their own role — stops the last admin locking everyone out.
  if (parsed.data.userId === me.id) return;

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  revalidatePath("/studio/users");
}
