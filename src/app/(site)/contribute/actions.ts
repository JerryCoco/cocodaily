"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { sendMail } from "@/lib/mail";
import { welcomeWriter, newWriterAlert } from "@/lib/mail-templates";

export async function becomeContributor() {
  const session = await requireUser("/contribute");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { role: true, name: true, email: true },
  });
  if (!user) redirect("/login");

  if (user.role === "READER") {
    await prisma.user.update({ where: { id: session.id }, data: { role: "WRITER" } });

    const name = user.name ?? "there";
    await sendMail({ to: user.email, ...welcomeWriter(name) });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    await Promise.all(
      admins.map((a) =>
        sendMail({ to: a.email, ...newWriterAlert({ name: user.name ?? "A reader", email: user.email }) }),
      ),
    );
  }

  redirect("/studio");
}
