"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { allow, limiters } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1, "Add your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerReader(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  }
  const { name, email, password } = parsed.data;

  if (!(await allow(limiters.register, `reg:${email}`))) {
    return { error: "Too many attempts. Try again later." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "That email is already registered — sign in instead." };

  await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10), role: "READER" },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    throw err;
  }
  return { error: "" };
}
